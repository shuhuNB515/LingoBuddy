import { useState, useRef, useCallback, useEffect } from 'react'

interface SpeechError {
  type: 'grammar' | 'vocabulary' | 'pronunciation'
  original: string
  suggestion: string
}

const SIGNALING_URL = `ws://${window.location.hostname}:8080/ws`

export function useWebRTC() {
  const [isConnected, setIsConnected] = useState(false)
  const [errors, setErrors] = useState<SpeechError[]>([])
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const ws = useRef<WebSocket | null>(null)

  const startSession = useCallback(async (scenarioId: string) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      localStream.current = stream

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      peerConnection.current = pc

      // Add local audio track
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Handle remote audio
      pc.ontrack = (event) => {
        const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement
        if (remoteAudio && event.streams[0]) {
          remoteAudio.srcObject = event.streams[0]
          remoteAudio.play()
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
            })
          )
        }
      }

      // Connect to signaling server
      const socket = new WebSocket(SIGNALING_URL)
      ws.current = socket

      socket.onopen = async () => {
        setIsConnected(true)

        // Create and send offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.send(
          JSON.stringify({
            type: 'offer',
            scenarioId,
            sdp: pc.localDescription,
          })
        )
      }

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'answer':
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
            break
          case 'ice-candidate':
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
            break
          case 'error-correction':
            setErrors((prev) => [...prev, data.error])
            break
        }
      }

      socket.onclose = () => {
        setIsConnected(false)
      }
    } catch (err) {
      console.error('Failed to start WebRTC session:', err)
      setIsConnected(false)
    }
  }, [])

  const stopSession = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop())
      localStream.current = null
    }
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    return () => {
      stopSession()
    }
  }, [stopSession])

  return {
    isConnected,
    errors,
    startSession,
    stopSession,
  }
}
