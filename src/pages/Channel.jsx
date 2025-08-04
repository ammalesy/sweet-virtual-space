import React from 'react'

function Channel() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Channel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Channel 1</h3>
            <p className="text-blue-100">Description for channel 1</p>
            <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              View Channel
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Channel 2</h3>
            <p className="text-green-100">Description for channel 2</p>
            <button className="mt-4 bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              View Channel
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Channel 3</h3>
            <p className="text-orange-100">Description for channel 3</p>
            <button className="mt-4 bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              View Channel
            </button>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Featured Content</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600">
              Welcome to our channel section. Here you can find all available channels and their content.
              Select a channel to explore more content and features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Channel