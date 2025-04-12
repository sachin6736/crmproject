import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import SignUp from './components/Signup';
import Home from './components/Home';
import Homepage from './components/Homepage';
import Sales from './components/Sales';
import Lead from './components/Lead';
import LeadTableHeader from './components/Lead'
import Userfrom from './components/Userfrom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route for login */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes (after login) under /home */}
        <Route path="/home" element={<Home />}>
          <Route index element={<Homepage />} />
          <Route path="sales" element={<Sales />}>
            <Route index element={<LeadTableHeader />} />
            <Route path="lead/:id" element={<Lead />} />
          </Route>
          <Route path="userform" element={<Userfrom />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;