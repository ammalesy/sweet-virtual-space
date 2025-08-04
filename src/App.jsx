import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Channel from './pages/Channel'
import AboutUs from './pages/AboutUs'
import VirtualSpace from './pages/VirtualSpace'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Channel />} />
          <Route path="/channel" element={<Channel />} />
          <Route path="/virtual-space" element={<VirtualSpace />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </main>
    </div>
  )
}

export default App