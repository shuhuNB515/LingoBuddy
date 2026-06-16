import { useState, useRef, useCallback, useEffect } from 'react'

interface SpeechError {
  type: 'grammar' | 'vocabulary' | 'pronunciation'
  original: string
  suggestion: string
}

interface TranscriptMessage {
  speaker: 'ai' | 'user'
  text: string
  translation?: string
}

const WS_BASE = `ws://${window.location.hostname}:8000/ws/chat`

export function useChat() {
  const [isConnected, setIsConnected] = useState(false)
  const [errors, setErrors] = useState<SpeechError[]>([])
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const ws = useRef<WebSocket | null>(null)

  const connect = useCallback((scenarioId: string) => {
    const socket = new WebSocket(WS_BASE)
    ws.current = socket

    socket.onopen = () => {
      setIsConnected(true)
      // Initialize the session with scenario
      socket.send(JSON.stringify({
        type: 'init',
        scenarioId,
      }))
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'transcript':
          setTranscript((prev) => [...prev, { speaker: data.speaker, text: data.text, translation: data.translation || '' }])
          setStreamingText('')
          break
        case 'token':
          setStreamingText((prev) => prev + data.text)
          break
        case 'error-correction':
          setErrors((prev) => [...prev, data.error])
          break
        case 'error':
          console.error('Server error:', data.message)
          break
      }
    }

    socket.onclose = () => {
      setIsConnected(false)
      ws.current = null
    }

    socket.onerror = () => {
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        text,
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  return {
    isConnected,
    errors,
    transcript,
    streamingText,
    connect,
    sendMessage,
    disconnect,
  }
}
