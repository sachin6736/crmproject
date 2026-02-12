import { Order } from "../models/order.js";
import Litigation from "../models/Litigation.js";
import sendEmail from "../sendEmail.js";

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
      status: { $in: ["Litigation", "Replacement", "Replacement Cancelled" , "Resolved"] },
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

    let replacementCreated = false;
    let newOrder = null;

    if (status === "Replacement") {
      // Check if replacement already exists
      const existingReplacement = await Order.findOne({
        litigationTrackId: order._id.toString(),
      });

      if (existingReplacement) {
        return res.status(200).json({
          message: "Replacement order already exists",
          originalOrder: order,
          replacementOrder: existingReplacement,
          alreadyExists: true,
        });
      }

      // Create new replacement order
      let newOrderId = `${order.order_id}R`;
      let suffix = 1;

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
        weightAndDimensions: { weight: null, height: null, width: null },
        carrierName: "",
        trackingNumber: "",
        bolNumber: "",
        trackingLink: "",
        amount: order.amount,
        status: "Locate Pending",
        picturesReceivedFromYard: false,
        picturesSentToCustomer: false,
        vendors: [],
        notes: [],
        procurementnotes: [],
        litigationTrackId: order._id.toString(),
      };

      newOrder = new Order(newOrderData);
      await newOrder.save();
      replacementCreated = true;

      // Note on original order (optional – you can keep or remove)
      order.notes = order.notes || [];
      order.notes.push({
        text: `Replacement order created: ${newOrder.order_id}`,
        createdAt: new Date(),
      });

      // IMPORTANT: Add note to Litigation.litigationNotes
      const litigation = await Litigation.findOne({ orderId: order._id });
      if (litigation) {
        litigation.litigationNotes = litigation.litigationNotes || [];
        litigation.litigationNotes.push({
          text: `Replacement order created: ${newOrder.order_id}`,
          createdBy: req.user._id,
          createdByName: req.user.name || "System",
          createdAt: new Date(),
        });
        await litigation.save();
      }
    }

    // Update status
    if (replacementCreated || status !== "Replacement") {
      order.status = status;
      await order.save();
    }

    return res.status(replacementCreated ? 201 : 200).json({
      message: replacementCreated 
        ? "Replacement order created successfully" 
        : "Order status updated successfully",
      originalOrder: order,
      replacementOrder: newOrder,
      alreadyExists: !replacementCreated && status === "Replacement",
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
export const updateLitigation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      deliveryDate,
      installationDate,
      problemOccurredDate,
      problemInformedDate,
      receivedPictures,
      receivedDiagnosticReport,
      problemDescription,
      resolutionNotes,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user?._id;
    const userName = req.user?.name || "Unknown User";

    const parseSafeDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    let litigation = await Litigation.findOne({ orderId });

    const changes = [];

    // ────────────────────────────────────────────────
    // AUTO-REVERT ONLY WHEN STATUS IS "Resolved"
    // ────────────────────────────────────────────────
    let statusReverted = false;
    if (order.status === "Resolved") {
      order.status = "Litigation";
      statusReverted = true;

      order.notes = order.notes || [];
      order.notes.push({
        text: `Status automatically reverted to Litigation because litigation form was updated after resolution by ${userName}`,
        createdAt: new Date(),
      });
    }
    // ────────────────────────────────────────────────

    // Capture previous state BEFORE any changes (for history)
    const previousState = litigation ? { ...litigation.toObject() } : null;

    if (!litigation) {
      // Create new litigation record
      litigation = new Litigation({
        orderId,
        deliveryDate: parseSafeDate(deliveryDate),
        installationDate: parseSafeDate(installationDate),
        problemOccurredDate: parseSafeDate(problemOccurredDate),
        problemInformedDate: parseSafeDate(problemInformedDate),
        receivedPictures: receivedPictures ?? false,
        receivedDiagnosticReport: receivedDiagnosticReport ?? false,
        problemDescription: problemDescription?.trim() ?? "",
        resolutionNotes: resolutionNotes?.trim() ?? "",
        history: [],
        litigationNotes: [],
      });
    } else {
      // Detect changes for history
      const datesDiffer = (a, b) => (a ? a.toISOString() : null) !== (b ? b.toISOString() : null);

      if (deliveryDate !== undefined && datesDiffer(parseSafeDate(deliveryDate), litigation.deliveryDate))
        changes.push("deliveryDate");
      if (installationDate !== undefined && datesDiffer(parseSafeDate(installationDate), litigation.installationDate))
        changes.push("installationDate");
      if (problemOccurredDate !== undefined && datesDiffer(parseSafeDate(problemOccurredDate), litigation.problemOccurredDate))
        changes.push("problemOccurredDate");
      if (problemInformedDate !== undefined && datesDiffer(parseSafeDate(problemInformedDate), litigation.problemInformedDate))
        changes.push("problemInformedDate");

      if (receivedPictures !== undefined && !!receivedPictures !== litigation.receivedPictures)
        changes.push("receivedPictures");
      if (receivedDiagnosticReport !== undefined && !!receivedDiagnosticReport !== litigation.receivedDiagnosticReport)
        changes.push("receivedDiagnosticReport");

      if (problemDescription !== undefined && problemDescription.trim() !== (litigation.problemDescription || "").trim())
        changes.push("problemDescription");
      if (resolutionNotes !== undefined && resolutionNotes.trim() !== (litigation.resolutionNotes || "").trim())
        changes.push("resolutionNotes");

      // Save old state to history if anything changed
      if (changes.length > 0 && previousState) {
        litigation.history.push({
          ...previousState,
          updatedBy: userId || null,
          updatedByName: userName,
          updatedAt: new Date(),
          changeSummary: `Updated${statusReverted ? " (status reverted)" : ""}: ${changes.join(", ")}`
        });
      }

      // Apply updates
      litigation.deliveryDate = deliveryDate !== undefined ? parseSafeDate(deliveryDate) : litigation.deliveryDate;
      litigation.installationDate = installationDate !== undefined ? parseSafeDate(installationDate) : litigation.installationDate;
      litigation.problemOccurredDate = problemOccurredDate !== undefined ? parseSafeDate(problemOccurredDate) : litigation.problemOccurredDate;
      litigation.problemInformedDate = problemInformedDate !== undefined ? parseSafeDate(problemInformedDate) : litigation.problemInformedDate;
      litigation.receivedPictures = receivedPictures !== undefined ? !!receivedPictures : litigation.receivedPictures;
      litigation.receivedDiagnosticReport = receivedDiagnosticReport !== undefined ? !!receivedDiagnosticReport : litigation.receivedDiagnosticReport;
      litigation.problemDescription = problemDescription !== undefined ? problemDescription.trim() : litigation.problemDescription;
      litigation.resolutionNotes = resolutionNotes !== undefined ? resolutionNotes.trim() : litigation.resolutionNotes;
    }

    // Always add a note about the update
    litigation.litigationNotes = litigation.litigationNotes || [];
    litigation.litigationNotes.push({
      text: `Litigation form updated by ${userName}${statusReverted ? " — order status reverted to Litigation" : ""}`,
      createdBy: userId || null,
      createdByName: userName,
      createdAt: new Date(),
    });

    litigation.updatedAt = new Date();

    // Save both documents
    await litigation.save();
    await order.save();

    return res.status(200).json({
      message: "Litigation updated successfully" + (statusReverted ? " — order status reverted to Litigation" : ""),
      litigation,
      orderStatus: order.status,
    });
  } catch (error) {
    console.error("Error updating litigation:", error);
    return res.status(500).json({
      message: "Failed to update litigation",
      error: error.message,
    });
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
  if (!req.user) {
    return res.status(401).json({ message: "Access denied: User not authenticated" });
  }
  const { id } = req.params; // orderId

  try {
    const order = await Order.findById(id).populate('leadId');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.leadId || !order.leadId.email) {
      return res.status(400).json({ message: "Customer email is missing" });
    }

    // Get user who sent it
    const userName = req.user?.name || "Unknown User";
    const noteText = `RMA form sent by ${userName} on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

    // Find the related Litigation document
    const litigation = await Litigation.findOne({ orderId: id });
    if (litigation) {
      litigation.litigationNotes = litigation.litigationNotes || [];
      litigation.litigationNotes.push({
        text: noteText,
        createdBy: req.user?._id || null,
        createdByName: userName,
        createdAt: new Date(),
      });
      await litigation.save();
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

export const addProcurement = async (req, res) => {
  const { id } = req.params;
  const procurementData = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Initialize procurementData with defaults if not provided
    const defaultProcurementData = {
      vendorInformedDate: null,
      sentPicturesToVendor: false,
      sentDiagnosticReportToVendor: false,
      yardAgreedReturnShipping: false,
      yardAgreedReplacement: false,
      yardAgreedReplacementShippingCost: false,
      replacementPartReadyDate: null,
      additionalCostReplacementPart: '',
      additionalCostReplacementShipping: '',
    };

    // Merge provided data with defaults, ensuring all fields are set
    order.procurementData = {
      ...defaultProcurementData,
      ...procurementData,
      vendorInformedDate: procurementData.vendorInformedDate ? new Date(procurementData.vendorInformedDate) : null,
      replacementPartReadyDate: procurementData.replacementPartReadyDate ? new Date(procurementData.replacementPartReadyDate) : null,
    };

    await order.save();
    res.status(201).json({ order, message: "Procurement data added successfully" });
  } catch (error) {
    console.error("Error adding procurement data:", error);
    res.status(500).json({ message: "Failed to add procurement data" });
  }
};

// Update procurement data for an order
export const updateProcurement = async (req, res) => {
  const { id } = req.params;
  const procurementData = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update procurementData, preserving existing fields not in the request
    order.procurementData = {
      ...order.procurementData,
      ...procurementData,
      vendorInformedDate: procurementData.vendorInformedDate ? new Date(procurementData.vendorInformedDate) : order.procurementData.vendorInformedDate,
      replacementPartReadyDate: procurementData.replacementPartReadyDate ? new Date(procurementData.replacementPartReadyDate) : order.procurementData.replacementPartReadyDate,
    };

    await order.save();
    res.status(200).json({ order, message: "Procurement data updated successfully" });
  } catch (error) {
    console.error("Error updating procurement data:", error);
    res.status(500).json({ message: "Failed to update procurement data" });
  }
};

export const resolveLitigation = async (req, res) => {
  try {
    // Auth check
    if (!req.user) {
      return res.status(403).json({ message: "Access denied: User not authenticated" });
    }

    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow if currently in Litigation
    if (order.status !== "Litigation") {
      return res.status(400).json({ message: "Order is not in Litigation status" });
    }

    // Update status to Resolved
    order.status = "Resolved";

    // Add notes – consistent across all places
    const userName = req.user?.name || "Unknown User";
    const noteText = `Order resolved (no replacement needed) by ${userName}`;

    // Order general notes
    order.notes = order.notes || [];
    order.notes.push({
      text: noteText,
      createdAt: new Date(),
    });

    // Procurement notes
    order.procurementnotes = order.procurementnotes || [];
    order.procurementnotes.push({
      text: noteText,
      createdAt: new Date(),
    });

    // Vendor notes (only for confirmed vendors)
    if (order.vendors && order.vendors.length > 0) {
      order.vendors.forEach((vendor) => {
        if (vendor.isConfirmed && vendor.poStatus === "PO Confirmed") {
          vendor.notes = vendor.notes || [];
          vendor.notes.push({
            text: noteText,
            createdAt: new Date(),
          });
        }
      });
    }

    await order.save();

    return res.status(200).json({
      message: "Order resolved successfully",
      order,
    });
  } catch (error) {
    console.error("Error resolving litigation:", error);
    return res.status(500).json({
      message: "Failed to resolve order",
      error: error.message,
    });
  }
};


export const markAsRefund = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied: User not authenticated" });
    }

    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Litigation") {
      return res.status(400).json({ message: "Can only mark Refund from Litigation status" });
    }

    // Update status
    order.status = "Refund";

    // Add note to litigationNotes
    const userName = req.user?.name || "Unknown User";
    const noteText = `Order marked as Refund by ${userName} on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

    const litigation = await Litigation.findOne({ orderId });
    if (litigation) {
      litigation.litigationNotes = litigation.litigationNotes || [];
      litigation.litigationNotes.push({
        text: noteText,
        createdBy: req.user?._id || null,
        createdByName: userName,
        createdAt: new Date(),
      });
      await litigation.save();           // Save litigation notes
    }

    // IMPORTANT: Save the updated order status!
    await order.save();

    return res.status(200).json({
      message: "Order marked as Refund successfully",
      order,   // Return updated order so frontend gets new status
    });
  } catch (error) {
    console.error("Error marking as Refund:", error);
    return res.status(500).json({
      message: "Failed to mark as Refund",
      error: error.message,
    });
  }
};

export const markRefundCompleted = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied: User not authenticated" });
    }

    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Refund") {
      return res.status(400).json({ message: "Can only mark Refund Completed from Refund status" });
    }

    // Update status
    order.status = "Refund Completed";

    // Add note to litigationNotes
    const userName = req.user?.name || "Unknown User";
    const noteText = `Refund marked as Completed by ${userName} on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

    const litigation = await Litigation.findOne({ orderId });
    if (litigation) {
      litigation.litigationNotes = litigation.litigationNotes || [];
      litigation.litigationNotes.push({
        text: noteText,
        createdBy: req.user?._id || null,
        createdByName: userName,
        createdAt: new Date(),
      });
      await litigation.save();
    }

    await order.save();

    return res.status(200).json({
      message: "Refund marked as Completed successfully",
      order,
    });
  } catch (error) {
    console.error("Error marking refund as completed:", error);
    return res.status(500).json({
      message: "Failed to mark refund as completed",
      error: error.message,
    });
  }
};
export const getRefundOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status; // new

    const query = {};
    if (status && ['Refund', 'Refund Completed'].includes(status)) {
      query.status = status;
    } else {
      query.status = { $in: ['Refund', 'Refund Completed'] };
    }

    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .select('order_id clientName phone email amount createdAt status notes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch refund orders', error: error.message });
  }
};

// controllers/litReplaceController.js

export const addLitigationNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Note text is required" });
    }

    const litigation = await Litigation.findOne({ orderId });

    if (!litigation) {
      return res.status(404).json({ message: "Litigation record not found for this order" });
    }

    const userId = req.user?._id;
    const userName = req.user?.name || "Unknown User";

    litigation.litigationNotes.push({
      text: text.trim(),
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date(),
    });

    litigation.updatedAt = new Date();

    await litigation.save();

    // Optional: also log to order notes
    const order = await Order.findById(orderId);
    if (order) {
      order.notes = order.notes || [];
      order.notes.push({
        text: `Litigation note added: "${text.trim()}" by ${userName}`,
        createdAt: new Date(),
      });
      await order.save();
    }

    res.status(200).json({
      message: "Note added successfully",
      litigationNotes: litigation.litigationNotes,
    });
  } catch (error) {
    console.error("Error adding litigation note:", error);
    res.status(500).json({
      message: "Failed to add note",
      error: error.message,
    });
  }
};