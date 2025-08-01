import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Slide } from 'react-toastify';
import { useTheme } from './context/ThemeContext';
import Dashboard from './components/Dashboard';
import SalesDashboard from './components/SalesDashboard';
import Login from './components/Login';
import SignUp from './components/Signup';
import Home from './components/Home';
import Lead from './components/Lead';
import LeadTableHeader from './components/Leads';
import Userfrom from './components/Userfrom';
import OrderForm from './components/Orders';
import ProtectedRoute from './components/ProtectedRoute';
import OrdersHistory from './components/Ordersshow';
import OrderDetails from './components/OrderDetails';
import AdminStatusLogs from './components/AdminStatusLogs';
import CancelledVendor from './components/CancelledVendors';
import LitigationOrders from './components/Litigationorders';
import Litigationdetails from './components/Litigationdetails';

function App() {
  const { theme } = useTheme();

  return (
    <Router>
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        pauseOnHover
        theme={theme}
        transition={Slide}
        toastClassName='!w-[250px] !rounded-xl !shadow-md !text-sm !bg-white dark:!bg-gray-800 !text-gray-800 dark:!text-gray-200 border border-gray-200 dark:border-gray-700'
      />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path='sales' element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route index element={<LeadTableHeader />} />
            <Route path='lead/:id' element={<Lead />} />
          </Route>
          <Route path='userform' element={<Userfrom />} />
          <Route path='order/:id' element={<OrderForm />} />
          <Route path='orders' element={<OrdersHistory />} />
          <Route path='litigation-orders' element={<ProtectedRoute><LitigationOrders /></ProtectedRoute>} />
          <Route path='cancelledvendors' element={<CancelledVendor />} />
          <Route path='order/details/:orderId' element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
          <Route path='litigation/details/:orderId' element={<ProtectedRoute><Litigationdetails /></ProtectedRoute>} />
          <Route path='dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='salesdashboard' element={<SalesDashboard />} />
          <Route path='admin/status-logs' element={<ProtectedRoute><AdminStatusLogs /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;