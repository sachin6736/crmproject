import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Userfrom from './components/Userfrom'
import Home from './components/Home'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    {/* <h1 className="text-3xl font-bold underline text-slate-600">
      Hello world!
    </h1> */}
    {/* <Userfrom/> */}
    <Home/>
    </>
  )
}

export default App
