import { Order } from "../models/order.js";
import Litigation from "../models/Litigation.js";
import sendEmail from "../sendEmail.js";
import ReplacementOrder from "../models/ReplacementOrder.js";



// Get all replacement records (paginated + searchable)
export const getReplacementOrders = async (req, res) => {
    console.log("replacemetget")
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const searchRegex = new RegExp(search, "i");

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { "customer.name": searchRegex },
        { "customer.phone": searchRegex },
        { "customer.email": searchRegex },
        { "partDetails.partRequested": searchRegex },
        { replacementId: searchRegex },
      ];
    }

    // Fetch replacements
    const replacements = await ReplacementOrder.find(query)
      .populate("originalOrderId", "order_id status clientName") // optional population
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReplacementOrder.countDocuments(query);

    // Format for frontend
    const formatted = replacements.map((rep) => ({
      _id: rep._id,
      replacementId: rep.replacementId,
      originalOrderId: rep.originalOrderId?._id,
      originalOrderNumber: rep.originalOrderId?.order_id || "N/A",
      customerName: rep.customer.name,
      customerPhone: rep.customer.phone,
      customerEmail: rep.customer.email,
      partRequested: rep.partDetails.partRequested,
      make: rep.partDetails.make,
      model: rep.partDetails.model,
      year: rep.partDetails.year,
      createdAt: rep.createdAt,
      createdBy: rep.createdBy?.name || "System",
    }));

    res.status(200).json({
      replacements: formatted,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    });
  } catch (error) {
    console.error("Error fetching replacement orders:", error);
    res.status(500).json({ message: "Failed to fetch replacement orders", error: error.message });
  }
};

export const getReplacementById = async (req, res) => {
 
  try {
    const { id } = req.params;
    const replacement = await ReplacementOrder.findById(id)
      .populate("originalOrderId", "order_id status")
      .populate("createdBy", "name");

    if (!replacement) {
      return res.status(404).json({ message: "Replacement order not found" });
    }

    res.status(200).json(replacement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addReplacementNote = async (req, res) => {
   console.log("req.user.name",req.user.name)
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Note text is required" });
    }

    const replacement = await ReplacementOrder.findById(id);
    if (!replacement) {
      return res.status(404).json({ message: "Replacement order not found" });
    }

    // Always include addedBy
    replacement.notes.push({
      text: text.trim(),
      addedBy: req.user?.name || "System / Unknown",  // ← fallback if name missing
    });

    await replacement.save();

    // Return updated document
    res.status(200).json(replacement);
  } catch (error) {
    console.error("Add note error:", error);
    res.status(500).json({ 
      message: "Failed to add note", 
      error: error.message 
    });
  }
};

export const updateReplacementShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, trackingId, carrier, amount } = req.body;

    if (!['customer', 'vendor', 'own'].includes(method)) {
      return res.status(400).json({ message: "Invalid shipping method" });
    }

    const updateData = {
      "shipping.method": method,
      "shipping.trackingId": (trackingId || "").trim(),
      "shipping.carrier": (carrier || "").trim(),
      status: "WaitingShipment"
    };

    if (method === "own") {
      const amt = Number(amount);
      if (isNaN(amt) || amt < 0) {
        return res.status(400).json({ message: "Valid amount ≥ 0 required for own shipping" });
      }
      updateData["shipping.amount"] = amt;
    }

    // Build nice note text
    const methodLabel = 
      method === "customer" ? "Shipped by Customer" :
      method === "vendor"   ? "Shipped by Vendor"   :
      "Our own shipping";

    const noteText = 
      `Shipping details updated:\n` +
      `→ Method: ${methodLabel}\n` +
      `→ Carrier: ${carrier || "—"} \n` +
      `→ Tracking/AWB: ${trackingId || "—"}` +
      (method === "own" && amount ? `\n→ Amount: ₹${Number(amount).toFixed(2)}` : "");

    // Add the note
    updateData.$push = {
      notes: {
        text: noteText,
        addedBy: req.user?.name || "System",
        createdAt: new Date()   // optional - mongoose will add it anyway if schema has default
      }
    };

    const replacement = await ReplacementOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!replacement) {
      return res.status(404).json({ message: "Replacement not found" });
    }

    res.status(200).json(replacement);

  } catch (error) {
    console.error("Update shipping error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateReplacementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ReplacementOrder.schema.path('status').enumValues;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const replacement = await ReplacementOrder.findById(id);
    if (!replacement) {
      return res.status(404).json({ message: "Replacement not found" });
    }

    const currentStatus = replacement.status;

    // Business rules
    if (status === "WaitingShipment") {
      return res.status(403).json({
        message: "WaitingShipment can only be set by providing shipping details",
      });
    }

    if (status === "InTransit" && currentStatus !== "WaitingShipment") {
      return res.status(400).json({
        message: "Cannot set InTransit unless current status is WaitingShipment",
      });
    }

    if (status === "Delivered" && currentStatus !== "InTransit") {
      return res.status(400).json({
        message: "Cannot set Delivered unless current status is InTransit",
      });
    }

    // Prevent going backwards
    const statusOrder = ["ReplacementRequested", "WaitingShipment", "InTransit", "Delivered"];
    if (statusOrder.indexOf(status) < statusOrder.indexOf(currentStatus)) {
      return res.status(400).json({ message: "Cannot revert to previous status" });
    }

    // Prepare update
    const updateData = { status };

    // Auto-add note for InTransit
    if (status === "InTransit") {
      updateData.$push = {
        notes: {
          text: `Status changed to InTransit by ${req.user?.name || "System"}`,
          addedBy: req.user?.name || "System",
          createdAt: new Date(),
        },
      };
    }

    // NEW: Auto-add note for Delivered
    if (status === "Delivered") {
      updateData.$push = updateData.$push || { notes: [] }; // if already has push
      updateData.$push.notes = {
        text: `Status changed to Delivered by ${req.user?.name || "System"}`,
        addedBy: req.user?.name || "System",
        createdAt: new Date(),
      };
    }

    const updated = await ReplacementOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};