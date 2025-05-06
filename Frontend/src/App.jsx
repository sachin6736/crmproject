import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Slide } from 'react-toastify';
import { useTheme } from './context/ThemeContext';
import Dashboard from './components/Dashboard';
import SalesDashboard from './components/SalesDashboard';
import Login from './components/Login';
import SignUp from './components/Signup';
import Home from './components/Home';
import Homepage from './components/Homepage';
import Sales from './components/Sales';
import Lead from './components/Lead';
import LeadTableHeader from './components/Leads';
import Userfrom from './components/Userfrom';
import OrderForm from './components/Orders';
import ProtectedRoute from './components/ProtectedRoute';

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
          <Route path='/home/sales' element={<ProtectedRoute><Sales /></ProtectedRoute>}>
            <Route index element={<LeadTableHeader />} />
            <Route path='/home/sales/lead/:id' element={<Lead />} />
          </Route>
          <Route path='/home/userform' element={<Userfrom />} />
          <Route path='/home/order/:id' element={<OrderForm />} />
          <Route path='/home/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/home/salesdashboard' element={<SalesDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;