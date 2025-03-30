import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Userfrom from './components/Userfrom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    {/* <h1 className="text-3xl font-bold underline text-slate-600">
      Hello world!
    </h1> */}
    <Userfrom/>
    </>
  )
}

export default App
