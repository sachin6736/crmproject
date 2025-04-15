import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import SignUp from './components/Signup';
import Home from './components/Home';
import Homepage from './components/Homepage';
import Sales from './components/Sales';
import Lead from './components/Lead';
import LeadTableHeader from './components/Leads'
import Userfrom from './components/Userfrom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route for login */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes (after login) under /home */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>}>
          <Route index element={<Homepage />} />
          <Route path="/home/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>}>
            <Route index element={<LeadTableHeader />} />
            <Route path="/home/sales/lead/:id" element={<Lead />} />
          </Route>
          <Route path="/home/userform" element={<Userfrom />} />
          <Route path="/home/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;