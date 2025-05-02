import React from "react";
import Sales from "./Sales";
import { Outlet } from "react-router-dom";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Home() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.log("logout  failed");
      }
    } catch (error) {
      console.log("error during logout ", error);
    }
  };
  return (
    <>
      <div className="w-screen h-screen bg-white flex">
        <div className="w-20 h-screen bg-[#002775] fixed left-0 top-0 border-r-[2px] border-r-white flex flex-col items-center pt-3 space-y-3 overflow-y-scroll">
          <div
            className="flex flex-col items-center space-y-1 "
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
            className="flex flex-col items-center space-y-1 "
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
            <span className="text-white text-[10px] font-bold">
              Your Account
            </span>
          </div>
        </div>
        <div className="flex-1 h-screen ml-20 flex flex-col">
          <div className="w-full h-24 bg-[#066afe] flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Equivise Logo" className="w-20 h-20 " />
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
                    <label className="text-sm font-semibold block mb-1">
                      Status
                    </label>
                    <select
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={user?.status || ""}
                      onChange={async (e) => {
                        const selectedStatus = e.target.value;
                        try {
                          const res = await fetch(
                            `http://localhost:3000/Sales/changestatus/${user.id}`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ status: selectedStatus }),
                              credentials: "include",
                            }
                          );
                          if (res.ok) {
                            const updated = await res.json();
                            setUser((prev) => ({
                              ...prev,
                              status: updated.status,
                            }));
                            toast.success("status changed");
                          }
                        } catch (err) {
                          console.log("Error changing status:", err);
                          toast.error("error occured");
                        }
                      }}
                    >
                      <option value="Available">Available</option>
                      <option value="OnBreak">OnBreak</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Meeting">Meeting</option>
                      <option value="LoggedOut">LoggedOut</option>
                    </select>
                  </div>
                  <ul className="py-1 text-sm text-gray-700">
                    <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                      Profile
                    </li>
                    <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                      Settings
                    </li>
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
    </>
  );
}

export default Home;
