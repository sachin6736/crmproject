import React from 'react'
import { Triangle } from 'lucide-react'
import { Pencil } from 'lucide-react'

const Lead = () => {
  return (
    <div className="p-8">
    <div className=" flex items-end justify-end">
    <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/3">
      {["Convert", "Change Owner", "Edit",<Triangle size={16} color="blue-500" className="rotate-180 fill-blue-500" />].map((button, index) => (
        <button
          key={index}
          className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300"
        >
          {button}
        </button>
      ))}
    </div>
    </div>
    <div className="flex justify-center items-center  bg-white rounded-full shadow-md p-2 mb-4 w-full m-2 h-14">
       <div className='bg-[#e5e5e5] p-2 m-2 w-3/4 h-3/4 flex justify-start space-x-2 rounded-full items-center'>
      {["New", "Contacted", "Nurturing","Unqualified","Not Qualified"].map((button, index) => (
        <button
          key={index}
          className="flex items-center justify-center  w-40 text-white border-r last:border-r-0 border-gray-300 hover:bg-[#032d60]"
        >
          {button}
        </button>
      ))}
       </div>
    </div>
    <div className="w-full h-96 p-2 space-x-2 bg-slate-300 flex items-center justify-center flex-row m-2">
  <div className="w-1/3 h-full rounded-2xl bg-slate-50 p-4">
    <h2 className="text-lg font-semibold border-b pb-2">About</h2>
    <div className="mt-2 space-y-2">
      {[
        { label: "Name", value: "Ananya" },
        { label: "Phone number", value: "ABCDEF" },
        { label: "Email", value: "ananyajan2000a2gmail.com" },
        { label: "Part Requested", value: "Transmission" },
        { label: "Lead Status", value: "New" },
        { label: "Zip", value: "673571" },
      ].map((item, index) => (
        <div key={index} className="flex justify-between items-center border-b pb-1">
          <span className="text-gray-600">{item.label}</span>
          {item.isLink ? (
            <a href="#" className="text-blue-500 hover:underline">
              {item.value}
            </a>
          ) : (
            <span>{item.value}</span>
          )}
          <span className="text-gray-400 cursor-pointer hover:text-gray-600"><Pencil size={16}/></span>
        </div>
      ))}
    </div>
  </div>

  <div className="w-1/3 h-full rounded-2xl bg-slate-50"></div>
  <div className="w-1/3 h-full rounded-2xl bg-slate-50"></div>
</div>

    
    
    
    </div>
    )
}

export default Lead
