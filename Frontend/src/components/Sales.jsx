import React from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Sales = () => {
  const { theme } = useTheme();

  const navItems = [
    { label: 'Leads', path: 'leads' },
    { label: 'Analytics', path: 'analytics' },
    { label: 'Calendar', path: 'calendar' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full h-24 bg-white dark:bg-gray-800 flex flex-col">
        {/* <div className="h-1/2 w-full flex items-center justify-center">
          <span className="font-mono text-xl font-semibold">Sales</span>
        </div> */}
        <div className="w-full h-1/2 flex flex-row items-start space-x-8 px-4 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={`/home/sales/${item.path}`}
              className={({ isActive }) =>
                `w-auto h-full flex flex-row items-center justify-center group border-b-[4px] ${
                  isActive
                    ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400'
                    : 'border-transparent hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
                }`
              }
            >
              <span className="text-md mt-2 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                {item.label}
              </span>
              <ChevronDown
                className="mt-2 ml-1 w-4 h-4 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                aria-hidden="true"
              />
            </NavLink>
          ))}
        </div>
      </div>
      <div className="w-full h-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default Sales;