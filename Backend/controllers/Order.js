import User from '../models/user.js';
import Lead from "../models/lead.js";
import { Order ,Counter} from '../models/order.js';
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js'
import Vendor from '../models/vendor.js';
import { PurchaseOrder } from '../models/purchase.js';
import sendEmail from '../sendEmail.js';
import CustomerRelationsRoundRobinState from '../models/customerRelationsRoundRobinState.js';
import ProcurementRoundRobinState from '../models/procurementRoundRobinState.js';

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
      status: "Available",
    });
    console.log("Customer Relations Team:", customerRelationsTeam.map(u => ({ id: u._id, name: u.name })));

    if (customerRelationsTeam.length === 0) {
      return res.status(400).json({ message: "No available customer relations team members found" });
    }

    // Find available procurement team members
    const procurementTeam = await User.find({
      role: "procurement",
      isPaused: false,
      status: "Available",
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
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
};//geting orderdetails by orderid


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
      corePrice,
      totalCost,
      rating = 0,
      warranty = '',
      mileage = 0,
    } = req.body;

    // Validate required fields
    if (!businessName || !phoneNumber || !email || !agentName || !costPrice || !shippingCost || !corePrice || !totalCost) {
      return res.status(400).json({ message: 'All required vendor fields must be provided' });
    }

    // Validate numeric fields
    if (isNaN(costPrice) || costPrice < 0 || isNaN(shippingCost) || shippingCost < 0 || isNaN(corePrice) || corePrice < 0 || isNaN(totalCost) || totalCost < 0) {
      return res.status(400).json({ message: 'Cost fields must be non-negative numbers' });
    }

    // Validate rating
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    // Create new vendor
    const vendor = new Vendor({
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
      mileage,
    });

    // Save vendor
    await vendor.save();

    // Find order and add vendor to it
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add vendor ID to order's vendors array
    order.vendors.push(vendor._id);
    await order.save();

    // Populate the vendors field in the response
    const updatedOrder = await Order.findById(orderId).populate('vendors');
    res.status(201).json({ message: 'Vendor added successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error adding vendor to order:', error);
    res.status(500).json({ message: 'Server error while adding vendor' });
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
export const getAllVendors = async (req, res) => {
    try {
      const vendors = await Vendor.find();
      console.log("Vendors list:",vendors);
      res.status(200).json(vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

//Send Purchase order controller
export const sendPurchaseorder = async (req, res) => {
  try {
    const { id } = req.params; // Order ID from the route
    console.log("Id of the order:", id);

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

    // Check if leadId exists and has partRequested
    if (!order.leadId || !order.leadId.partRequested) {
      console.error("Lead data missing or partRequested not set:", order.leadId);
      return res.status(400).json({ message: "Lead information or partRequested missing" });
    }

    // For simplicity, use the first vendor (modify for multiple vendors if needed)
    const vendor = order.vendors[0];

    // Generate a unique tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
        <a href="https://www.firstusedautoparts.com/preferences?email=${encodeURIComponent(vendor.email)}" style="color: #007BFF; text-decoration: none;">Manage email preferences</a>
      </p>
    </div>
    `;

    // Send email using the sendEmail utility
    await sendEmail(vendor.email, `Purchase Order for Order ID: ${order.order_id}`, htmlContent);

    // Update order status
    order.status = "Processing";
    await order.save();

    return res.status(200).json({ message: "Purchase order sent successfully" });
  } catch (error) {
    console.error("Error sending purchase order:", error);
    return res.status(500).json({ message: "Failed to send purchase order" });
  }
};