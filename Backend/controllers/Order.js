import User from '../models/user.js';
import Lead from "../models/lead.js";
import Order from '../models/order.js';

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
        amount
      } = req.body;
  
      if (!leadId || !make || !model || !year || !clientName || !phone || !email ||
          !cardNumber || !cardMonth || !cardYear || !cvv ||
          !billingAddress || !city || !state || !zip ||
          !shippingAddress || !shippingCity || !shippingState || !shippingZip || !amount) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }
  
      if (!/^\d{16}$/.test(cardNumber)) {
        return res.status(400).json({ message: 'Card number must be 16 digits' });
      }
  
      const cardLastFour = cardNumber.slice(-4);
  
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      if (!lead.salesPerson) {
        return res.status(400).json({ message: 'Lead has no assigned salesperson' });
      }
  
      const order = new Order({
        leadId,
        salesPerson: lead.salesPerson,
        make,
        model,
        year,
        clientName,
        phone,
        email,
        cardLastFour,
        cardMonth,
        cardYear,
        billingAddress,
        city,
        state,
        zip,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        amount: parseFloat(amount)
      });
  
      await order.save();
  
      res.status(201).json({ message: 'Order created successfully' });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Server error' });
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