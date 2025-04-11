import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Userfrom from './components/Userfrom';
import Home from './components/Home';
import Sales from './components/Sales';
import Lead from './components/Lead';
import LeadTableHeader from './components/Leads';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard'
import Login from './components/Login';
import SignUp from './components/Signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<Homepage />} />
          <Route path="sales" element={<Sales />}>
            <Route index element={<LeadTableHeader />} />
            <Route path="lead/:id" element={<Lead />} />
          </Route>
          <Route path="/login" element={<Login/>}/>
          <Route path="/signup" element={<SignUp/>}/>
          <Route path="userform" element={<Userfrom />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
