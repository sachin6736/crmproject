import User from '../models/user.js';
import Lead from "../models/lead.js";
import { Order ,Counter} from '../models/order.js';
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js'
//import Vendor from '../models/vendor.js';
import { PurchaseOrder } from '../models/purchase.js';
import sendEmail from '../sendEmail.js';
import CustomerRelationsRoundRobinState from '../models/customerRelationsRoundRobinState.js';
import ProcurementRoundRobinState from '../models/procurementRoundRobinState.js';
import VendorSimple from '../models/VendorSimple.js.js';

export const createOrder = async (req, res) => {
  try {
    const {
      leadId,
      make,
      model,
      year,
      clientName,
      phone,
      email,
      cardNumber,
      cardMonth,
      cardYear,
      cvv,
      billingAddress,
      city,
      state,
      zip,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      amount,
    } = req.body;

    // Check if all required fields are provided
    if (
      !leadId ||
      !make ||
      !model ||
      !year ||
      !clientName ||
      !phone ||
      !email ||
      !cardNumber ||
      !cardMonth ||
      !cardYear ||
      !cvv ||
      !billingAddress ||
      !city ||
      !state ||
      !zip ||
      !shippingAddress ||
      !shippingCity ||
      !shippingState ||
      !shippingZip ||
      !amount
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Validate card number
    if (!/^\d{16}$/.test(cardNumber)) {
      return res.status(400).json({ message: "Card number must be 16 digits" });
    }

    // Validate card month and year
    if (cardMonth < 1 || cardMonth > 12) {
      return res.status(400).json({ message: "Invalid card month" });
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: "CVV must be 3 or 4 digits" });
    }

    // Check if an order already exists for this leadId
    const existingOrder = await Order.findOne({ leadId });
    if (existingOrder) {
      return res.status(400).json({ message: "An order already exists for this lead" });
    }

    // Validate lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    if (!lead.salesPerson) {
      return res.status(400).json({ message: "Lead has no assigned salesperson" });
    }

    // Find the salesperson
    const salesPerson = await User.findById(lead.salesPerson);
    if (!salesPerson) {
      return res.status(404).json({ message: "Salesperson not found" });
    }

    // Find available customer relations team members
    const customerRelationsTeam = await User.find({
      role: "customer_relations",
      isPaused: false,
      // status: "Available",
    });
    console.log("Customer Relations Team:", customerRelationsTeam.map(u => ({ id: u._id, name: u.name })));

    if (customerRelationsTeam.length === 0) {
      return res.status(400).json({ message: "No available customer relations team members found" });
    }

    // Find available procurement team members
    const procurementTeam = await User.find({
      role: "procurement",
      isPaused: false,
      // status: "Available",
    });
    console.log("Procurement Team:", procurementTeam.map(u => ({ id: u._id, name: u.name })));

    if (procurementTeam.length === 0) {
      return res.status(400).json({ message: "No available procurement team members found" });
    }

    // Get or initialize round-robin state for customer relations
    let customerRelationsRoundRobinState = await CustomerRelationsRoundRobinState.findOne();
    if (!customerRelationsRoundRobinState) {
      customerRelationsRoundRobinState = new CustomerRelationsRoundRobinState({ currentIndex: 0 });
      await customerRelationsRoundRobinState.save();
    }
    console.log("Customer Relations RoundRobinState before assignment:", customerRelationsRoundRobinState);

    // Get or initialize round-robin state for procurement
    let procurementRoundRobinState = await ProcurementRoundRobinState.findOne();
    if (!procurementRoundRobinState) {
      procurementRoundRobinState = new ProcurementRoundRobinState({ currentIndex: 0 });
      await procurementRoundRobinState.save();
    }
    console.log("Procurement RoundRobinState before assignment:", procurementRoundRobinState);

    // Ensure currentIndex is within bounds for customer relations
    const customerRelationsIndex = customerRelationsRoundRobinState.currentIndex % customerRelationsTeam.length;
    const customerRelationsPerson = customerRelationsTeam[customerRelationsIndex];
    console.log("Assigned Customer Relations Person:", { id: customerRelationsPerson._id, name: customerRelationsPerson.name });

    // Ensure currentIndex is within bounds for procurement
    const procurementIndex = procurementRoundRobinState.currentIndex % procurementTeam.length;
    const procurementPerson = procurementTeam[procurementIndex];
    console.log("Assigned Procurement Person:", { id: procurementPerson._id, name: procurementPerson.name });

    const order = new Order({
      leadId,
      salesPerson: lead.salesPerson,
      customerRelationsPerson: customerRelationsPerson._id,
      procurementPerson: procurementPerson._id,
      make,
      model,
      year,
      clientName,
      phone,
      email,
      cardNumber,
      cardMonth,
      cardYear,
      cvv,
      billingAddress,
      city,
      state,
      zip,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      amount: parseFloat(amount),
    });

    await order.save();

    // Format amount for notifications
    const formattedAmount = `$${parseFloat(amount).toFixed(2)}`;

    // Create notification for salesperson
    const salesNotification = new Notification({
      recipient: salesPerson._id,
      message: `Order created for ${clientName} for ${formattedAmount}.`,
      type: "order_update",
      order: order._id,
    });
    await salesNotification.save();

    // Create notification for customer relations person
    const customerRelationsNotification = new Notification({
      recipient: customerRelationsPerson._id,
      message: `New order assigned: ${clientName} - ${formattedAmount}`,
      type: "order_update",
      order: order._id,
    });
    await customerRelationsNotification.save();

    // Create notification for procurement person
    const procurementNotification = new Notification({
      recipient: procurementPerson._id,
      message: `New order assigned: ${clientName} - ${formattedAmount}`,
      type: "order_update",
      order: order._id,
    });
    await procurementNotification.save();

    // Create notifications for admins
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      recipient: admin._id,
      message: `New order: ${clientName} - ${formattedAmount} assigned to ${customerRelationsPerson.name} (Customer Relations) and ${procurementPerson.name} (Procurement)`,
      type: "order_update",
      order: order._id,
    }));
    const savedAdminNotifications = await Notification.insertMany(adminNotifications);

    // Emit notification to salesperson
    io.to(salesPerson._id.toString()).emit("newNotification", {
      _id: salesNotification._id.toString(),
      recipient: salesNotification.recipient,
      message: salesNotification.message,
      type: salesNotification.type,
      order: { _id: order._id.toString() },
      createdAt: salesNotification.createdAt.toISOString(),
      isRead: salesNotification.isRead,
    });

    // Emit notification to customer relations person
    io.to(customerRelationsPerson._id.toString()).emit("newNotification", {
      _id: customerRelationsNotification._id.toString(),
      recipient: customerRelationsNotification.recipient,
      message: customerRelationsNotification.message,
      type: customerRelationsNotification.type,
      order: { _id: order._id.toString() },
      createdAt: customerRelationsNotification.createdAt.toISOString(),
      isRead: customerRelationsNotification.isRead,
    });

    // Emit notification to procurement person
    io.to(procurementPerson._id.toString()).emit("newNotification", {
      _id: procurementNotification._id.toString(),
      recipient: procurementNotification.recipient,
      message: procurementNotification.message,
      type: procurementNotification.type,
      order: { _id: order._id.toString() },
      createdAt: procurementNotification.createdAt.toISOString(),
      isRead: procurementNotification.isRead,
    });

    // Emit notifications to admins
    const now = new Date();
    admins.forEach((admin, index) => {
      io.to(admin._id.toString()).emit("newNotification", {
        _id: savedAdminNotifications[index]._id.toString(),
        recipient: admin._id,
        message: savedAdminNotifications[index].message,
        type: savedAdminNotifications[index].type,
        order: { _id: order._id.toString() },
        createdAt: now.toISOString(),
        isRead: false,
      });
    });

    // Update round-robin indices
    const nextCustomerRelationsIndex = (customerRelationsIndex + 1) % customerRelationsTeam.length;
    customerRelationsRoundRobinState.currentIndex = nextCustomerRelationsIndex;
    await customerRelationsRoundRobinState.save();
    console.log("Updated Customer Relations RoundRobinState:", customerRelationsRoundRobinState);

    const nextProcurementIndex = (procurementIndex + 1) % procurementTeam.length;
    procurementRoundRobinState.currentIndex = nextProcurementIndex;
    await procurementRoundRobinState.save();
    console.log("Updated Procurement RoundRobinState:", procurementRoundRobinState);

    // const emailContent = `
    //   <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
    //     <h2 style="color: #333;">New Order Created</h2>
    //     <p><strong>Client Name:</strong> ${clientName}</p>
    //     <p><strong>Amount:</strong> ${formattedAmount}</p>
    //     <p><strong>Assigned to Customer Relations:</strong> ${customerRelationsPerson.name}</p>
    //     <p><strong>Assigned to Procurement:</strong> ${procurementPerson.name}</p>
    //     <p><strong>Make:</strong> ${make}</p>
    //     <p><strong>Model:</strong> ${model}</p>
    //     <p><strong>Year:</strong> ${year}</p>
    //     <hr>
    //     <p style="color: gray;">This is an automated email from your CRM system.</p>
    //   </div>
    // `;
    // await sendEmail(ADMIN_EMAIL, "New Order Created", emailContent);

    res.status(201).json({ message: "Order created successfully and notifications sent" });
  } catch (error) {
    console.log("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const checkOrderByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;
    const order = await Order.findOne({ leadId })
      .populate("leadId", "make model year partRequested clientName email totalCost")
      .populate("salesPerson", "name email");
    if (!order) {
      return res.status(404).json({ message: "No order found for this lead" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error checking order:", error);
    res.status(500).json({ message: "Server error" });
  }
};///getting ordersbyleadid


  export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const query = {};

    if (search) {
      const isNumericSearch = !isNaN(search) && search.trim() !== '';
      query.$or = [
        ...(isNumericSearch ? [{ order_id: Number(search) }] : []), // Exact match for order_id if numeric
        { clientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'leadId.partRequested': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('leadId', 'make model year partRequested clientName email totalCost')
      .populate('salesPerson', 'name email')
      .populate('customerRelationsPerson', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};//Controller for All orders

export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const id = req.user.id;
    const query = { salesPerson: id };

    if (search) {
      const isNumericSearch = !isNaN(search) && search.trim() !== '';
      query.$or = [
        ...(isNumericSearch ? [{ order_id: Number(search) }] : []), // Exact match for order_id if numeric
        { clientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'leadId.partRequested': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('leadId', 'make model year partRequested clientName email totalCost')
      .populate('salesPerson', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};//controller for getmyorders

export const getCustomerOrders = async (req, res) => {
  console.log("getCustomerOrders working");
  try {
    const userId = req.user.id;
    console.log("id", userId);
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const query = {};

    if (search) {
      const isNumericSearch = !isNaN(search) && search.trim() !== '';
      query.$or = [
        ...(isNumericSearch ? [{ order_id: Number(search) }] : []), // Exact match for order_id if numeric
        { clientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'leadId.partRequested': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('leadId', 'make model year partRequested clientName email totalCost')
      .populate('customerRelationsPerson', 'name email')
      .populate('salesPerson', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ customerRelationsPerson: userId ? -1 : 1 }) // Prioritize user's orders
      .lean();

    // Add isOwnOrder flag to each order
    const ordersWithFlag = orders.map(order => ({
      ...order,
      isOwnOrder: order.customerRelationsPerson?._id.toString() === userId.toString(),
    }));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders: ordersWithFlag,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};//controller for customerrelation

export const getProcurementOrders = async (req, res) => {
  console.log("getProcurementOrders working");
  try {
    const userId = req.user.id;
    console.log("id", userId);
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const query = { procurementPerson: userId }; // Filter by procurementPerson

    if (search) {
      const isNumericSearch = !isNaN(search) && search.trim() !== '';
      query.$or = [
        ...(isNumericSearch ? [{ order_id: Number(search) }] : []), // Exact match for order_id if numeric
        { clientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'leadId.partRequested': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('leadId', 'make model year partRequested clientName email totalCost')
      .populate('customerRelationsPerson', 'name email')
      .populate('procurementPerson', 'name email')
      .populate('salesPerson', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean();

    // Add isOwnOrder flag to each order
    const ordersWithFlag = orders.map(order => ({
      ...order,
      isOwnOrder: order.procurementPerson?._id.toString() === userId.toString(),
    }));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders: ordersWithFlag,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching procurement orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};// procurement team


  export const orderbyid = async (req, res) => {
  console.log("order working");
  try {
    const { id } = req.params;
    console.log("id", id);
    const userId = req.user.id
    // Fetch order with populated leadId, salesPerson, customerRelationsPerson, and vendors
    const order = await Order.findById(id)
      .populate('leadId') // Populate lead details
      .populate('salesPerson', 'name email') // Populate salesperson name and email
      .populate('customerRelationsPerson', 'name email') // Populate customer relations person
      .populate('vendors'); // Populate vendor details

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const user = await User.findById(userId).select('name role');
    if (
      user &&
      user.role === 'customer_relations' &&
      order.customerRelationsPerson &&
      order.customerRelationsPerson._id.toString() !== userId.toString()
    ) {
      // Add a note to the order
      const noteText = `Order accessed by ${user.name} on ${new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`;
      order.notes.push({ text: noteText, createdAt: new Date() });
      await order.save();
    }
    res.status(200).json(order);
    console.log("this",order)
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
};//geting orderdetails by orderid
//==============================
export const createVendorSimple = async (req, res) => {
  try {
    const { businessName, phoneNumber, email, agentName, address, rating } = req.body;

    // Validate required fields
    if (!businessName || !phoneNumber || !email) {
      return res.status(400).json({ message: 'Business name, phone number, and email are required' });
    }

    // Check for duplicate vendor by email and businessName
    const existingVendor = await VendorSimple.findOne({ 
      email: email.toLowerCase(), 
      businessName: businessName.trim()
    });
    if (existingVendor) {
      return res.status(409).json({ message: 'Vendor with this email and business name already exists' });
    }

    // Create new vendor
    const vendor = new VendorSimple({
      businessName,
      phoneNumber,
      email,
      agentName: agentName || undefined,
      address: address || undefined,
      rating: rating !== undefined ? Number(rating) : undefined
    });

    // Save to database
    await vendor.save();

    res.status(201).json({ message: 'Vendor created successfully', vendor });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};//creating vendor

export const getVendorSimpleList = async (req, res) => {
  try {
    const vendors = await VendorSimple.find().select('businessName phoneNumber email agentName rating ');
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//Add vendortoorder
export const addVendorToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      businessName,
      phoneNumber,
      email,
      agentName,
      costPrice,
      shippingCost,
      totalCost,
      corePrice,
      rating,
      warranty,
      mileage
    } = req.body;

    // Validate required fields
    if (
      !businessName ||
      !phoneNumber ||
      !email ||
      !agentName ||
      costPrice == null ||
      shippingCost == null ||
      totalCost == null
    ) {
      return res.status(400).json({ message: 'Required fields: businessName, phoneNumber, email, agentName, costPrice, shippingCost, totalCost' });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get the authenticated user's name (assuming req.user is set by auth middleware)
    const userName = req.user?.name || 'Unknown User';

    // Create procurement note
    const procurementNote = {
      text: `Vendor ${businessName} associated by ${userName} with total cost $${totalCost}`,
      createdAt: new Date()
    };

    // Create vendor note
    const vendorNote = {
      text: `Vendor associated by ${userName} with total cost $${totalCost}`,
      createdAt: new Date()
    };

    // Create order status note
    const statusNote = {
      text: `Order status changed to PO Pending by ${userName}`,
      createdAt: new Date()
    };

    // Add vendor to order with notes array
    order.vendors.push({
      businessName,
      phoneNumber,
      email,
      agentName,
      costPrice,
      shippingCost,
      corePrice: corePrice || 0,
      totalCost,
      rating: rating || 0,
      warranty: warranty || '',
      mileage: mileage || 0,
      isConfirmed: false,
      notes: [vendorNote]
    });

    // Add procurement note to order
    order.procurementnotes.push(procurementNote);

    // Add status note to order notes
    order.notes.push(statusNote);

    // Update order status to PO Pending
    order.status = 'PO Pending';

    await order.save();

    res.status(200).json({ message: 'Vendor added to order successfully', order });
  } catch (error) {
    console.error('Error adding vendor to order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateVendorPOStatus = async (req, res) => {
  console.log("update po status working");
  try {
    // Check user authorization
    if (!req.user || req.user.Access !== true) {
      return res.status(403).json({ message: "Access denied: User does not have permission to update vendor status" });
    }

    const { orderId, vendorId } = req.params;
    const { poStatus } = req.body;

    // Validate input
    if (!["PO Confirmed", "PO Canceled"].includes(poStatus)) {
      return res.status(400).json({ message: "Invalid PO status. Must be 'PO Confirmed' or 'PO Canceled'" });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the vendor
    const vendor = order.vendors.find((v) => v._id.toString() === vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found for this order" });
    }

    // Check if current poStatus allows update
    if (!["PO Sent", "PO Confirmed"].includes(vendor.poStatus)) {
      return res.status(400).json({ message: "PO status can only be updated from 'PO Sent' or 'PO Confirmed'" });
    }

    // Prevent setting the same status
    if (vendor.poStatus === poStatus) {
      return res.status(400).json({ message: `PO status is already ${poStatus}` });
    }
    // Update vendor poStatus
    vendor.poStatus = poStatus;
    // Add vendor note
    vendor.notes = vendor.notes || [];
    const userName = req.user?.name || "Unknown User";
    vendor.notes.push({
      text: `PO status changed to ${poStatus} by ${userName}`,
      createdAt: new Date(),
    });

    // Add procurement note for poStatus change
    order.procurementnotes.push({
      text: `PO status for ${vendor.businessName} changed to ${poStatus} by ${userName}`,
      createdAt: new Date(),
    });

    // Update order status and add notes for status change
    if (poStatus === "PO Confirmed") {
      // Step 1: Set order status to PO Confirmed
      order.status = "PO Confirmed";
      const poConfirmedNote = `Status changed to PO Confirmed due to PO confirmation from ${vendor.businessName} by ${userName}`;
      order.procurementnotes.push({
        text: poConfirmedNote,
        createdAt: new Date(),
      });
      order.notes.push({
        text: poConfirmedNote,
        createdAt: new Date(),
      });

      // Step 2: Immediately set order status to Vendor Payment Pending
      order.status = "Vendor Payment Pending";
      const vendorPaymentPendingNote = `Status changed to Vendor Payment Pending after PO confirmation from ${vendor.businessName} by ${userName}`;
      order.procurementnotes.push({
        text: vendorPaymentPendingNote,
        createdAt: new Date(),
      });
      order.notes.push({
        text: vendorPaymentPendingNote,
        createdAt: new Date(),
      });
    } else if (poStatus === "PO Canceled") {
      // Check if any other vendor has poStatus = "PO Pending"
      const hasPendingVendor = order.vendors.some(
        (v) => v._id.toString() !== vendorId && v.poStatus === "PO Pending"
      );
      // Set order status
      const newStatus = hasPendingVendor ? "PO Pending" : "Locate Pending";
      order.status = newStatus;
      // Add notes for order status change
      const statusNote = `Status changed to ${newStatus} due to PO cancelation from ${vendor.businessName} by ${userName}`;
      order.procurementnotes.push({
        text: statusNote,
        createdAt: new Date(),
      });
      order.notes.push({
        text: statusNote,
        createdAt: new Date(),
      });
    }

    // Save the order
    await order.save();
    return res.status(200).json({ message: `Vendor PO updated to ${poStatus} successfully`, order });
  } catch (error) {
    console.error("Error updating vendor PO status:", error);
    return res.status(500).json({ message: "Failed to update vendor PO status", error: error.message });
  }
};

export const confirmVendorPayment = async (req, res) => {
  try {
    // Check user authorization
    if (!req.user || req.user.Access !== true) {
      return res.status(403).json({ message: "Access denied: User does not have permission to confirm payment" });
    }

    const { orderId, vendorId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the vendor
    const vendor = order.vendors.find((v) => v._id.toString() === vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found for this order" });
    }

    // Check if the order status allows payment confirmation
    if (order.status !== "Vendor Payment Pending") {
      return res.status(400).json({ message: "Payment can only be confirmed when order status is 'Vendor Payment Pending'" });
    }

    // Update order status to Vendor Payment Confirmed
    order.status = "Vendor Payment Confirmed";

    // Add vendor note for payment confirmation
    const userName = req.user?.name || "Unknown User";
    vendor.notes = vendor.notes || [];
    vendor.notes.push({
      text: `Payment confirmed by ${userName}`,
      createdAt: new Date(),
    });

    // Add procurement note for payment confirmation
    order.procurementnotes.push({
      text: `Payment confirmed for ${vendor.businessName} by ${userName}`,
      createdAt: new Date(),
    });

    // Add order note for payment confirmation
    order.notes.push({
      text: `Order status changed to Vendor Payment Confirmed for ${vendor.businessName} by ${userName}`,
      createdAt: new Date(),
    });

    // Save the order
    await order.save();

    return res.status(200).json({ message: "Vendor payment confirmed successfully", order });
  } catch (error) {
    console.error("Error confirming vendor payment:", error);
    return res.status(500).json({ message: "Failed to confirm vendor payment", error: error.message });
  }
};

export const updateVendorDetails = async (req, res) => {
  try {
    const { orderId, vendorId } = req.params;
    const {
      businessName,
      phoneNumber,
      email,
      agentName,
      costPrice,
      shippingCost,
      corePrice,
      totalCost,
      rating,
      warranty,
      mileage
    } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the vendor
    const vendor = order.vendors.id(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found in order' });
    }

    // Get the authenticated user's name (assuming req.user is set by auth middleware)
    const userName = req.user?.name || 'Unknown User';

    // Track changes for notes
    const changes = [];
    if (businessName && businessName !== vendor.businessName) {
      changes.push(`businessName changed from "${vendor.businessName}" to "${businessName}"`);
      vendor.businessName = businessName;
    }
    if (phoneNumber && phoneNumber !== vendor.phoneNumber) {
      changes.push(`phoneNumber changed from "${vendor.phoneNumber}" to "${phoneNumber}"`);
      vendor.phoneNumber = phoneNumber;
    }
    if (email && email !== vendor.email) {
      changes.push(`email changed from "${vendor.email}" to "${email}"`);
      vendor.email = email;
    }
    if (agentName && agentName !== vendor.agentName) {
      changes.push(`agentName changed from "${vendor.agentName}" to "${agentName}"`);
      vendor.agentName = agentName;
    }
    if (costPrice != null && costPrice !== vendor.costPrice) {
      changes.push(`costPrice changed from $${vendor.costPrice.toFixed(2)} to $${costPrice.toFixed(2)}`);
      vendor.costPrice = costPrice;
    }
    if (shippingCost != null && shippingCost !== vendor.shippingCost) {
      changes.push(`shippingCost changed from $${vendor.shippingCost.toFixed(2)} to $${shippingCost.toFixed(2)}`);
      vendor.shippingCost = shippingCost;
    }
    if (corePrice != null && corePrice !== vendor.corePrice) {
      changes.push(`corePrice changed from $${vendor.corePrice.toFixed(2)} to $${corePrice.toFixed(2)}`);
      vendor.corePrice = corePrice;
    }
    if (totalCost != null && totalCost !== vendor.totalCost) {
      changes.push(`totalCost changed from $${vendor.totalCost.toFixed(2)} to $${totalCost.toFixed(2)}`);
      vendor.totalCost = totalCost;
    }
    if (rating != null && rating !== vendor.rating) {
      changes.push(`rating changed from ${vendor.rating} to ${rating}`);
      vendor.rating = rating;
    }
    if (warranty != null && warranty !== vendor.warranty) {
      changes.push(`warranty changed from "${vendor.warranty}" to "${warranty}"`);
      vendor.warranty = warranty;
    }
    if (mileage != null && mileage !== vendor.mileage) {
      changes.push(`mileage changed from ${vendor.mileage} to ${mileage}`);
      vendor.mileage = mileage;
    }

    // If there are changes, add notes to order.notes, vendor.notes, and order.procurementnotes
    if (changes.length > 0) {
      const changeText = `Vendor details updated by ${userName}: ${changes.join(', ')}`;
      const note = {
        text: changeText,
        createdAt: new Date(),
      };

      // Add to order notes
      order.notes.push(note);

      // Add to vendor notes
      vendor.notes = vendor.notes || [];
      vendor.notes.push(note);

      // Add to procurement notes
      order.procurementnotes.push(note);
    }

    await order.save();

    res.status(200).json({ message: 'Vendor details updated successfully', order });
  } catch (error) {
    console.error('Error updating vendor details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const addNoteToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;

    // Validate note
    if (!note || typeof note !== 'string' || note.trim() === '') {
      return res.status(400).json({ message: 'Note is required and must be a non-empty string' });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add note to order
    order.notes.push({ text: note.trim(), createdAt: new Date() });
    await order.save();

    // Populate relevant fields in the response
    const updatedOrder = await Order.findById(orderId)
      .populate('leadId')
      .populate('salesPerson', 'name email')
      .populate('customerRelationsPerson', 'name email')
      .populate('vendors');
    res.status(201).json({ message: 'Note added successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error adding note to order:', error);
    res.status(500).json({ message: 'Server error while adding note' });
  }
};

//Get All vendors controller
// export const getAllVendors = async (req, res) => {
//     try {
//       const vendors = await Vendor.find();
//       console.log("Vendors list:",vendors);
//       res.status(200).json(vendors);
//     } catch (error) {
//       console.error('Error fetching vendors:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };

//Send Purchase order controller
export const sendPurchaseorder = async (req, res) => {
  try {
    if (!req.user || req.user.Access !== true) {
      return res.status(403).json({ message: "Access denied: User does not have permission to send purchase orders" });
    }
    const { id } = req.params; // Order ID from the route
    const { vendorId } = req.query; // Get vendorId from query
    console.log("Id of the order:", id, "Vendor ID:", vendorId);

    // Fetch the order with vendor and lead details
    const order = await Order.findById(id).populate("vendors").populate("leadId");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Order data:", order);
    console.log("Lead data:", order.leadId);

    // Check if there is at least one vendor
    if (!order.vendors || order.vendors.length === 0) {
      return res.status(400).json({ message: "No vendor details available for this order" });
    }

    // Check if any vendor has PO Sent or PO Confirmed
    const hasActivePO = order.vendors.some(v => ["PO Sent", "PO Confirmed"].includes(v.poStatus));
    if (hasActivePO) {
      return res.status(400).json({ message: "Cannot send PO: Order already has a vendor with PO Sent or PO Confirmed" });
    }

    // Find the specific vendor by vendorId
    const vendor = order.vendors.find((v) => v._id.toString() === vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found for this order" });
    }

    // Check if PO has already been sent, confirmed, or canceled for this vendor
    if (["PO Sent", "PO Confirmed", "PO Canceled"].includes(vendor.poStatus)) {
      return res.status(400).json({ message: `Purchase order is already ${vendor.poStatus.toLowerCase() || "Unknown"}` });
    }

    // Check if leadId exists and has partRequested
    if (!order.leadId || !order.leadId.partRequested) {
      console.error("Lead data missing or partRequested not set:", order.leadId);
      return res.status(400).json({ message: "Lead information or partRequested missing" });
    }

    // Generate a unique tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Generate invoice number (e.g., 2-01, 2-02)
    const existingPOs = await PurchaseOrder.countDocuments({ orderId: id });
    const sequence = (existingPOs + 1).toString().padStart(2, "0"); // e.g., 01, 02
    const invoiceNumber = `${order.order_id}-${sequence}`; // e.g., 2-01

    // Create a new purchase order
    const purchaseOrder = new PurchaseOrder({
      businessName: vendor.businessName,
      phoneNumber: vendor.phoneNumber,
      email: vendor.email,
      agentName: vendor.agentName,
      costPrice: vendor.costPrice,
      shippingCost: vendor.shippingCost,
      corePrice: vendor.corePrice,
      totalCost: vendor.totalCost,
      trackingNumber,
      carrierName: "Default Carrier",
      estimatedArrivalTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "Pending",
      notes: "",
      invoiceNumber,
      orderId: id,
    });

    // Save the purchase order to the database
    await purchaseOrder.save();

    // Prepare email content with styling similar to leadQuotation
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e2e2; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center;">
        <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598236/Picsart_24-04-02_10-36-01-714_xpnbgi.png" alt="First Used Autoparts Logo" style="max-width: 250px; margin-bottom: 24px;" />
      </div>
      
      <h2 style="color: #2a2a2a;">Purchase Order Details</h2>
      <p style="color: #555;">
        Dear ${vendor.businessName || "Vendor"},<br />
        Thank you for your partnership. Below are the details of the purchase order.
      </p>
  
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Information</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Invoice Number:</strong> ${invoiceNumber}</li>
        <li style="margin-bottom: 8px;"><strong>Order ID:</strong> ${order.order_id || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Vendor Name:</strong> ${vendor.businessName || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Agent Name:</strong> ${vendor.agentName || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Phone Number:</strong> ${vendor.phoneNumber || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Email:</strong> ${vendor.email || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Cost Price:</strong> $${vendor.costPrice?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping Cost:</strong> $${vendor.shippingCost?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Core Price:</strong> $${vendor.corePrice?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Total Cost:</strong> $${vendor.totalCost?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Tracking Number:</strong> ${trackingNumber}</li>
        <li style="margin-bottom: 8px;"><strong>Carrier Name:</strong> Default Carrier</li>
        <li style="margin-bottom: 8px;"><strong>Estimated Arrival Time:</strong> ${purchaseOrder.estimatedArrivalTime.toLocaleDateString()}</li>
      </ul>
      
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Specifications</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Part Requested:</strong> ${order.leadId.partRequested || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Make:</strong> ${order.make || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Model:</strong> ${order.model || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Year:</strong> ${order.year || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Trim:</strong> ${order.leadId.trim || "N/A"}</li>
      </ul>
      
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Billing Information</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Billing Address:</strong> ${order.billingAddress || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>City:</strong> ${order.city || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>State:</strong> ${order.state?.toUpperCase() || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Zip:</strong> ${order.zip || "N/A"}</li>
      </ul>
      
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Shipping Information</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Shipping Address:</strong> ${order.shippingAddress || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping City:</strong> ${order.shippingCity || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping State:</strong> ${order.shippingState?.toUpperCase() || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping Zip:</strong> ${order.shippingZip || "N/A"}</li>
      </ul>
      
      <p style="color: #555;">
        To proceed or ask questions, reply to this email or call +1 888-282-7476.
      </p>
  
      <p style="color: #555;">Best regards,<br />
      <strong>First Used Autoparts Team</strong></p>
  
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #ddd;" />
  
      <div style="font-size: 14px; color: #888;">
        <p><strong>Address:</strong><br />
        330 N Brand Blvd, STE 700<br />
        Glendale, California 91203</p>
  
        <p><strong>Contact:</strong><br />
        +1 888-282-7476<br />
        <a href="mailto:contact@firstusedautoparts.com" style="color: #007BFF; text-decoration: none;">contact@firstusedautoparts.com</a></p>
      </div>
  
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://www.facebook.com/profile.php?id=61558228601060" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599473/fb_n6h6ja.png" alt="Facebook" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://www.linkedin.com/company/first-used-auto-parts/" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599377/linkedin_v3pufc.png" alt="LinkedIn" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://www.instagram.com/first_used_auto_parts/" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598983/10462345_g4oluw.png" alt="Instagram" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://twitter.com/parts54611" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599425/twitter_kivbi6.png" alt="X" style="width: 32px; height: 32px;" />
        </a>
      </div>
      
      <p style="text-align: center; margin-top: 10px;">
        <a href="https://www.facebook.com/profile.php?id=61558228601060" style="color: #007BFF; margin: 0 5px;">Facebook</a> |
        <a href="https://www.linkedin.com/company/first-used-auto-parts/" style="color: #007BFF; margin: 0 5px;">LinkedIn</a> |
        <a href="https://www.instagram.com/first_used_auto_parts/" style="color: #007BFF; margin: 0 5px;">Instagram</a> |
        <a href="https://twitter.com/parts54611" style="color: #007BFF; margin: 0 5px;">X</a>
      </p>
      
      <p style="text-align: center; font-size: 12px; color: #aaa;">
        © ${new Date().getFullYear()} First Used Autoparts. All rights reserved.<br />
        <a href="https://www.firstusedautoparts.com/preferences?email=${encodeURIComponent(vendor.email)}" style="color: #007BFF; text-decoration: none;">Manage email preferences</a>
      </p>
    </div>
    `;

    // Send email using the sendEmail utility
    await sendEmail(vendor.email, `Purchase Order for Invoice: ${invoiceNumber}`, htmlContent);

    // Update vendor's poStatus to PO Sent
    vendor.poStatus = "PO Sent";

    // Update order status to PO Sent if not already set
    if (order.status !== "PO Confirmed") {
      order.status = "PO Sent";
    }

    // Add procurement note for sending purchase order
    const userName = req.user?.name || "Unknown User";
    order.procurementnotes.push({
      text: `PO sent by ${userName}-invoice number ${invoiceNumber} to ${vendor.businessName} for $${vendor.totalCost.toFixed(2)} `,
      createdAt: new Date(),
    });

    // Add vendor note for sending purchase order
    vendor.notes = vendor.notes || [];
    vendor.notes.push({
      text: `PO sent by ${userName}-invoice number ${invoiceNumber} to ${vendor.businessName} for $${vendor.totalCost.toFixed(2)}`,
      createdAt: new Date(),
    });

    // Add order status note for status change
    if (order.status === "PO Sent") {
      order.notes.push({
        text: `Order status changed to PO Sent by ${userName} for invoice ${invoiceNumber}`,
        createdAt: new Date(),
      });
    }

    // Save the updated order
    await order.save();

    return res.status(200).json({ message: "Purchase order sent successfully and order status set to PO Sent" });
  } catch (error) {
    console.error("Error sending purchase order:", error);
    return res.status(500).json({ message: "Failed to send purchase order" });
  }
};
//===========================================================================================
//purchase order preview
export const previewPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId } = req.query; // Get vendorId from query
    console.log("Id of the order for preview:", id, "Vendor ID:", vendorId);

    const order = await Order.findById(id).populate("vendors").populate("leadId");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.vendors || order.vendors.length === 0) {
      return res.status(400).json({ message: "No vendor details available for this order" });
    }

    if (!order.leadId || !order.leadId.partRequested) {
      console.error("Lead data missing or partRequested not set:", order.leadId);
      return res.status(400).json({ message: "Lead information or partRequested missing" });
    }

    // Find the specific vendor by vendorId
    const vendor = order.vendors.find((v) => v._id.toString() === vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found for this order" });
    }

    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e2e2; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center;">
        <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598236/Picsart_24-04-02_10-36-01-714_xpnbgi.png" alt="First Used Autoparts Logo" style="max-width: 250px; margin-bottom: 24px;" />
      </div>
      
      <h2 style="color: #2a2a2a;">Purchase Order Details</h2>
      <p style="color: #555;">
        Dear ${vendor.businessName || "Vendor"},<br />
        Thank you for your partnership. Below are the details of the purchase order.
      </p>
  
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Information</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Order ID:</strong> ${order.order_id || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Vendor Name:</strong> ${vendor.businessName || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Agent Name:</strong> ${vendor.agentName || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Phone Number:</strong> ${vendor.phoneNumber || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Email:</strong> ${vendor.email || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Cost Price:</strong> $${vendor.costPrice?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping Cost:</strong> $${vendor.shippingCost?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Core Price:</strong> $${vendor.corePrice?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Total Cost:</strong> $${vendor.totalCost?.toFixed(2) || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Tracking Number:</strong> ${trackingNumber}</li>
        <li style="margin-bottom: 8px;"><strong>Carrier Name:</strong> Default Carrier</li>
        <li style="margin-bottom: 8px;"><strong>Estimated Arrival Time:</strong> ${new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString()}</li>
      </ul>
      
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Specifications</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Part Requested:</strong> ${order.leadId.partRequested || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Make:</strong> ${order.make || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Model:</strong> ${order.model || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Year:</strong> ${order.year || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Trim:</strong> ${order.leadId.trim || "N/A"}</li>
      </ul>
      
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Billing Information</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Billing Address:</strong> ${order.billingAddress || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>City:</strong> ${order.city || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>State:</strong> ${order.state?.toUpperCase() || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Zip:</strong> ${order.zip || "N/A"}</li>
      </ul>
      
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Shipping Information</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Shipping Address:</strong> ${order.shippingAddress || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping City:</strong> ${order.shippingCity || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping State:</strong> ${order.shippingState?.toUpperCase() || "N/A"}</li>
        <li style="margin-bottom: 8px;"><strong>Shipping Zip:</strong> ${order.shippingZip || "N/A"}</li>
      </ul>
      
      <p style="color: #555;">
        To proceed or ask questions, reply to this email or call +1 888-282-7476.
      </p>
  
      <p style="color: #555;">Best regards,<br />
      <strong>First Used Autoparts Team</strong></p>
  
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #ddd;" />
  
      <div style="font-size: 14px; color: #888;">
        <p><strong>Address:</strong><br />
        330 N Brand Blvd, STE 700<br />
        Glendale, California 91203</p>
  
        <p><strong>Contact:</strong><br />
        +1 888-282-7476<br />
        <a href="mailto:contact@firstusedautoparts.com" style="color: #007BFF; text-decoration: none;">contact@firstusedautoparts.com</a></p>
      </div>
  
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://www.facebook.com/profile.php?id=61558228601060" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599473/fb_n6h6ja.png" alt="Facebook" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://www.linkedin.com/company/first-used-auto-parts/" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599377/linkedin_v3pufc.png" alt="LinkedIn" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://www.instagram.com/first_used_auto_parts/" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598983/10462345_g4oluw.png" alt="Instagram" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://twitter.com/parts54611" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599225/twitter_kivbi6.png" alt="X" style="width: 32px; height: 32px;" />
        </a>
      </div>
      
      <p style="text-align: center; margin-top: 10px;">
        <a href="https://www.facebook.com/profile.php?id=61558228601060" style="color: #007BFF; margin: 0 5px;">Facebook</a> |
        <a href="https://www.linkedin.com/company/first-used-auto-parts/" style="color: #007BFF; margin: 0 5px;">LinkedIn</a> |
        <a href="https://www.instagram.com/first_used_auto_parts/" style="color: #007BFF; margin: 0 5px;">Instagram</a> |
        <a href="https://twitter.com/parts54611" style="color: #007BFF; margin: 0 5px;">X</a>
      </p>
  
      <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
        © ${new Date().getFullYear()} First Used Autoparts. All rights reserved.<br />
        <a href="https://www.firstusedautoparts.com/preferences?email=${encodeURIComponent(
          vendor.email
        )}" style="color: #007BFF; text-decoration: none;">Manage email preferences</a>
      </p>
    </div>
    `;

    return res.status(200).json({ htmlContent });
  } catch (error) {
    console.error("Error previewing purchase order:", error);
    return res.status(500).json({ message: "Failed to preview purchase order" });
  }
};
//=================================================
//Change order status Controller
export const changeOrderStatus=async(req,res)=>{
  console.log("Edit order status controller working");
  
  try{
  const id=req.params.id;
  console.log("Id to change order status",id);
  const {status}=req.body;
  console.log("newstatus",status);
  const order=await Order.findById(id);
   if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    order.status = status;
   
    console.log("User Role testing", req.user);
    const userIdentity = req?.user?.name || req?.user?.id || "Unknown User";
    order.notes.push({
      text: `changed to order '${status}' by ${userIdentity}`,
      addedBy: userIdentity,
      createdAt: new Date(),
    });
    await order.save();
    return res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.log("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

//=========================================================procurement notes
export const addProcurementNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;
    const user = req.user; // From auth middleware

    // Validate input
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({ message: 'Note is required and must be a non-empty string.' });
    }

    // Check user role
    if (!['procurement', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized. Procurement or admin role required.' });
    }

    // Find and update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Add procurement note
    order.procurementnotes.push({
      text: note.trim(),
      createdAt: new Date(),
    });

    await order.save();

    res.status(200).json({ message: 'Procurement note added successfully.', order });
  } catch (error) {
    console.error('Error adding procurement note:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const updateOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      clientName,
      phone,
      email,
      billingAddress,
      city,
      state,
      zip,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      make,
      model,
      year,
    } = req.body;
    const user = req.user;

    // Validate user role
    if (!['customer_relations', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized. Only customer relations or admin can update order details.' });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate required fields
    if (
      !clientName || !phone || !email ||
      !billingAddress || !city || !state || !zip ||
      !shippingAddress || !shippingCity || !shippingState || !shippingZip ||
      !make || !model || !year
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone format (basic validation, adjust as needed)
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      return res.status(400).json({ message: 'Invalid year' });
    }

    // Update order details
    order.clientName = clientName;
    order.phone = phone;
    order.email = email;
    order.billingAddress = billingAddress;
    order.city = city;
    order.state = state.toUpperCase();
    order.zip = zip;
    order.shippingAddress = shippingAddress;
    order.shippingCity = shippingCity;
    order.shippingState = shippingState.toUpperCase();
    order.shippingZip = shippingZip;
    order.make = make;
    order.model = model;
    order.year = year;

    // Add note for the update
    const userIdentity = user.name || user.id || 'Unknown User';
    order.notes.push({
      text: `Order details updated by ${userIdentity}`,
      addedBy: userIdentity,
      createdAt: new Date(),
    });

    // Save updated order
    await order.save();

    // Fetch updated order with populated fields
    const updatedOrder = await Order.findById(orderId)
      .populate('leadId')
      .populate('salesPerson', 'name email')
      .populate('customerRelationsPerson', 'name email')
      .populate('vendors');
      console.log("Updated order:",updatedOrder);
      

    res.status(200).json({ message: 'Order details updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order details:', error);
    res.status(500).json({ message: 'Server error while updating order details' });
  }
};

export const updateShipmentDetails = async (req, res) => {
  console.log("update shipping working")
  try {
    const { orderId } = req.params;
    const { weight, height, width, carrierName, trackingNumber, bolNumber, trackingLink } = req.body;
    const user = req.user; // Assumed to be set by authentication middleware

    // Validate required fields
    if (!weight || !height || !width || !carrierName || !trackingNumber) {
      return res.status(400).json({ message: 'Weight, height, width, carrier name, and tracking number are required' });
    }

    // Validate trackingLink if provided
    if (trackingLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(trackingLink)) {
      return res.status(400).json({ message: 'Invalid tracking link URL' });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Store previous values for change detection
    const previousValues = {
      weight: order.weightAndDimensions?.weight,
      height: order.weightAndDimensions?.height,
      width: order.weightAndDimensions?.width,
      carrierName: order.carrierName,
      trackingNumber: order.trackingNumber,
      bolNumber: order.bolNumber,
      trackingLink: order.trackingLink,
    };

    // Update shipment details
    order.weightAndDimensions = { weight, height, width };
    order.carrierName = carrierName;
    order.trackingNumber = trackingNumber;
    order.bolNumber = bolNumber || order.bolNumber; // Preserve existing value if not provided
    order.trackingLink = trackingLink || order.trackingLink; // Preserve existing value if not provided

    // Detect changes for note
    const changes = [];
    if (weight !== previousValues.weight) {
      changes.push(`weight changed from "${previousValues.weight || 'N/A'}" to "${weight}"`);
    }
    if (height !== previousValues.height) {
      changes.push(`height changed from "${previousValues.height || 'N/A'}" to "${height}"`);
    }
    if (width !== previousValues.width) {
      changes.push(`width changed from "${previousValues.width || 'N/A'}" to "${width}"`);
    }
    if (carrierName !== previousValues.carrierName) {
      changes.push(`carrierName changed from "${previousValues.carrierName || 'N/A'}" to "${carrierName}"`);
    }
    if (trackingNumber !== previousValues.trackingNumber) {
      changes.push(`trackingNumber changed from "${previousValues.trackingNumber || 'N/A'}" to "${trackingNumber}"`);
    }
    if (bolNumber && bolNumber !== previousValues.bolNumber) {
      changes.push(`bolNumber changed from "${previousValues.bolNumber || 'N/A'}" to "${bolNumber}"`);
    }
    if (trackingLink && trackingLink !== previousValues.trackingLink) {
      changes.push(`trackingLink changed from "${previousValues.trackingLink || 'N/A'}" to "${trackingLink}"`);
    }

    // Add note if there are changes
    if (changes.length > 0) {
      order.notes.push({
        text: `Shipment details updated by ${user.name || user.email || 'Unknown User'}: ${changes.join('; ')}`,
        createdAt: new Date(),
      });
    }

    // Save the updated order
    await order.save();

    res.status(200).json({ message: 'Shipment details updated successfully', order });
  } catch (error) {
    console.error('Error updating shipment details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};