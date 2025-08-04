import React from 'react'

function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">เกี่ยวกับเรา</h1>
        
        <div className="prose prose-lg max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">พันธกิจของเรา</h2>
            <p className="text-gray-600 leading-relaxed">
              ยินดีต้อนรับสู่ Co-KPlus! เราเป็นทีมที่มุ่งมั่นในการให้บริการเนื้อหาและบริการที่ยอดเยี่ยม
              ผ่านช่องทางต่างๆ ของเรา พันธกิจของเราคือการเชื่อมต่อ แจ้งข่าวสาร และสร้างแรงบันดาลใจให้กับ
              ชุมชนของเราผ่านประสบการณ์ดิจิทัลที่สร้างสรรค์
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">สิ่งที่เราทำ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">สร้างเนื้อหา</h3>
                <p className="text-blue-700">
                  เราสร้างเนื้อหาที่น่าสนใจและมีคุณค่าในหลากหลายช่องทางเพื่อรองรับผู้ชมที่หลากหลาย
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">สร้างชุมชน</h3>
                <p className="text-green-700">
                  สร้างชุมชนที่เข้มแข็งและส่งเสริมการเชื่อมต่อที่มีความหมายระหว่างผู้ใช้ของเรา
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">ทีมงานของเรา</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-gray-800">สมาชิกทีมคนที่ 1</h3>
                <p className="text-gray-600 text-sm">ตำแหน่ง</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-gray-800">สมาชิกทีมคนที่ 2</h3>
                <p className="text-gray-600 text-sm">ตำแหน่ง</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-gray-800">สมาชิกทีมคนที่ 3</h3>
                <p className="text-gray-600 text-sm">ตำแหน่ง</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">ติดต่อเรา</h2>
            <p className="text-gray-600 mb-4">
              มีคำถามหรือต้องการเรียนรู้เพิ่มเติมเกี่ยวกับสิ่งที่เราทำ? เรายินดีที่จะรับฟังจากคุณ!
            </p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
              ติดต่อเรา
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs