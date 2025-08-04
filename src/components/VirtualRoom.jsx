import React, { useState, useEffect, useRef, useCallback } from 'react'

function VirtualRoom({ roomId, userName, onLeave }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [microphoneStatus, setMicrophoneStatus] = useState('requesting')
  const [audioLevel, setAudioLevel] = useState(0)
  const [peersConnected, setPeersConnected] = useState(new Map())
  const [isWebRTCConnecting, setIsWebRTCConnecting] = useState(false)
  const [hasConnectedPeers, setHasConnectedPeers] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  
  const socketRef = useRef()
  const streamRef = useRef()
  const audioContextRef = useRef()
  const analyserRef = useRef()
  const audioLevelIntervalRef = useRef()
  const peersRef = useRef(new Map())
  const remoteAudiosRef = useRef(new Map())
  const hasInitialized = useRef(false) // Add flag to prevent double initialization

  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) {
      return
    }
    
    hasInitialized.current = true
    initializeRoom()
    
    return () => {
      cleanup()
      hasInitialized.current = false
    }
  }, []) // Remove roomId dependency to prevent re-initialization

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
      // Check if peer connection already exists
      if (peersRef.current.has(userId)) {
        console.log(`⚠️ Peer connection with ${userName} already exists, skipping`)
        return
      }

      console.log(`🔄 Creating peer connection with ${userName} (initiator: ${isInitiator})`)
      
      // Use native WebRTC instead of simple-peer
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.googleapis.com:19302' },
          // Add free TURN servers for better connectivity
          {
            urls: 'turn:relay1.expressturn.com:3478',
            username: 'efWOQV86PWBV8ZJSQY',
            credential: 'nNuBJNDkEinuOhGFzDq2'
          }
        ],
        iceCandidatePoolSize: 10
      })

      // Store peer connection immediately to prevent race conditions
      peersRef.current.set(userId, peerConnection)

      // Add local stream tracks
      if (streamRef.current) {
        console.log(`📤 Adding local stream tracks to peer ${userName}`)
        streamRef.current.getTracks().forEach(track => {
          console.log(`Adding track: ${track.kind}, enabled: ${track.enabled}`)
          peerConnection.addTrack(track, streamRef.current)
        })
      } else {
        console.error('❌ No local stream available when creating peer connection')
      }

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        console.log(`🔊 เชื่อมต่อเสียงกับ ${userName} สำเร็จ - Stream tracks:`, remoteStream.getTracks().length)
        
        // Log track details
        remoteStream.getTracks().forEach(track => {
          console.log(`Remote track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`)
        })
        
        // Create audio element for remote stream
        const audio = document.createElement('audio')
        audio.srcObject = remoteStream
        audio.autoplay = true
        audio.volume = 1.0
        audio.controls = false
        audio.playsInline = true // Important for mobile
        
        // Add event listeners for debugging
        audio.addEventListener('loadedmetadata', () => {
          console.log(`📻 Audio metadata loaded for ${userName}`)
        })
        
        audio.addEventListener('play', () => {
          console.log(`▶️ Audio playing for ${userName}`)
        })
        
        audio.addEventListener('error', (e) => {
          console.error(`❌ Audio error for ${userName}:`, e)
        })
        
        // Add to DOM (hidden)
        audio.style.display = 'none'
        document.body.appendChild(audio)
        
        // Force play (required for some browsers)
        audio.play().then(() => {
          console.log(`✅ Successfully started playing audio from ${userName}`)
        }).catch(error => {
          console.error(`❌ Failed to play audio from ${userName}:`, error)
        })
        
        remoteAudiosRef.current.set(userId, audio)
        setPeersConnected(prev => new Map(prev).set(userId, true))
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log(`🧊 Sending ICE candidate to ${userName}`)
          socketRef.current.emit('webrtc-signal', {
            userId: userId,
            roomId: roomId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate
            }
          })
        } else if (!event.candidate) {
          console.log(`🏁 ICE gathering complete for ${userName}`)
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`🔗 Connection state with ${userName}: ${peerConnection.connectionState}`)
        
        if (peerConnection.connectionState === 'connected') {
          console.log(`✅ WebRTC เชื่อมต่อกับ ${userName} สำเร็จ`)
          setPeersConnected(prev => new Map(prev).set(userId, true))
          
          // Check if all expected peers are connected
          setTimeout(() => {
            const totalExpectedPeers = connectedUsers.length - 1; // Exclude self
            const connectedPeersCount = Array.from(peersRef.current.values()).filter(
              peer => peer.connectionState === 'connected'
            ).length;
            
            if (connectedPeersCount === totalExpectedPeers && totalExpectedPeers > 0) {
              setIsWebRTCConnecting(false);
              setHasConnectedPeers(true);
            }
          }, 500);
        } else if (peerConnection.connectionState === 'disconnected') {
          console.log(`🔇 ขาดการเชื่อมต่อกับ ${userName}`)
          
          // Cleanup
          cleanupPeerConnection(userId)
        } else if (peerConnection.connectionState === 'failed') {
          console.error(`❌ WebRTC connection failed with ${userName}`)
          
          // Try to restart ICE connection
          console.log(`🔄 Attempting to restart ICE connection with ${userName}`)
          peerConnection.restartIce()
          
          // If restart fails, cleanup and try to recreate connection
          setTimeout(() => {
            if (peerConnection.connectionState === 'failed') {
              console.log(`🔄 Recreating connection with ${userName}`)
              cleanupPeerConnection(userId)
              
              // Attempt to recreate peer connection
              setTimeout(() => {
                if (streamRef.current) {
                  createPeerConnection(userId, userName, true)
                }
              }, 2000)
            }
          }, 5000)
        }
      }

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`❄️ ICE connection state with ${userName}: ${peerConnection.iceConnectionState}`)
        
        if (peerConnection.iceConnectionState === 'failed') {
          console.error(`❄️ ICE connection failed with ${userName}`)
          // Try to restart ICE
          peerConnection.restartIce()
        }
      }

      // Create offer or wait for offer
      if (isInitiator) {
        console.log(`📞 Creating offer for ${userName}`)
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        })
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

      console.log(`✅ Peer connection created with ${userName}`)
      
    } catch (error) {
      console.error('Failed to create peer connection:', error)
      console.log('❌ ไม่สามารถสร้างการเชื่อมต่อเสียงได้')
      
      // Clean up on error
      if (peersRef.current.has(userId)) {
        peersRef.current.delete(userId)
      }
    }
  }

  const cleanupPeerConnection = (userId) => {
    console.log(`🧹 Cleaning up peer connection with ${userId}`)
    
    if (peersRef.current.has(userId)) {
      const peerConnection = peersRef.current.get(userId)
      
      // Close the peer connection
      peerConnection.close()
      peersRef.current.delete(userId)
      
      // Remove remote audio element
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

  const initializeRoom = async () => {
    try {
      setIsConnecting(true)
      setConnectionError(null)

      // Clear any existing users before connecting
      setConnectedUsers([])

      // Request user interaction for audio playback (required by browsers)
      await requestAudioPermission()

      // Try to load socket.io dynamically
      const io = await import('socket.io-client').then(module => module.default || module)
      
      // Initialize socket connection with Railway-optimized configuration (polling only)
      socketRef.current = io('https://sweet-virtual-space-production.up.railway.app', {
        timeout: 15000,
        forceNew: true,
        transports: ['polling'], // Use only polling for Railway
        upgrade: false, // Disable WebSocket upgrade for Railway
        withCredentials: false,
        autoConnect: true,
        reconnection: false, // Disable auto-reconnection to prevent duplicates
        reconnectionAttempts: 0
      })
      
      // Set up timeout to fallback to demo mode
      const connectionTimeout = setTimeout(() => {
        if (!socketConnected) {
          console.log('Server connection timeout, switching to Demo Mode')
          setConnectionError('เซิร์ฟเวอร์ใช้เวลานานเกินไป - ใช้โหมด Demo')
          initializeMockRoom()
        }
      }, 20000)

      setupSocketListeners(connectionTimeout)
      
      // Try to get user media with detailed error handling
      await initializeMicrophone()
      
    } catch (error) {
      console.log('Initializing Demo Mode due to connection issue:', error)
      setConnectionError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ - ใช้โหมด Demo')
      initializeMockRoom()
    }
    
    setIsConnecting(false)
  }

  const requestAudioPermission = async () => {
    try {
      // Create a silent audio context to request audio permission
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
        console.log('✅ Audio context resumed')
      }
      
      await audioContext.close()
      console.log('🔊 Audio permission requested')
    } catch (error) {
      console.log('Audio permission request failed:', error)
    }
  }

  const initializeMicrophone = async () => {
    try {
      setMicrophoneStatus('requesting')
      console.log('กำลังขอสิทธิ์เข้าถึงไมโครโฟน...')

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
      
      console.log('✅ ไมโครโฟนพร้อมใช้งาน!')
      
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
      
      console.log(errorMessage)
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
    console.log('🔊 ระบบเสียงพร้อมใช้งาน')
  }

  const initializeMockRoom = () => {
    // Mock data for testing when server is not available
    setConnectedUsers([
      { id: 'mock-1', userName: userName },
      { id: 'mock-2', userName: 'Demo User' }
    ])
    
    console.log('กำลังใช้งานในโหมด Demo (ไม่มี server)')
    console.log('เริ่ม WebSocket server เพื่อใช้งานจริง')
  }

  const setupSocketListeners = useCallback((connectionTimeout) => {
    const socket = socketRef.current

    socket.on('connect', () => {
      clearTimeout(connectionTimeout)
      setSocketConnected(true)
      setConnectionError(null)
      console.log('✅ Connected to WebSocket server')
      console.log('🟢 เชื่อมต่อ WebSocket server สำเร็จ!')
      
      // Only join room once per socket connection
      if (!socket.hasJoinedRoom) {
        console.log('📞 Joining room for the first time...')
        socket.emit('join-room', { roomId, userName })
        socket.hasJoinedRoom = true
      }
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
      console.log('❌ Disconnected from server')
      console.log('🔴 ขาดการเชื่อมต่อ server')
      
      // Reset join room flag on disconnect
      if (socket) {
        socket.hasJoinedRoom = false
      }
    })

    socket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout)
      console.log('Server not available, using Demo Mode')
      setConnectionError('เซิร์ฟเวอร์ไม่พร้อมใช้งาน - ใช้โหมด Demo')
      initializeMockRoom()
    })

    socket.on('user-list', (users) => {
      console.log('Received user list:', users);
      
      // Use a more aggressive deduplication approach
      const uniqueUsers = users.reduce((acc, user) => {
        // Only add user if ID doesn't already exist
        if (!acc.find(u => u.id === user.id)) {
          acc.push(user);
        }
        return acc;
      }, []);
      
      console.log('Setting unique users:', uniqueUsers);
      
      // Set users directly without async operations
      setConnectedUsers(uniqueUsers);
      console.log(`ยินดีต้อนรับสู่ Virtual Space! มีผู้ใช้ ${uniqueUsers.length} คน`);
      
      // Set WebRTC connecting state if there are other users
      const otherUsers = uniqueUsers.filter(user => user.id !== socket.id);
      if (otherUsers.length > 0 && streamRef.current) {
        setIsWebRTCConnecting(true);
      }
      
      // Create peer connections for existing users (excluding self)
      uniqueUsers.forEach(user => {
        if (user.id !== socket.id && streamRef.current && !peersRef.current.has(user.id)) {
          createPeerConnection(user.id, user.userName, true)
        }
      })
    })

    socket.on('user-joined', (user) => {
      console.log('User joined event received:', user);
      
      // Ignore if it's our own user
      if (user.id === socket.id) {
        console.log('Ignoring own user join event');
        return;
      }
      
      setConnectedUsers(prev => {
        // Check if user already exists by both ID and username
        const userExistsById = prev.find(u => u.id === user.id);
        const userExistsByName = prev.find(u => u.userName === user.userName);
        
        if (userExistsById || userExistsByName) {
          console.log('User already exists (by ID or name), ignoring join event');
          return prev;
        }
        
        const newUsers = [...prev, user];
        console.log('Updated user list:', newUsers.map(u => `${u.userName}(${u.id})`));
        
        return newUsers;
      });
      
      // Set WebRTC connecting state when new user joins
      if (streamRef.current) {
        setIsWebRTCConnecting(true);
      }
      
      // Create peer connection for new user (as receiver) only if not exists
      if (streamRef.current && !peersRef.current.has(user.id)) {
        createPeerConnection(user.id, user.userName, false)
      }
    })

    socket.on('user-left', (user) => {
      console.log('User left:', user);
      
      setConnectedUsers(prev => {
        const newUsers = prev.filter(u => u.id !== user.id);
        console.log(`${user.userName} ออกจากห้อง`);
        return newUsers;
      });
      
      // Clean up peer connection using the cleanup function
      cleanupPeerConnection(user.id);
    })

    // WebRTC signaling
    socket.on('webrtc-signal', async ({ userId, signal }) => {
      console.log(`📡 Received WebRTC signal from ${userId}:`, signal.type)
      
      const peerConnection = peersRef.current.get(userId)
      if (!peerConnection) {
        console.error(`❌ No peer connection found for user ${userId}`)
        return
      }

      try {
        console.log(`🔍 Current signaling state: ${peerConnection.signalingState}`)
        
        if (signal.type === 'offer') {
          console.log(`📨 Processing offer from ${userId}`)
          
          // Check if we can accept the offer
          if (peerConnection.signalingState !== 'stable' && peerConnection.signalingState !== 'have-local-offer') {
            console.warn(`⚠️ Ignoring offer in state: ${peerConnection.signalingState}`)
            return
          }
          
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          
          const answer = await peerConnection.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false
          })
          await peerConnection.setLocalDescription(answer)
          
          console.log(`📤 Sending answer to ${userId}`)
          socket.emit('webrtc-signal', {
            userId: userId,
            roomId: roomId,
            signal: {
              type: 'answer',
              sdp: answer
            }
          })
        } else if (signal.type === 'answer') {
          console.log(`📨 Processing answer from ${userId}`)
          
          // Check if we can accept the answer
          if (peerConnection.signalingState !== 'have-local-offer') {
            console.warn(`⚠️ Ignoring answer in state: ${peerConnection.signalingState}`)
            return
          }
          
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        } else if (signal.type === 'ice-candidate') {
          console.log(`🧊 Processing ICE candidate from ${userId}`)
          
          // Only add ICE candidates if we have remote description
          if (peerConnection.remoteDescription) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate))
          } else {
            console.log(`⏳ Queuing ICE candidate for ${userId} (no remote description yet)`)
          }
        }
      } catch (error) {
        console.error(`❌ WebRTC signaling error with ${userId}:`, error)
      }
    })
  }, [roomId, userName]) // Add dependencies

  const toggleMute = () => {
    setIsMuted(!isMuted)
    
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        console.log(`🎤 ไมโครโฟน${isMuted ? 'เปิด' : 'ปิด'}แล้ว`)
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

  const leaveRoom = () => {
    cleanup()
    onLeave()
  }

  const reloadWebRTCConnection = async () => {
    try {
      setIsReloading(true)
      console.log('🔄 Starting WebRTC reload - keeping socket connection...')
      
      // Reset WebRTC connection states only
      setIsWebRTCConnecting(false)
      setHasConnectedPeers(false)
      setPeersConnected(new Map())
      
      // Step 1: Clean up all peer connections only
      console.log('🧹 Cleaning up peer connections...')
      peersRef.current.forEach((peer, userId) => {
        peer.close()
      })
      peersRef.current.clear()
      
      // Step 2: Clean up remote audio elements
      console.log('🔊 Cleaning up remote audio elements...')
      remoteAudiosRef.current.forEach(audio => {
        if (audio.srcObject) {
          audio.srcObject.getTracks().forEach(track => track.stop())
        }
        audio.remove()
      })
      remoteAudiosRef.current.clear()
      
      // Step 3: Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 4: Recreate WebRTC connections with existing users
      if (socketRef.current && socketConnected && connectedUsers.length > 0) {
        console.log('🚀 Recreating WebRTC connections...')
        
        // Set connecting state if there are other users
        const otherUsers = connectedUsers.filter(user => user.id !== socketRef.current.id)
        if (otherUsers.length > 0 && streamRef.current) {
          setIsWebRTCConnecting(true)
        }
        
        // Recreate peer connections for existing users (excluding self)
        connectedUsers.forEach(user => {
          if (user.id !== socketRef.current.id && streamRef.current) {
            console.log(`🔄 Recreating connection with ${user.userName}`)
            createPeerConnection(user.id, user.userName, true)
          }
        })
      }
      
      console.log('✅ WebRTC reload completed successfully!')
      
    } catch (error) {
      console.error('❌ WebRTC reload failed:', error)
      setConnectionError('การรีโหลด WebRTC ล้มเหลว - ลองอีกครั้ง')
    } finally {
      setIsReloading(false)
    }
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

      {/* Main Virtual Space Area */}
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
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                      isMe ? 'bg-green-600' : 'bg-blue-600'
                    } ${!isMuted && streamRef.current ? 'ring-4 ring-green-400 animate-pulse' : ''}`}>
                      👤
                    </div>
                    
                    {/* Reload WebRTC Button - Only show for current user */}
                    {isMe && (
                      <button
                        onClick={reloadWebRTCConnection}
                        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                          isReloading
                            ? 'bg-orange-500 cursor-wait animate-spin'
                            : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
                        }`}
                        disabled={isReloading}
                        title="รีโหลดการเชื่อมต่อ WebRTC"
                      >
                        {isReloading ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                        ) : (
                          '🔄'
                        )}
                      </button>
                    )}
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
            <li>• พูดคุยด้วยเสียงแบบเรียลไทม์</li>
            <li>• เปิด 2 browser เพื่อทดสอบ</li>
            <li>• ใช้ไมโครโฟนเมื่อเชื่อมต่อ server แล้ว</li>
            <li>• กดปุ่มเปิด/ปิดไมค์เพื่อควบคุมเสียง</li>
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
  )
}

export default VirtualRoom