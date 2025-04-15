import React from 'react'
import Sales from './Sales'
import { Outlet } from 'react-router-dom'
import { Home as HomeIcon,Users,Briefcase,LineChart,Headset,Megaphone,LucideShoppingCart,PenTool,User} from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'


function Home() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <>
    <div className='w-screen h-screen bg-white flex'>
     <div className="w-20 h-screen bg-[#002775] fixed left-0 top-0 border-r-[2px] border-r-white flex flex-col items-center pt-3 space-y-3 overflow-y-scroll">
        <div className="flex flex-col items-center space-y-1 "onClick={() => navigate('/home')}>
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
           <HomeIcon className='h-6 w-6 text-white'/>
          </div>
          <span className="text-white text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <Users className='h-6 w-6 text-white'/>
          </div>
          <span className="text-white text-[10px] font-bold">Contacts</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
           <Briefcase className='h-6 w-6 text-white'/>
          </div>
          <span className="text-white text-[10px] font-bold">Accounts</span>
        </div>
        <div className="flex flex-col items-center space-y-1 " onClick={() => navigate('/home/sales')}>
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <LineChart className='h-6 w-6 text-white' />
          </div>
          <span className="text-white text-[10px] font-bold">Sales</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <Headset className='h-6 w-6 text-white'/>
          </div>
          <span className="text-white text-[10px] font-bold">Service</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <Megaphone className='h-6 w-6 text-white' />
          </div>
          <span className="text-white text-[10px] font-bold">Outreach</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <LucideShoppingCart className='h-6 w-6 text-white'/>
          </div>
          <span className="text-white text-[10px] font-bold">Commerce</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <PenTool className='h-6 w-6 text-white' />
          </div>
          <span className="text-white text-[10px] pl-4 font-bold">Generative Canvas</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className='w-12 h-12 bg-[#002775] rounded-md border border-[#002775] hover:border-white transition duration-300 flex items-center justify-center'>
            <User className='h-6 w-6 text-white'/>
          </div>
          <span className="text-white text-[10px] font-bold">Your Account</span>
        </div>
     </div>
     <div className="flex-1 h-screen ml-20 flex flex-col">
        <div className="w-full h-12 bg-[#066afe]  flex items-center justify-end pr-4">
        <button onClick={() => setShowDropdown(!showDropdown)} type="button" className='w-8 h-8 bg-white text-[#066afe] rounded-full flex items-center justify-center'>
               <User className='w-5 h-5' />
        </button>
        {showDropdown && (
        <div className="absolute right-0 mt-40 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <ul className="py-1 text-sm text-gray-700">
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Logout</li>
          </ul>
        </div>
      )}
        </div>
        <div className="flex-1 overflow-y-auto">
        <Outlet/>
        </div>
      </div>
    </div>
    </>
  )
}

export default Home
