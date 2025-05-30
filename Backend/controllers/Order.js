import User from '../models/user.js';
import Lead from "../models/lead.js";
import { Order ,Counter} from '../models/order.js';
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js'
import Vendor from '../models/vendor.js';
import CustomerRelationsRoundRobinState from '../models/customerRelationsRoundRobinState.js';

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
    // const currentYear = new Date().getFullYear();
    // if (cardYear < currentYear || cardYear > currentYear + 10) {
    //   return res.status(400).json({ message: "Invalid or expired card year" });
    // }

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

    // Get or initialize round-robin state for customer relations
    let roundRobinState = await CustomerRelationsRoundRobinState.findOne();
    if (!roundRobinState) {
      roundRobinState = new CustomerRelationsRoundRobinState({ currentIndex: 0 });
      await roundRobinState.save();
    }
    console.log("Customer Relations RoundRobinState before assignment:", roundRobinState);

    // Ensure currentIndex is within bounds
    const currentIndex = roundRobinState.currentIndex % customerRelationsTeam.length;
    const customerRelationsPerson = customerRelationsTeam[currentIndex];
    console.log("Assigned Customer Relations Person:", { id: customerRelationsPerson._id, name: customerRelationsPerson.name });

    const order = new Order({
      leadId,
      salesPerson: lead.salesPerson,
      customerRelationsPerson: customerRelationsPerson._id,
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

    // Create notifications for admins
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      recipient: admin._id,
      message: `New order: ${clientName} - ${formattedAmount} assigned to ${customerRelationsPerson.name}`,
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

    // Update round-robin index
    const nextIndex = (currentIndex + 1) % customerRelationsTeam.length;
    roundRobinState.currentIndex = nextIndex;
    await roundRobinState.save();
    console.log("Updated Customer Relations RoundRobinState:", roundRobinState);

    // Send email to admins
    // const emailContent = `
    //   <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
    //     <h2 style="color: #333;">New Order Created</h2>
    //     <p><strong>Client Name:</strong> ${clientName}</p>
    //     <p><strong>Amount:</strong> ${formattedAmount}</p>
    //     <p><strong>Assigned to:</strong> ${customerRelationsPerson.name}</p>
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
};///getting salespersonsorder


  export const getAllOrders = async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('leadId', 'make model year partRequested clientName email totalCost')
        .populate('salesPerson', 'name email');
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  export const getMyOrders = async (req, res,next) => {
    console.log("getmyorders working")
    try {
      //const id = req.user.id; 
      const id = req.user.id
      console.log("id",id)
      const orders = await Order.find({ salesPerson: id })
        .populate('leadId', 'make model year partRequested clientName email totalCost')
        .populate('salesPerson', 'name email');
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching my orders:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const getCustomerOrders = async (req, res,next) => {
    console.log("getCustomerorders working")
    try {
      //const id = req.user.id; 
      const id = req.user.id
      console.log("id",id)
      const orders = await Order.find({ customerRelationsPerson: id })
        .populate('leadId', 'make model year partRequested clientName email totalCost')
        .populate('customerRelationsPerson', 'name email');
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching my orders:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  export const orderbyid = async (req, res) => {
  console.log("order working");
  try {
    const { id } = req.params;
    console.log("id", id);
    // Fetch order with populated leadId, salesPerson, customerRelationsPerson, and vendors
    const order = await Order.findById(id)
      .populate('leadId') // Populate lead details
      .populate('salesPerson', 'name email') // Populate salesperson name and email
      .populate('customerRelationsPerson', 'name email') // Populate customer relations person
      .populate('vendors'); // Populate vendor details

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
};


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