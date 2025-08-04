import React from 'react'

function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">About Us</h1>
        
        <div className="prose prose-lg max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Co-KPlus! We are dedicated to providing exceptional content and services 
              through our various channels. Our mission is to connect, inform, and inspire our 
              community through innovative digital experiences.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">What We Do</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Content Creation</h3>
                <p className="text-blue-700">
                  We create engaging and valuable content across multiple channels to serve our diverse audience.
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Community Building</h3>
                <p className="text-green-700">
                  Building strong communities and fostering meaningful connections between our users.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-gray-800">Team Member 1</h3>
                <p className="text-gray-600 text-sm">Position</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-gray-800">Team Member 2</h3>
                <p className="text-gray-600 text-sm">Position</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-gray-800">Team Member 3</h3>
                <p className="text-gray-600 text-sm">Position</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-4">
              Have questions or want to learn more about what we do? We'd love to hear from you!
            </p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs