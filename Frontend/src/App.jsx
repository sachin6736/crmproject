import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import Userfrom from './components/Userfrom'
import Home from './components/Home'
import Lead from './components/Lead';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
    <Routes>
      <Route path="/" element={<Home />} />  {/* Home page route */}
      <Route path="/userform" element={<Userfrom />} />  {/* Userform page route */}
      <Route path="/lead/${lead._id}" element={<Lead />} />
    </Routes>
  </Router>
  )
}

export default App
