import User from '../models/user.js';
import Lead from "../models/lead.js";
import { Order } from '../models/order.js';
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js';
import RoundRobinState from "../models/RoundRobinState.js";

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

    if (customerRelationsTeam.length === 0) {
      return res.status(400).json({ message: "No available customer relations team members found" });
    }

    // Get or initialize round-robin state for customer relations
    let roundRobinState = await RoundRobinState.findOne({ type: "customer_relations" });
    if (!roundRobinState) {
      roundRobinState = new RoundRobinState({ type: "customer_relations", currentIndex: 0 });
      await roundRobinState.save();
    }

    if (roundRobinState.currentIndex >= customerRelationsTeam.length) {
      roundRobinState.currentIndex = 0;
    }

    const currentIndex = roundRobinState.currentIndex % customerRelationsTeam.length;
    const customerRelationsPerson = customerRelationsTeam[currentIndex];

    // Create new order
    const order = new Order({
      leadId,
      salesPerson: lead.salesPerson,
      customerRelationsPerson: customerRelationsPerson._id, // Add customer relations person
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
      message: `Order created for the amount ${formattedAmount} against ${clientName}.`,
      type: "order_update",
      order: order._id,
    });
    await salesNotification.save();

    // Create notification for customer relations person
    const customerRelationsNotification = new Notification({
      recipient: customerRelationsPerson._id,
      message: `New order assigned: ${clientName} - ${formattedAmount}`,
      type: "new_order",
      order: order._id,
    });
    await customerRelationsNotification.save();

    // Create notifications for admins
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      recipient: admin._id,
      message: `New order: ${clientName} - ${formattedAmount} assigned to ${customerRelationsPerson.name}`,
      type: "new_order",
      order: order._id,
    }));
    await Notification.insertMany(adminNotifications);

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
        _id: adminNotifications[index]._id.toString(),
        recipient: admin._id,
        message: adminNotifications[index].message,
        type: adminNotifications[index].type,
        order: { _id: order._id.toString() },
        createdAt: now.toISOString(),
        isRead: false,
      });
    });

    // Update round-robin index
    const nextIndex = (currentIndex + 1) % customerRelationsTeam.length;
    roundRobinState.currentIndex = nextIndex;
    await roundRobinState.save();

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
};


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
    console.log("etmyordes working")
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


  export const orderbyid = async (req, res) => {
    console.log("order working")
    try {
      const {id} = req.params;
      console.log("id",id)
     // Fetch order with populated leadId and salesPerson
      const order = await Order.findById(id)
        .populate('leadId') // Populate lead details
        .populate('salesPerson', 'name email'); // Populate salesperson name and email (adjust fields as needed)
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.status(200).json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Server error while fetching order details' });
    }
  };