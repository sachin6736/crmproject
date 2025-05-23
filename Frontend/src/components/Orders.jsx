import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "./utilities/FullPageLoader";
import { useTheme } from "../context/ThemeContext";

const OrderForm = () => {
  const { id } = useParams(); // leadId
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    clientName: "",
    phone: "",
    email: "",
    cardNumber: "",
    cardMonth: "",
    cardYear: "",
    cvv: "",
    billingAddress: "",
    city: "",
    state: "",
    zip: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    amount: "",
    partRequested: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [orderExists, setOrderExists] = useState(false);
  const [existingOrder, setExistingOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const checkOrderAndFetchLead = async () => {
      setIsLoading(true);
      try {
        // Check if an order exists for this lead
        const orderResponse = await fetch(
          `http://localhost:3000/Order/checkorderbylead/${id}`,
          { credentials: "include" }
        );
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrderExists(true);
          setExistingOrder(orderData);
          setFormData({
            make: orderData.make || "",
            model: orderData.model || "",
            year: String(orderData.year || ""),
            clientName: orderData.clientName || "",
            phone: orderData.phone || "",
            email: orderData.email || "",
            cardNumber: "", // Do not prefill sensitive data
            cardMonth: orderData.cardMonth || "",
            cardYear: orderData.cardYear || "",
            cvv: "",
            billingAddress: orderData.billingAddress || "",
            city: orderData.city || "",
            state: orderData.state || "",
            zip: orderData.zip || "",
            shippingAddress: orderData.shippingAddress || "",
            shippingCity: orderData.shippingCity || "",
            shippingState: orderData.shippingState || "",
            shippingZip: orderData.shippingZip || "",
            amount: orderData.amount?.toString() || "",
            partRequested: orderData.leadId?.partRequested || "",
          });
          setIsLoading(false);
          return;
        }

        // If no order exists, fetch lead data
        const leadResponse = await fetch(
          `http://localhost:3000/Lead/getleadbyid/${id}`,
          { credentials: "include" }
        );
        if (!leadResponse.ok) {
          throw new Error("Failed to fetch lead data");
        }
        const leadData = await leadResponse.json();
        setFormData({
          make: leadData.make || "",
          model: leadData.model || "",
          year: String(leadData.year || ""),
          clientName: leadData.clientName || "",
          phone: leadData.phoneNumber || "",
          email: leadData.email || "",
          cardNumber: "",
          cardMonth: "",
          cardYear: "",
          cvv: "",
          billingAddress: leadData.billingAddress || "",
          city: leadData.city || "",
          state: leadData.state || "",
          zip: leadData.zip || "",
          shippingAddress: leadData.shippingAddress || "",
          shippingCity: leadData.shippingCity || "",
          shippingState: leadData.shippingState || "",
          shippingZip: leadData.shippingZip || "",
          amount: leadData.totalCost?.toString() || "",
          partRequested: leadData.partRequested || "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    checkOrderAndFetchLead();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Input validations
    if (name === "cardNumber" && value.length > 16) return;
    if (name === "cardMonth" && value.length > 2) return;
    if (name === "cardYear" && value.length > 4) return;
    if (name === "cvv" && value.length > 4) return;
    if (name === "zip" && value.length > 5) return;
    if (name === "shippingZip" && value.length > 5) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSameAsBilling = (e) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setFormData({
        ...formData,
        shippingAddress: formData.billingAddress,
        shippingCity: formData.city,
        shippingState: formData.state,
        shippingZip: formData.zip,
      });
    }
  };

  const validateForm = () => {
    if (!/^\d{16}$/.test(formData.cardNumber)) {
      toast.error("Card number must be 16 digits");
      return false;
    }
    if (!/^(0[1-9]|1[0-2])$/.test(formData.cardMonth)) {
      toast.error("Card month must be 01–12");
      return false;
    }
    if (!/^\d{3,4}$/.test(formData.cvv)) {
      toast.error("CVV must be 3 or 4 digits");
      return false;
    }
    if (!formData.billingAddress.trim()) {
      toast.error("Billing address is required");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("Billing city is required");
      return false;
    }
    if (!formData.state.trim()) {
      toast.error("Billing state is required");
      return false;
    }
    if (!/^\d{5}$/.test(formData.zip)) {
      toast.error("Billing zip must be 5 digits");
      return false;
    }
    if (!formData.shippingAddress.trim()) {
      toast.error("Shipping address is required");
      return false;
    }
    if (!formData.shippingCity.trim()) {
      toast.error("Shipping city is required");
      return false;
    }
    if (!formData.shippingState.trim()) {
      toast.error("Shipping state is required");
      return false;
    }
    if (!/^\d{5}$/.test(formData.shippingZip)) {
      toast.error("Shipping zip must be 5 digits");
      return false;
    }
    if (parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch("http://localhost:3000/Order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, leadId: id }),
      });
      if (response.ok) {
        toast.success("Order submitted successfully");
        navigate("/home/orders"); // Redirect to orders history
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to submit order");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Network error: Unable to submit order");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `http://localhost:3000/Order/update/${existingOrder._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      if (response.ok) {
        toast.success("Order updated successfully");
        setIsEditing(false);
        // Refresh order data
        const orderResponse = await fetch(
          `http://localhost:3000/Order/checkorderbylead/${id}`,
          { credentials: "include" }
        );
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setExistingOrder(orderData);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Network error: Unable to update order");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <FullPageLoader
          size="w-10 h-10"
          color="text-blue-500 dark:text-blue-400"
          fill="fill-blue-300 dark:fill-blue-600"
        />
      </div>
    );
  }

  if (orderExists && !isEditing) {
    // Display order details in read-only mode
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <section>
          <h2 className="text-2xl font-bold">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block font-semibold">Make</label>
              <input
                value={existingOrder.make}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Model</label>
              <input
                value={existingOrder.model}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Year</label>
              <input
                value={existingOrder.year}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Part Requested</label>
              <input
                value={existingOrder.leadId?.partRequested || "N/A"}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Client Name</label>
              <input
                value={existingOrder.clientName}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Phone</label>
              <input
                value={existingOrder.phone}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Email</label>
              <input
                value={existingOrder.email}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block font-semibold">Card Last Four</label>
              <input
                value={existingOrder.cardLastFour}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Card Expiry</label>
              <input
                value={`${existingOrder.cardMonth}/${existingOrder.cardYear}`}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Amount</label>
              <input
                value={`$${existingOrder.amount.toFixed(2)}`}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Billing Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block font-semibold">Billing Address</label>
              <input
                value={existingOrder.billingAddress}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">City</label>
              <input
                value={existingOrder.city}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">State</label>
              <input
                value={existingOrder.state}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Zip</label>
              <input
                value={existingOrder.zip}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Shipping Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block font-semibold">Shipping Address</label>
              <input
                value={existingOrder.shippingAddress}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Shipping City</label>
              <input
                value={existingOrder.shippingCity}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Shipping State</label>
              <input
                value={existingOrder.shippingState}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
            <div>
              <label className="block font-semibold">Shipping Zip</label>
              <input
                value={existingOrder.shippingZip}
                disabled
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
              />
            </div>
          </div>
        </section>

        <div className="flex space-x-4">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg mt-4 hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Edit Order
          </button>
          <button
            onClick={() => navigate("/home/orders")}
            className="bg-gray-600 dark:bg-gray-500 text-white px-6 py-2 rounded-lg mt-4 hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Display editable form (either for new order or editing existing order)
  return (
    <form
      onSubmit={isEditing ? handleUpdate : handleSubmit}
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <h1 className="text-3xl font-bold">
        {isEditing ? "Edit Order" : "Create Order"}
      </h1>
      <section>
        <h2 className="text-2xl font-bold">Order Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Review your product selection and personal details.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold">Make</label>
            <input
              name="make"
              value={formData.make}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold">Model</label>
            <input
              name="model"
              value={formData.model}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold">Year</label>
            <input
              name="year"
              value={formData.year}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold">Part Requested</label>
            <input
              name="partRequested"
              value={formData.partRequested}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold">Client Name</label>
            <input
              name="clientName"
              value={formData.clientName}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold">Email</label>
            <input
              name="email"
              value={formData.email}
              disabled
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-gray-200 dark:bg-gray-800 opacity-70"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Payment Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Securely enter your card information to complete the payment.
        </p>
        <input
          name="cardNumber"
          placeholder="Card Number *"
          value={formData.cardNumber}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full mb-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="cardMonth"
            placeholder="Month (MM) *"
            value={formData.cardMonth}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="cardYear"
            placeholder="Year (YYYY) *"
            value={formData.cardYear}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="cvv"
            placeholder="CVV *"
            value={formData.cvv}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Billing Address</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Provide the address associated with your payment method.
        </p>
        <input
          name="billingAddress"
          placeholder="Billing Address *"
          value={formData.billingAddress}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full mb-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="city"
            placeholder="City *"
            value={formData.city}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="state"
            placeholder="State or Province *"
            value={formData.state}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
          <input
            name="zip"
            placeholder="Postal or Zip *"
            value={formData.zip}
            onChange={handleChange}
            required
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Shipping Address</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Enter the address where the order should be shipped.
        </p>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="sameAsBilling"
            checked={sameAsBilling}
            onChange={handleSameAsBilling}
            className="mr-2"
          />
          <label
            htmlFor="sameAsBilling"
            className="text-gray-600 dark:text-gray-400"
          >
            Same as Billing Address
          </label>
        </div>
        <input
          name="shippingAddress"
          placeholder="Shipping Address *"
          value={formData.shippingAddress}
          onChange={handleChange}
          required
          disabled={sameAsBilling}
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full mb-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="shippingCity"
            placeholder="City *"
            value={formData.shippingCity}
            onChange={handleChange}
            required
            disabled={sameAsBilling}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <input
            name="shippingState"
            placeholder="State or Province *"
            value={formData.shippingState}
            onChange={handleChange}
            required
            disabled={sameAsBilling}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <input
            name="shippingZip"
            placeholder="Postal or Zip *"
            value={formData.shippingZip}
            onChange={handleChange}
            required
            disabled={sameAsBilling}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </section>

      <section>
        <label className="block font-semibold text-lg mt-4 mb-2">Amount $:</label>
        <input
          name="amount"
          value={formData.amount}
          disabled
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-200 dark:bg-gray-800 opacity-70"
        />
      </section>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-green-800 dark:bg-green-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-green-900 dark:hover:bg-green-700"
        >
          {isEditing ? "Update Order" : "Submit Now"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="bg-gray-600 dark:bg-gray-500 text-white px-6 py-2 rounded-lg mt-4 hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate("/home/orders")}
          className="bg-gray-600 dark:bg-gray-500 text-white px-6 py-2 rounded-lg mt-4 hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          Back to Orders
        </button>
      </div>
    </form>
  );
};

export default OrderForm;