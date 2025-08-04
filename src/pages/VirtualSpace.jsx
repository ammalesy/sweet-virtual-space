import React, { useState } from 'react'
import JoinRoom from '../components/JoinRoom'
import VirtualRoom from '../components/VirtualRoom'

function VirtualSpace() {
  const [currentView, setCurrentView] = useState('landing') // 'landing', 'join', 'room'
  const [roomData, setRoomData] = useState(null)

  const handleEnterSpace = () => {
    setCurrentView('join')
  }

  const handleJoinRoom = (roomId, userName) => {
    setRoomData({ roomId, userName })
    setCurrentView('room')
  }

  const handleLeaveRoom = () => {
    setRoomData(null)
    setCurrentView('landing')
  }

  if (currentView === 'room' && roomData) {
    return (
      <VirtualRoom
        roomId={roomData.roomId}
        userName={roomData.userName}
        onLeave={handleLeaveRoom}
      />
    )
  }

  if (currentView === 'join') {
    return <JoinRoom onJoin={handleJoinRoom} />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Virtual Space</h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-4">
            พื้นที่ออนไลน์สำหรับการเชื่อมต่อและสร้างความสัมพันธ์ระหว่างผู้คน
          </p>
          <p className="text-gray-600">
            เหมือนกับเว็บ Gather ที่ให้คุณสามารถเข้าร่วมพื้นที่เสมือนจริงและมีปฏิสัมพันธ์กับผู้อื่นได้
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">✨ คุณสมบัติหลัก</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">🌐</span>
                <span>พื้นที่เสมือนจริงสำหรับการโต้ตอบ</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">👥</span>
                <span>เชื่อมต่อกับผู้คนจากทั่วโลก</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎮</span>
                <span>ประสบการณ์แบบเกมมิ่ง</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💬</span>
                <span>แชทและสื่อสารแบบเรียลไทม์</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎤</span>
                <span>การสื่อสารด้วยเสียงแบบเรียลไทม์</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚀 เริ่มต้นใช้งาน</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">ขั้นตอนที่ 1</h3>
                <p className="text-gray-600">ใส่ชื่อและเลือกห้อง</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">ขั้นตอนที่ 2</h3>
                <p className="text-gray-600">อนุญาตการใช้งานไมโครโฟน</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">ขั้นตอนที่ 3</h3>
                <p className="text-gray-600">เริ่มการเชื่อมต่อและสนุกสนาน</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleEnterSpace}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            เข้าสู่ Virtual Space
          </button>
          <p className="text-sm text-gray-500 mt-2">
            *ระบบจะขอสิทธิ์เข้าถึงไมโครโฟนเพื่อการสื่อสาร
          </p>
        </div>

        {/* New Features Section */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">🎯 คุณสมบัติใหม่</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="font-semibold text-gray-800 mb-2">Voice Chat</h3>
              <p className="text-sm text-gray-600">สื่อสารด้วยเสียงแบบเรียลไทม์กับผู้ใช้อื่นๆ</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="font-semibold text-gray-800 mb-2">Multiple Rooms</h3>
              <p className="text-sm text-gray-600">เลือกห้องที่เหมาะกับความสนใจของคุณ</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time</h3>
              <p className="text-sm text-gray-600">ทุกการโต้ตอบเกิดขึ้นแบบเรียลไทม์</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VirtualSpace