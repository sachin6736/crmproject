import React from 'react'
import { ChevronDown} from 'lucide-react'
import LeadTableHeader from './Leads'
import Lead from './Lead'
import { Outlet } from 'react-router-dom'

const Sales = () => {
  return (
    <div>
       <div className="w-full h-24 bg-[#ffffff] flex flex-col">
        <div className='h-1/2 w-full flex items-center justify-center'>
        
        </div>
        <div className='w-full h-1/2  flex flex-row items-start space-x-8'>
        <div className='w-auto h-full  flex items-center justify-center'>
        <span className='font-mono text-xl'>Sales</span>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex flex-row items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Leads</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Accounts</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Contacts</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Oppurtunities</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Products</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Analytics</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        <div className="w-auto h-full border-b-[4px] border-transparent hover:border-[#0250d9] flex items-center justify-center group">
        <span className='text-md mt-2 group-hover:text-[#0250d9]'>Calender</span>
        <ChevronDown className=' mt-2 group-hover:text-[#0250d9]'/>
        </div>
        </div>
       </div>
       <div className='w-full h-auto bg-slate-300'>
        <Outlet />
       </div>
    </div>
  )
}

export default Sales

