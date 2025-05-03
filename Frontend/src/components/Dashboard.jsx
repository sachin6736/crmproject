import React, { useState, useEffect } from "react";
import { Trash2, Plus, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import FullPageLoader from "./utilities/FullPageLoader";

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalClients, setTotalClients] = useState(0);
  const [countbystatus, setCountbystatus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "" });
  const [dropdownOpen, setDropdownOpen] = useState(null); // track which dropdown is open
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false); // For role change modal
  const [selectedRole, setSelectedRole] = useState(""); // For selected role
  const [currentRole, setCurrentRole] = useState(""); // For current role of selected user

  const statusColor = {
    Quoted: "bg-yellow-100 text-yellow-800",
    Ordered: "bg-green-100 text-green-800",
  };

  useEffect(() => {
    const verifyRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/Auth/check", {
          method: "GET",
          credentials: "include", // important for cookies
        });

        if (!res.ok) {
          throw new Error("Not authorized");
        }
        const data = await res.json();
        console.log("data", data);
        if (data.user.role !== "admin") {
          navigate("/home/salesdashboard");
        } else {
          setLoading(false); // allow rendering
        }
      } catch (error) {
        navigate("/"); // go to login or home if auth fails
      }
    };

    verifyRole();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, statusRes, ordersRes, usersRes] = await Promise.all([
          fetch("http://localhost:3000/Admin/getleadcount"),
          fetch("http://localhost:3000/Admin/getcountbystatus"),
          fetch("http://localhost:3000/Admin/getallorders"),
          fetch("http://localhost:3000/Admin/getmyteam"),
        ]);

        const leadData = await leadRes.json();
        const statusData = await statusRes.json();
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();

        setTotalClients(leadData.leadcount);
        setCountbystatus(statusData);
        setOrders(ordersData);
        setTeamUsers(usersData);
      } catch (error) {
        toast.error("Error fetching dashboard");
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusCount = (status) => {
    const statusObj = countbystatus.find((item) => item._id === status);
    return statusObj ? statusObj.count : 0;
  };

  const chartData = [
    { month: "Jan", daily: 300, monthly: 2400 },
    { month: "Feb", daily: 500, monthly: 1398 },
    { month: "Mar", daily: 200, monthly: 9800 },
    { month: "Apr", daily: 278, monthly: 3908 },
    { month: "May", daily: 189, monthly: 4800 },
  ];

  const handleAddUser = async () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("All fields are required");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/Auth/Createuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMember),
      });
      if (res.status === 403) {
        toast.error("access denied, contact admin");
        return;
      }
      if (res.status === 409) {
        toast.error("User with email already exists");
        return;
      }

      if (!res.ok) {
        toast.error("Failed to add user");
      }
      const savedUser = await res.json();

      setTeamUsers((prev) => [...prev, savedUser]);
      setShowModal(false);
      setNewMember({ name: "", email: "", role: "" });
      toast.success("User added to the team!");
    } catch (error) {
      toast.error("Error adding user");
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      // Handle Pause / Resume
      if (action === "Pause" || action === "Resume") {
        const status = action === "Pause";
        const res = await fetch(
          `http://localhost:3000/User/Pauseandresume/${userId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status }),
          }
        );

        if (res.status === 403) {
          toast.error("Access denied, contact admin");
          return;
        }
        if (res.status === 204) {
          toast.info(`User is already ${action.toLowerCase()}d`);
          return;
        }
        if (res.status === 400) {
          toast.error("Invalid status selected");
          return;
        }
        if (!res.ok) {
          toast.error("Failed to change status");
          return;
        }

        setTeamUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, isPaused: status } : user
          )
        );
        toast.success(`User ${action.toLowerCase()}d successfully`);
      }

      // Handle Reassign Leads
      else if (action === "Reassign Leads") {
        const res = await fetch(
          `http://localhost:3000/User/Reassign/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Failed to reassign leads");
          return;
        }

        toast.success(data.message);
      }

      // Handle Change Role
      else if (action === "Change Role") {
        const user = teamUsers.find((user) => user._id === userId);
        if (user) {
          setSelectedUserId(userId); // Store the user ID
          setCurrentRole(user.role); // Store the current role
          setShowRoleModal(true); // Open the role change modal
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to perform action: ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FullPageLoader
          size="w-10 h-10"
          color="text-blue-500"
          fill="fill-blue-300"
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f9fafb]">
      {/* Stats */}
      <div className="flex flex-wrap gap-6 p-3 px-6 sm:px-20">
        {["Ordered", "Quoted"].map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[250px] max-w-sm h-40 bg-white rounded-xl shadow flex flex-col items-center justify-center p-4"
          >
            <h3 className="text-gray-500 text-lg">{status}</h3>
            <span className="text-4xl font-bold text-blue-600">
              {getStatusCount(status)}
            </span>
          </div>
        ))}
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 text-lg">Total Clients</h3>
          <span className="text-4xl font-bold text-blue-600">
            {totalClients}
          </span>
        </div>
      </div>

      {/* Graph + My Team */}
      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="daily"
                stroke="#8884d8"
                name="Daily Sales"
              />
              <Line
                type="monotone"
                dataKey="monthly"
                stroke="#82ca9d"
                name="Monthly Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:max-w-sm bg-white rounded-xl shadow p-4 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">My Team</h3>
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {teamUsers.map((member, index) => (
              <li
                key={index}
                className="relative flex items-center justify-between space-x-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                {/* Left section: Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 text-white rounded-full flex items-center justify-center font-semibold ${
                      member.isPaused ? "bg-red-500" : "bg-blue-500"
                    }`}
                  >
                    {member.role[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                      {member.name}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {member.role.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">
                      {member.email}
                    </span>
                  </div>
                </div>

                {/* Right section: Dropdown trigger */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setDropdownOpen(dropdownOpen === index ? null : index)
                    }
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600 hover:text-black" />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen === index && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-10">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          if (member.isPaused) {
                            handleUserAction("Resume", member._id);
                          } else {
                            handleUserAction("Pause", member._id);
                          }
                          setDropdownOpen(null); // close dropdown
                        }}
                      >
                        {member.isPaused ? "Resume" : "Pause"}
                      </button>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          handleUserAction("Reassign Leads", member._id);
                          setDropdownOpen(null); // close dropdown
                        }}
                      >
                        Reassign Leads
                      </button>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          handleUserAction("Change Role", member._id);
                          setDropdownOpen(null); // close dropdown
                        }}
                      >
                        Change Role
                      </button>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setSelectedUserId(member._id);
                          setShowPasswordModal(true);
                          setDropdownOpen(null); // close dropdown
                        }}
                      >
                        Password
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <input
                  type="password"
                  className="w-full border p-2 rounded"
                  placeholder="New Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-1 border rounded-lg"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordInput("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-1 bg-blue-500 text-white rounded-lg"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `http://localhost:3000/User/Resetpassword/${selectedUserId}`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              newpassword: passwordInput,
                            }),
                          }
                        );
                        if (res.status === 403) {
                          toast.error("only admin can change password");
                          return;
                        }
                        if (res.status === 400) {
                          toast.error("password could not be empty");
                          return;
                        }
                        if (res.status === 404) {
                          toast.error(
                            "User doesn’t exist, please check the database"
                          );
                          return;
                        }

                        if (!res.ok) {
                          toast.error("Oops, an error occurred");
                          return;
                        }

                        toast.success("Password updated successfully!");
                        setShowPasswordModal(false);
                        setPasswordInput("");
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to change password");
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
              <div className="space-y-4">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Name"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                />
                <select
                  className="w-full border p-2 rounded"
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="customer_relations">Customer Relations</option>
                  <option value="procurement">Procurement</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-1 border rounded-lg"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-1 bg-blue-500 text-white rounded-lg"
                    onClick={handleAddUser}
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showRoleModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4">Change User Role</h3>
              <div className="space-y-4">
                <select
                  className="w-full border p-2 rounded"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="" disabled>
                    Select New Role
                  </option>
                  <option value="admin" disabled={currentRole === "admin"}>
                    Admin
                  </option>
                  <option value="sales" disabled={currentRole === "sales"}>
                    Sales
                  </option>
                  <option
                    value="customer_relations"
                    disabled={currentRole === "customer_relations"}
                  >
                    Customer Relations
                  </option>
                  <option
                    value="procurement"
                    disabled={currentRole === "procurement"}
                  >
                    Procurement
                  </option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-1 border rounded-lg"
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedRole("");
                      setCurrentRole("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-1 bg-blue-500 text-white rounded-lg"
                    onClick={async () => {
                      if (!selectedRole) {
                        toast.error("Please select a role");
                        return;
                      }
                      try {
                        const res = await fetch(
                          `http://localhost:3000/User/Changerole/${selectedUserId}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ newrole: selectedRole }),
                          }
                        );

                        const data = await res.json();
                        if (res.status === 403) {
                          toast.error("Access denied, contact admin");
                          return;
                        }
                        if (res.status === 404) {
                          toast.error("User not found");
                          return;
                        }
                        if (res.status === 204) {
                          toast.info("User is already assigned this role");
                          return;
                        }
                        if (!res.ok) {
                          toast.error(data.message || "Failed to change role");
                          return;
                        }

                        // Update the teamUsers state with the new role
                        setTeamUsers((prevUsers) =>
                          prevUsers.map((user) =>
                            user._id === selectedUserId
                              ? { ...user, role: selectedRole }
                              : user
                          )
                        );

                        toast.success("User role changed successfully!");
                        setShowRoleModal(false);
                        setSelectedRole("");
                        setCurrentRole("");
                      } catch (error) {
                        console.error(error);
                        toast.error("Failed to change role");
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder Boxes */}
      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] h-96 bg-white rounded-xl shadow"></div>
        <div className="flex-1 min-w-[300px] h-96 bg-white rounded-xl shadow"></div>
      </div>

      {/* Recent Orders */}
      <div className="w-full px-4 sm:px-20 py-8">
        <div className="p-6 bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="space-x-2">
              <button className="px-4 py-1 border rounded-lg text-sm">
                Filter
              </button>
              <button className="px-4 py-1 border rounded-lg text-sm">
                See all
              </button>
            </div>
          </div>

          <table className="min-w-[700px] w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b">
                <th className="p-2">Client Name</th>
                <th className="p-2 pl-14">Email</th>
                <th className="p-2">Part Requested</th>
                <th className="p-2">Close Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className="border-b text-sm">
                  <td className="p-2">{order.clientName}</td>
                  <td className="p-2 flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        order.color || "bg-blue-400"
                      }`}
                    >
                      {order.email[0]?.toUpperCase()}
                    </div>
                    <div className="text-gray-500">{order.email}</div>
                  </td>
                  <td className="p-2">{order.partRequested}</td>
                  <td className="p-2">{order.date}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        statusColor[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;