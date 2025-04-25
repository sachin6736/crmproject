import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SalesDashboard from './components/SalesDashboard';
import Login from './components/Login';
import SignUp from './components/Signup';
import Home from './components/Home';
import Homepage from './components/Homepage';
import Sales from './components/Sales';
import Lead from './components/Lead';
import LeadTableHeader from './components/Leads'
import Userfrom from './components/Userfrom';
import Orders from './components/Orders'
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Slide } from 'react-toastify';

function App() {
  return (
    <Router>
       <ToastContainer
  position="bottom-right"
  autoClose={3000}
  pauseOnHover
  theme="light"
  transition={Slide}
  toastClassName="!w-[250px]  !rounded-xl !shadow-md !text-sm !bg-white !text-gray-800 border border-gray-200"
/>
      <Routes>
        {/* Default route for login */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes (after login) under /home */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="/home/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>}>
            <Route index element={<LeadTableHeader />} />
            <Route path="/home/sales/lead/:id" element={<Lead />} />
          </Route>
          <Route path="/home/userform" element={<Userfrom />} />
          <Route path="/home/orders" element={<Orders/>}/>
          <Route path="/home/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/home/salesdashboard" element={<SalesDashboard/>}></Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;