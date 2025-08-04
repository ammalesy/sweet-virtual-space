import React from 'react'

function Channel() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">ช่องสื่อสาร</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">ช่อง 1</h3>
            <p className="text-blue-100">รายละเอียดของช่อง 1</p>
            <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              ดูช่อง
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">ช่อง 2</h3>
            <p className="text-green-100">รายละเอียดของช่อง 2</p>
            <button className="mt-4 bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              ดูช่อง
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">ช่อง 3</h3>
            <p className="text-orange-100">รายละเอียดของช่อง 3</p>
            <button className="mt-4 bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              ดูช่อง
            </button>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">เนื้อหาแนะนำ</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600">
              ยินดีต้อนรับสู่ส่วนช่องสื่อสารของเรา ที่นี่คุณสามารถค้นหาช่องทางและเนื้อหาต่างๆ ที่มีอยู่ทั้งหมด
              เลือกช่องที่สนใจเพื่อสำรวจเนื้อหาและคุณสมบัติเพิ่มเติม
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Channel