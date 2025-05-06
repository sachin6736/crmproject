import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  Home as HomeIcon,
  Users,
  Briefcase,
  LineChart,
  Headset,
  Megaphone,
  LucideShoppingCart,
  PenTool,
  User,
  CheckCircle,
  Coffee,
  Utensils,
  Calendar,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Home() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/Auth/check", {
          credentials: "include",
        });
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.log("Error fetching user info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlelogout = async () => {
    try {
      console.log("logout controller working");
      const res = await fetch("http://localhost:3000/Auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        navigate("/");
      } else {
        console.log("logout failed");
      }
    } catch (error) {
      console.log("error during logout ", error);
    }
  };

  const handleStatusChange = async (selectedStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/Sales/changestatus/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
        credentials: "include",
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => ({
          ...prev,
          status: updated.status,
        }));
        toast.success("Status changed");
      } else {
        toast.error("Failed to change status");
      }
    } catch (err) {
      console.log("Error changing status:", err);
      toast.error("Error occurred while changing status");
    }
    setShowStatusDropdown(false);
  };

  const statusOptions = [
    { value: "Available", label: "Available", icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { value: "OnBreak", label: "On Break", icon: <Coffee className="w-4 h-4 text-blue-500" /> },
    { value: "Lunch", label: "Lunch", icon: <Utensils className="w-4 h-4 text-orange-500" /> },
    { value: "Meeting", label: "Meeting", icon: <Calendar className="w-4 h-4 text-purple-500" /> },
    { value: "LoggedOut", label: "Logged Out", icon: <LogOut className="w-4 h-4 text-red-500" /> },
  ];

  return (
    <div className="w-screen h-screen bg-white flex">
      <div className="w-20 h-screen bg-[#002775] fixed left-0 top-0 border-r-[2px] border-r-white flex flex-col items-center pt-3 space-y-3 overflow-y-scroll">
        <div
          className="flex flex-col items-center space-y-1"
          onClick={() => {
            console.log("user", user);
            if (loading) return;
            if (user?.role === "admin") {
              navigate("/home/dashboard");
            } else {
              navigate("/home/salesdashboard");
            }
          }}
        >
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <HomeIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Contacts</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Accounts</span>
        </div>
        <div
          className="flex flex-col items-center space-y-1"
          onClick={() => navigate("/home/sales")}
        >
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <LineChart className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Sales</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <Headset className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Service</span>
        </div>
        <div
          className="flex flex-col items-center space-y-1"
          onClick={() => {
            console.log("user", user);
            if (loading) return;
            if (user?.role === "admin") {
              navigate("/home/dashboard");
            } else {
              navigate("/home/salesdashboard");
            }
          }}
        >
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Dashboard</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <LucideShoppingCart className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Commerce</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <PenTool className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] pl-4 mr-3 font-bold">
            Generative Canvas
          </span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">Your Account</span>
        </div>
      </div>
      <div className="flex-1 h-screen ml-20 flex flex-col">
        <div className="w-full h-24 bg-[#066afe] flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            {/* <img src={logo} alt="Equivise Logo" className="w-20 h-20" /> */}
            {/* <span className="text-white font-serif text-lg">| Equivise</span> */}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              type="button"
              className="w-8 h-8 bg-white text-[#066afe] rounded-full flex items-center justify-center"
            >
              <User className="w-5 h-5" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-40 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
                <div className="mb-2">
                  <label className="text-sm font-semibold block mb-1">Status</label>
                  <div
                    className="w-full border rounded px-2 py-1 text-sm flex items-center justify-between cursor-pointer"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <div className="flex items-center space-x-2">
                      {statusOptions.find((opt) => opt.value === user?.status)?.icon}
                      <span>{user?.status || "Select Status"}</span>
                    </div>
                    <span>{showStatusDropdown ? "▲" : "▼"}</span>
                  </div>
                  {showStatusDropdown && (
                    <div
                      ref={statusDropdownRef}
                      className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20"
                    >
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2 px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleStatusChange(option.value)}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <ul className="py-1 text-sm text-gray-700">
                  <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">Profile</li>
                  <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">Settings</li>
                  <li
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                    onClick={handlelogout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Home;