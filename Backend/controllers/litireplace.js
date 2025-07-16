import { Order } from "../models/order.js";
import Litigation from "../models/Litigation.js";

// Get litigation orders
export const litigation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied: User not authenticated" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search || "";
    const searchRegex = new RegExp(searchQuery, "i");

    const query = {
      status: { $in: ["Litigation", "Replacement", "Replacement Cancelled"] },
    };
    if (searchQuery) {
      const isNumericSearch = /^\d+$/.test(searchQuery);
      query.$or = [
        { clientName: searchRegex },
        { order_id: isNumericSearch ? searchQuery : { $regex: searchRegex } },
        { phone: searchRegex },
        { email: searchRegex },
        { "leadId.partRequested": searchRegex },
      ];
    }

    const orders = await Order.find(query)
      .select({
        order_id: 1,
        clientName: 1,
        phone: 1,
        email: 1,
        createdAt: 1,
        status: 1,
        leadId: 1,
        "vendors.totalCost": 1,
        "vendors.isConfirmed": 1,
        "vendors.poStatus": 1,
      })
      .populate("leadId", "name email phone partRequested")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);

    const transformedOrders = orders.map((order) => ({
      _id: order._id,
      order_id: order.order_id,
      clientName: order.clientName,
      phone: order.phone,
      email: order.email,
      date: order.createdAt,
      partRequested: order.leadId?.partRequested || "N/A",
      totalCost: order.vendors
        .filter((vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed")
        .map((vendor) => vendor.totalCost)[0] || 0,
      status: order.status || "N/A",
      leadId: order.leadId,
    }));

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders: transformedOrders,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error("Error fetching litigation orders:", error);
    return res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Update order status and create replacement order
export const updateOrderStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied: User not authenticated" });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "Locate Pending",
      "PO Pending",
      "PO Sent",
      "PO Confirmed",
      "Vendor Payment Pending",
      "Vendor Payment Confirmed",
      "Shipping Pending",
      "Ship Out",
      "Intransit",
      "Delivered",
      "Replacement",
      "Litigation",
      "Replacement Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(orderId).populate("leadId salesPerson customerRelationsPerson");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the status of the original order
    order.status = status;
    await order.save();

    // If status is "Replacement", create a new order with order_id suffixed with "R" or "R<number>"
    if (status === "Replacement") {
      let newOrderId = `${order.order_id}R`;
      let suffix = 1;

      // Check for existing replacement orders and increment suffix if needed
      while (await Order.findOne({ order_id: newOrderId })) {
        newOrderId = `${order.order_id}R${suffix}`;
        suffix++;
      }

      const newOrderData = {
        order_id: newOrderId,
        leadId: order.leadId,
        salesPerson: order.salesPerson,
        customerRelationsPerson: order.customerRelationsPerson,
        procurementPerson: order.procurementPerson,
        make: order.make,
        model: order.model,
        year: order.year,
        clientName: order.clientName,
        phone: order.phone,
        email: order.email,
        cardNumber: order.cardNumber,
        cardMonth: order.cardMonth,
        cardYear: order.cardYear,
        cvv: order.cvv,
        billingAddress: order.billingAddress,
        city: order.city,
        state: order.state,
        zip: order.zip,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingZip: order.shippingZip,
        weightAndDimensions: order.weightAndDimensions,
        carrierName: order.carrierName,
        trackingNumber: order.trackingNumber,
        bolNumber: order.bolNumber,
        trackingLink: order.trackingLink,
        amount: order.amount,
        status: "Locate Pending",
        picturesReceivedFromYard: order.picturesReceivedFromYard,
        picturesSentToCustomer: order.picturesSentToCustomer,
        vendors: order.vendors.map(vendor => ({ ...vendor.toObject() })),
        notes: order.notes.map(note => ({ ...note.toObject() })),
        procurementnotes: order.procurementnotes.map(note => ({ ...note.toObject() })),
      };

      const newOrder = new Order(newOrderData);
      await newOrder.save();
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Create litigation
export const createLitigation = async (req, res) => {
  try {
    const { orderId, pelota, installationDate, problemOccurredDate, problemInformedDate, receivedPictures, receivedDiagnosticReport, problemJonah, resolutionNotes } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Check if order exists and is in Litigation status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'Litigation') {
      return res.status(400).json({ message: 'Order is not in Litigation status' });
    }

    // Check if litigation already exists for this order
    const existingLitigation = await Litigation.findOne({ orderId });
    if (existingLitigation) {
      return res.status(400).json({ message: 'Litigation already exists for this order' });
    }

    // Create new litigation record
    const litigation = new Litigation({
      orderId,
      deliveryDate: deliveryDate || null,
      installationDate: installationDate || null,
      problemOccurredDate: problemOccurredDate || null,
      problemInformedDate: problemInformedDate || null,
      receivedPictures: receivedPictures || false,
      receivedDiagnosticReport: receivedDiagnosticReport || false,
      problemDescription: problemDescription || '',
      resolutionNotes: resolutionNotes || ''
    });

    await litigation.save();
    res.status(201).json({ message: 'Litigation created successfully', litigation });
  } catch (error) {
    console.error('Error creating litigation:', error);
    res.status(500).json({ message: error.message || 'Failed to create litigation' });
  }
};

// Update an existing litigation record
export const updateLitigation = async(req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryDate, installationDate, problemOccurredDate, problemInformedDate, receivedPictures, receivedDiagnosticReport, problemDescription, resolutionNotes } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Check if order exists and is in Litigation status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'Litigation') {
      return res.status(400).json({ message: 'Order is not in Litigation status' });
    }

    // Prepare update object
    const updateData = {
      deliveryDate: deliveryDate || null,
      installationDate: installationDate || null,
      problemOccurredDate: problemOccurredDate || null,
      problemInformedDate: problemInformedDate || null,
      receivedPictures: receivedPictures || false,
      receivedDiagnosticReport: receivedDiagnosticReport || false,
      problemDescription: problemDescription || '',
      resolutionNotes: resolutionNotes || ''
    };

    // Update or create litigation record (upsert)
    const litigation = await Litigation.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Litigation updated successfully', litigation });
  } catch (error) {
    console.error('Error updating litigation:', error);
    res.status(500).json({ message: error.message || 'Failed to update litigation' });
  }
};

// Get litigation details for an order
export const getLitigation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const litigation = await Litigation.findOne({ orderId });
    if (!litigation) {
      return res.status(404).json({ message: 'Litigation not found' });
    }
    res.status(200).json(litigation);
  } catch (error) {
    console.error('Error fetching litigation:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch litigation' });
  }
};