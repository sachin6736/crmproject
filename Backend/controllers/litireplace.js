import { Order } from "../models/order.js";
import Litigation from "../models/Litigation.js";
import sendEmail from "../sendEmail.js";

// Existing getLitigation controller
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
};//

export const createLitigation = async (req, res) => {
  try {
    const { orderId, deliveryDate, installationDate, problemOccurredDate, problemInformedDate, receivedPictures, receivedDiagnosticReport, problemDescription, resolutionNotes } = req.body;

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
export const updateLitigation = async (req, res) => {
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

export const sendRMAForm = async (req, res) => {
  const { id } = req.params; // orderId

  try {
    // Fetch the order to get leadId
    const order = await Order.findById(id).populate('leadId');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.leadId || !order.leadId.email) {
      return res.status(400).json({ message: "Customer email is missing" });
    }

    // Email content for RMA form
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e2e2; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598236/Picsart_24-04-02_10-36-01-714_xpnbgi.png" alt="First Used Autoparts Logo" style="max-width: 250px; margin-bottom: 24px;" />
        </div>
        
        <h2 style="color: #2a2a2a;">RMA Form Request - First Used Autoparts</h2>
        <p style="color: #555;">
          Dear ${order.leadId.clientName || "Customer"},<br />
          We have initiated a Return Merchandise Authorization (RMA) process for your order (Order ID: ${order.order_id || "N/A"}). Please complete the RMA form linked below to proceed with your return or replacement request.
        </p>
  
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Details</h3>
        <ul style="list-style: none; padding: 0; color: #333;">
          <li style="margin-bottom: 8px;"><strong>Order ID:</strong> ${order.order_id || "N/A"}</li>
          <li style="margin-bottom: 8px;"><strong>Part:</strong> ${order.leadId?.partRequested || "N/A"}</li>
          <li style="margin-bottom: 8px;"><strong>Make:</strong> ${order.leadId?.make || "N/A"}</li>
          <li style="margin-bottom: 8px;"><strong>Model:</strong> ${order.leadId?.model || "N/A"}</li>
          <li style="margin-bottom: 8px;"><strong>Year:</strong> ${order.leadId?.year || "N/A"}</li>
        </ul>
  
        <p style="color: #555;">
          Please click the link below to access and complete the RMA form:<br />
          <a href="https://www.firstusedautoparts.com/rma-form?orderId=${order._id}" style="color: #007BFF; text-decoration: none;">Complete RMA Form</a>
        </p>
  
        <p style="color: #555;">
          If you have any questions, reply to this email or call +1 888-282-7476.
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
          <a href="https://www.firstusedautoparts.com/preferences?email=${encodeURIComponent(order.leadId.email)}" style="color: #007BFF; text-decoration: none;">Manage email preferences</a>
        </p>
      </div>
    `;

    // Send the email
    await sendEmail(order.leadId.email, `RMA Form Request - Order ${order.order_id || "N/A"}`, htmlContent);
    res.status(200).json({ message: "RMA form sent successfully" });
  } catch (error) {
    console.error("Error sending RMA form:", error);
    res.status(500).json({ message: "Failed to send RMA form" });
  }
};

