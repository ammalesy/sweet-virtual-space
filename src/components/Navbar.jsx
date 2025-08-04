import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Co-KPlus
            </Link>
          </div>
          
          <div className="flex space-x-6">
            <Link
              to="/channel"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/channel') || isActive('/')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
              }`}
            >
              Channel
            </Link>
            <Link
              to="/virtual-space"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/virtual-space')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
              }`}
            >
              Virtual Space
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
              }`}
            >
              About Us
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar