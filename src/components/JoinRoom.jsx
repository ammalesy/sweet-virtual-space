import React, { useState } from 'react'

function JoinRoom({ onJoin }) {
  const [userName, setUserName] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('general')
  const [isJoining, setIsJoining] = useState(false)

  const rooms = [
    { id: 'general', name: 'ห้องทั่วไป', description: 'พื้นที่สำหรับการสนทนาทั่วไป', users: 3 },
    { id: 'gaming', name: 'ห้องเกม', description: 'คุยเรื่องเกมและเล่นเกมร่วมกัน', users: 7 },
    { id: 'study', name: 'ห้องเรียน', description: 'พื้นที่สำหรับการเรียนรู้และแลกเปลี่ยน', users: 5 },
    { id: 'work', name: 'ห้องทำงาน', description: 'ประชุมและทำงานร่วมกัน', users: 2 },
    { id: 'creative', name: 'ห้องสร้างสรรค์', description: 'แบ่งปันผลงานและความคิดสร้างสรรค์', users: 4 }
  ]

  const handleJoin = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      setIsJoining(true)
      // จำลองการเชื่อมต่อ
      setTimeout(() => {
        onJoin(selectedRoom, userName.trim())
      }, 1500)
    }
  }

  if (isJoining) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">กำลังเข้าร่วม Virtual Space</h2>
          <p className="text-gray-600 mb-4">กำลังตรวจสอบไมโครโฟนและเชื่อมต่อ...</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 เคล็ดลับ: อนุญาตการเข้าถึงไมโครโฟนเมื่อเบราว์เซอร์ขอสิทธิ์
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">เข้าร่วม Virtual Space</h1>
        
        <form onSubmit={handleJoin} className="space-y-8">
          {/* User Name Input */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              ชื่อของคุณ
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="ใส่ชื่อที่ต้องการให้ผู้อื่นเห็น"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
              maxLength={20}
            />
            <p className="text-sm text-gray-500 mt-2">ชื่อจะแสดงให้ผู้ใช้อื่นเห็นใน Virtual Space</p>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              เลือกห้องที่ต้องการเข้าร่วม
            </label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedRoom === room.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-1">👥</span>
                      <span>{room.users}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                  <div className={`w-3 h-3 rounded-full ${
                    room.users > 0 ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* System Requirements */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 ข้อกำหนดระบบ</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• เบราว์เซอร์ที่รองรับ WebRTC (Chrome, Firefox, Safari, Edge)</li>
              <li>• ไมโครโฟนที่ทำงานได้</li>
              <li>• การเชื่อมต่ออินเทอร์เน็ตที่เสถียร</li>
              <li>• อนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์</li>
            </ul>
          </div>

          {/* Join Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={!userName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-lg"
            >
              🚀 เข้าร่วม Virtual Space
            </button>
            <p className="text-sm text-gray-500 mt-4">
              เมื่อคลิกเข้าร่วม ระบบจะขอสิทธิ์เข้าถึงไมโครโฟนของคุณ
            </p>
          </div>
        </form>

        {/* Features Preview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="font-semibold text-gray-800 mb-2">เสียงแบบเรียลไทม์</h3>
            <p className="text-sm text-gray-600">สื่อสารด้วยเสียงกับผู้ใช้อื่นๆ แบบทันที</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-800 mb-2">แชทสด</h3>
            <p className="text-sm text-gray-600">ส่งข้อความและแชทกับคนในห้องเดียวกัน</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-3">🌐</div>
            <h3 className="font-semibold text-gray-800 mb-2">พื้นที่เสมือนจริง</h3>
            <p className="text-sm text-gray-600">สำรวจและเดินทางในโลกเสมือนจริง</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinRoom