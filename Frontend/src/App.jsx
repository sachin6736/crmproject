import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import Userfrom from './components/Userfrom'
import Home from './components/Home'
import Lead from './components/Lead';

function App() {

  return (
    <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/userform" element={<Userfrom />} />
      <Route path="/lead/:id" element={<Lead />} />
    </Routes>
  </Router>
  )
}

export default App
