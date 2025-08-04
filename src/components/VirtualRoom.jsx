import React, { useState, useEffect, useRef } from 'react'

function VirtualRoom({ roomId, userName, onLeave }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [connectionError, setConnectionError] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [microphoneStatus, setMicrophoneStatus] = useState('requesting')
  const [audioLevel, setAudioLevel] = useState(0)
  const [peersConnected, setPeersConnected] = useState(new Map())
  
  const chatRef = useRef()
  const socketRef = useRef()
  const streamRef = useRef()
  const audioContextRef = useRef()
  const analyserRef = useRef()
  const audioLevelIntervalRef = useRef()
  const peersRef = useRef(new Map())
  const remoteAudiosRef = useRef(new Map())

  useEffect(() => {
    initializeRoom()
    
    return () => {
      cleanup()
    }
  }, [roomId])

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Clean up peer connections
    peersRef.current.forEach(peer => {
      peer.close() // Changed from destroy() to close() for native WebRTC
    })
    peersRef.current.clear()
    
    // Clean up remote audio elements
    remoteAudiosRef.current.forEach(audio => {
      if (audio.srcObject) {
        audio.srcObject.getTracks().forEach(track => track.stop())
      }
      audio.remove()
    })
    remoteAudiosRef.current.clear()
    
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current)
    }
  }

  const createPeerConnection = async (userId, userName, isInitiator) => {
    try {
      // Use native WebRTC instead of simple-peer
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      // Add local stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, streamRef.current)
        })
      }

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        addChatMessage('System', `🔊 เชื่อมต่อเสียงกับ ${userName} สำเร็จ`)
        
        // Create audio element for remote stream
        const audio = document.createElement('audio')
        audio.srcObject = remoteStream
        audio.autoplay = true
        audio.volume = 1.0
        audio.controls = false
        
        // Add to DOM (hidden)
        audio.style.display = 'none'
        document.body.appendChild(audio)
        
        remoteAudiosRef.current.set(userId, audio)
        setPeersConnected(prev => new Map(prev).set(userId, true))
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            userId: userId,
            roomId: roomId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate
            }
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          addChatMessage('System', `✅ WebRTC เชื่อมต่อกับ ${userName} สำเร็จ`)
        } else if (peerConnection.connectionState === 'disconnected') {
          addChatMessage('System', `🔇 ขาดการเชื่อมต่อกับ ${userName}`)
          
          // Cleanup
          if (remoteAudiosRef.current.has(userId)) {
            const audio = remoteAudiosRef.current.get(userId)
            audio.remove()
            remoteAudiosRef.current.delete(userId)
          }
          
          setPeersConnected(prev => {
            const updated = new Map(prev)
            updated.delete(userId)
            return updated
          })
        }
      }

      // Create offer or wait for offer
      if (isInitiator) {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        
        if (socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            userId: userId,
            roomId: roomId,
            signal: {
              type: 'offer',
              sdp: offer
            }
          })
        }
      }

      peersRef.current.set(userId, peerConnection)
      
    } catch (error) {
      console.error('Failed to create peer connection:', error)
      addChatMessage('System', '❌ ไม่สามารถสร้างการเชื่อมต่อเสียงได้')
    }
  }

  const initializeRoom = async () => {
    try {
      setIsConnecting(true)
      setConnectionError(null)

      // Try to load socket.io dynamically
      const io = await import('socket.io-client').then(module => module.default || module)
      
      // Initialize socket connection with shorter timeout
      socketRef.current = io('http://localhost:3001', {
        timeout: 2000,
        forceNew: true,
        transports: ['websocket', 'polling']
      })
      
      // Set up timeout to fallback to demo mode
      const connectionTimeout = setTimeout(() => {
        if (!socketConnected) {
          console.log('Server not available, switching to Demo Mode')
          setConnectionError('เซิร์ฟเวอร์ไม่พร้อมใช้งาน - ใช้โหมด Demo')
          initializeMockRoom()
        }
      }, 3000)

      setupSocketListeners(connectionTimeout)
      
      // Try to get user media with detailed error handling
      await initializeMicrophone()
      
      // Join room
      socketRef.current.emit('join-room', { roomId, userName })
      
    } catch (error) {
      console.log('Initializing Demo Mode due to connection issue')
      setConnectionError('เซิร์ฟเวอร์ไม่พร้อมใช้งาน - ใช้โหมด Demo')
      initializeMockRoom()
    }
    
    setIsConnecting(false)
  }

  const initializeMicrophone = async () => {
    try {
      setMicrophoneStatus('requesting')
      addChatMessage('System', 'กำลังขอสิทธิ์เข้าถึงไมโครโฟน...')

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setMicrophoneStatus('granted')
      
      addChatMessage('System', '✅ ไมโครโฟนพร้อมใช้งาน!')
      
      // Setup audio level monitoring
      setupAudioLevelMonitoring(stream)
      
      // Test audio playback
      testAudioPlayback()

    } catch (error) {
      console.error('Microphone access error:', error)
      setMicrophoneStatus('denied')
      
      let errorMessage = 'ไม่สามารถเข้าถึงไมโครโฟนได้'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '❌ ผู้ใช้ปฏิเสธการเข้าถึงไมโครโฟน - กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์'
      } else if (error.name === 'NotFoundError') {
        errorMessage = '❌ ไม่พบไมโครโฟน - กรุณาเชื่อมต่อไมโครโฟน'
      } else if (error.name === 'NotReadableError') {
        errorMessage = '❌ ไมโครโฟนถูกใช้งานโดยแอปอื่น'
      }
      
      addChatMessage('System', errorMessage)
    }
  }

  const setupAudioLevelMonitoring = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      const microphone = audioContextRef.current.createMediaStreamSource(stream)
      microphone.connect(analyserRef.current)
      
      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      // Monitor audio level
      audioLevelIntervalRef.current = setInterval(() => {
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        setAudioLevel(average)
      }, 100)
      
    } catch (error) {
      console.error('Audio monitoring setup error:', error)
    }
  }

  const testAudioPlayback = () => {
    addChatMessage('System', '🔊 ระบบเสียงพร้อมใช้งาน')
  }

  const initializeMockRoom = () => {
    // Mock data for testing when server is not available
    setConnectedUsers([
      { id: 'mock-1', userName: userName },
      { id: 'mock-2', userName: 'Demo User' }
    ])
    
    addChatMessage('System', 'กำลังใช้งานในโหมด Demo (ไม่มี server)')
    addChatMessage('System', 'เริ่ม WebSocket server เพื่อใช้งานจริง')
  }

  const setupSocketListeners = (connectionTimeout) => {
    const socket = socketRef.current

    socket.on('connect', () => {
      clearTimeout(connectionTimeout)
      setSocketConnected(true)
      setConnectionError(null)
      console.log('✅ Connected to WebSocket server')
      addChatMessage('System', '🟢 เชื่อมต่อ WebSocket server สำเร็จ!')
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
      console.log('❌ Disconnected from server')
      addChatMessage('System', '🔴 ขาดการเชื่อมต่อ server')
    })

    socket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout)
      console.log('Server not available, using Demo Mode')
      setConnectionError('เซิร์ฟเวอร์ไม่พร้อมใช้งาน - ใช้โหมด Demo')
      initializeMockRoom()
    })

    socket.on('user-list', (users) => {
      // Remove duplicates and ensure unique users
      const uniqueUsers = users.filter((user, index, arr) => 
        arr.findIndex(u => u.id === user.id) === index
      )
      setConnectedUsers(uniqueUsers)
      addChatMessage('System', `ยินดีต้อนรับสู่ Virtual Space! มีผู้ใช้ ${uniqueUsers.length} คน`)
      
      // Create peer connections for existing users (excluding self)
      uniqueUsers.forEach(user => {
        if (user.id !== socket.id && streamRef.current) {
          createPeerConnection(user.id, user.userName, true)
        }
      })
    })

    socket.on('user-joined', (user) => {
      setConnectedUsers(prev => {
        // Check if user already exists to prevent duplicates
        if (prev.find(u => u.id === user.id)) {
          return prev
        }
        return [...prev, user]
      })
      addChatMessage('System', `${user.userName} เข้าร่วมห้อง`)
      
      // Create peer connection for new user (as receiver)
      if (streamRef.current) {
        createPeerConnection(user.id, user.userName, false)
      }
    })

    socket.on('user-left', (user) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== user.id))
      addChatMessage('System', `${user.userName} ออกจากห้อง`)
      
      // Clean up peer connection
      if (peersRef.current.has(user.id)) {
        peersRef.current.get(user.id).close() // Changed from destroy() to close()
        peersRef.current.delete(user.id)
      }
      
      // Clean up remote audio
      if (remoteAudiosRef.current.has(user.id)) {
        const audio = remoteAudiosRef.current.get(user.id)
        audio.remove()
        remoteAudiosRef.current.delete(user.id)
      }
      
      setPeersConnected(prev => {
        const updated = new Map(prev)
        updated.delete(user.id)
        return updated
      })
    })

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message])
    })

    // WebRTC signaling
    socket.on('webrtc-signal', async ({ userId, signal }) => {
      const peerConnection = peersRef.current.get(userId)
      if (!peerConnection) return

      try {
        if (signal.type === 'offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          const answer = await peerConnection.createAnswer()
          await peerConnection.setLocalDescription(answer)
          
          socket.emit('webrtc-signal', {
            userId: userId,
            roomId: roomId,
            signal: {
              type: 'answer',
              sdp: answer
            }
          })
        } else if (signal.type === 'answer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        } else if (signal.type === 'ice-candidate') {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate))
        }
      } catch (error) {
        console.error('WebRTC signaling error:', error)
      }
    })
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        addChatMessage('System', `🎤 ไมโครโฟน${isMuted ? 'เปิด' : 'ปิด'}แล้ว`)
      }
    }

    if (socketRef.current && socketConnected) {
      socketRef.current.emit('mute-status', {
        roomId,
        isMuted: !isMuted
      })
    }
  }

  const requestMicrophoneAccess = async () => {
    await initializeMicrophone()
  }

  const addChatMessage = (sender, message) => {
    setChatMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender,
      message,
      timestamp: new Date().toLocaleTimeString('th-TH')
    }])
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    if (socketRef.current && socketConnected) {
      socketRef.current.emit('chat-message', {
        roomId,
        message: newMessage
      })
    } else {
      // Mock chat in demo mode
      addChatMessage(userName, newMessage)
    }
    
    setNewMessage('')
  }

  const leaveRoom = () => {
    cleanup()
    onLeave()
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังเชื่อมต่อ Virtual Space...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Virtual Space - {roomId}</h2>
          <div className="flex items-center space-x-4">
            <p className="text-gray-400">ผู้ใช้ออนไลน์: {connectedUsers.length}</p>
            <div className={`px-2 py-1 rounded text-xs ${
              socketConnected ? 'bg-green-600' : 'bg-yellow-600'
            }`}>
              {socketConnected ? '🟢 Connected' : '🟡 Demo Mode'}
            </div>
          </div>
        </div>
        <button
          onClick={leaveRoom}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
        >
          ออกจากห้อง
        </button>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="bg-yellow-600 text-black p-3 text-center">
          ⚠️ {connectionError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Virtual Space Area */}
        <div className="flex-1 flex flex-col">
          {/* Virtual Space Canvas */}
          <div className="flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* User Avatars */}
            <div className="absolute inset-0 p-8">
              {connectedUsers.map((user, index) => {
                const isMe = user.userName === userName
                
                return (
                  <div
                    key={user.id}
                    className="absolute"
                    style={{
                      left: `${20 + index * 150}px`,
                      top: `${150 + index * 50}px`
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                        isMe ? 'bg-green-600' : 'bg-blue-600'
                      } ${!isMuted && streamRef.current ? 'ring-4 ring-green-400 animate-pulse' : ''}`}>
                        👤
                      </div>
                      <div className="mt-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                        {user.userName}
                        {isMe && (
                          <span className="ml-1 text-green-400">(You)</span>
                        )}
                      </div>
                      {isMe && (
                        <div className="mt-1 text-xs">
                          {isMuted ? (
                            <span className="text-red-400">🔇 Muted</span>
                          ) : (
                            <span className="text-green-400">🎤 Active</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-4 rounded-lg max-w-sm">
              <h3 className="font-semibold mb-2">การใช้งาน Virtual Space</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• เริ่ม server: <code className="bg-gray-800 px-1 rounded">node server.js</code></li>
                <li>• แชทกับผู้ใช้อื่นๆ ได้</li>
                <li>• เปิด 2 browser เพื่อทดสอบ</li>
                <li>• ใช้ไมโครโฟนเมื่อเชื่อมต่อ server แล้ว</li>
              </ul>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="bg-gray-800 p-4 flex justify-center space-x-4">
            <button
              onClick={toggleMute}
              className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={!streamRef.current}
            >
              <span className="text-xl">
                {isMuted ? '🔇' : '🎤'}
              </span>
              <span>
                {isMuted ? 'เปิดไมค์' : 'ปิดไมค์'}
              </span>
            </button>

            <div className="bg-gray-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <span className="text-xl">🌐</span>
              <span className="text-sm">
                {socketConnected ? `เชื่อมต่อ: ${connectedUsers.length} คน` : 'Demo Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold">
              แชท {socketConnected ? '(Real-time)' : '(Demo)'}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatRef}>
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="flex items-baseline space-x-2">
                  <span className={`font-medium ${
                    msg.sender === 'System' ? 'text-yellow-400' :
                    msg.sender === userName ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {msg.sender}
                  </span>
                  <span className="text-gray-500 text-xs">{msg.timestamp}</span>
                </div>
                <p className="text-gray-300 mt-1">{msg.message}</p>
              </div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                ส่ง
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VirtualRoom