import { Order } from "../models/order.js";

// Existing getLitigation controller
export const getLitigation = async (req, res, next) => {
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
      query.$or = [
        { clientName: searchRegex },
        { order_id: searchQuery },
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

// New controller to update order status
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

    order.status = status;
    await order.save();

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