import { useRef, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChat } from '../hooks/useChat'
import { useSessionStore } from '../store/sessionStore'
import ErrorTag from '../components/ErrorTag'
import './PracticePage.css'

export default function PracticePage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const { addSession } = useSessionStore()
  const { isConnected, errors, transcript, streamingText, connect, sendMessage, disconnect } = useChat()
  const [isRecording, setIsRecording] = useState(false)
  const [inputText, setInputText] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<number>(0)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const handleStart = useCallback(async () => {
    connect(scenarioId!)
    setIsRecording(true)
    timerRef.current = window.setInterval(() => setElapsed((t) => t + 1), 1000)
  }, [scenarioId, connect])

  const handleStop = useCallback(() => {
    disconnect()
    setIsRecording(false)
    clearInterval(timerRef.current)
    const sessionId = `session-${Date.now()}`
    addSession({
      id: sessionId,
      scenarioId: scenarioId!,
      scenarioName: scenarioId!.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cefrLevel: 'B1',
      date: new Date().toLocaleDateString(),
      duration: elapsed,
    })
    navigate(`/review/${sessionId}`)
  }, [disconnect, scenarioId, elapsed, addSession, navigate])

  const handleSend = useCallback(() => {
    const text = inputText.trim()
    if (!text) return
    sendMessage(text)
    setInputText('')
  }, [inputText, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, streamingText])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="practice-page">
      <header className="practice-header">
        <button className="back-btn" onClick={() => { disconnect(); navigate('/') }}>
          ← Back
        </button>
        <h2>{scenarioId?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</h2>
        <div className="timer">{formatTime(elapsed)}</div>
      </header>

      <div className="practice-main">
        <div className="conversation-area">
          <div className="transcript">
            {transcript.map((msg, i) => (
              <div key={i} className={`message ${msg.speaker}`}>
                <span className="speaker">{msg.speaker === 'ai' ? 'AI' : 'You'}</span>
                <p>{msg.text}</p>
              </div>
            ))}
            {streamingText && (
              <div className="message ai">
                <span className="speaker">AI</span>
                <p>{streamingText}<span className="cursor">|</span></p>
              </div>
            )}
            {transcript.length === 0 && !streamingText && (
              <div className="empty-state">
                <p>Click "Start" to begin your practice session</p>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          <div className="error-panel">
            <h3>Corrections</h3>
            {errors.length === 0 ? (
              <p className="no-errors">No issues detected yet — keep going!</p>
            ) : (
              errors.map((err, i) => <ErrorTag key={i} {...err} />)
            )}
          </div>
        </div>

        <div className="controls">
          {!isRecording ? (
            <button className="btn-start" onClick={handleStart}>
              Start Practice
            </button>
          ) : (
            <>
              <div className="input-area">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type your response in English..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isConnected}
                />
                <button className="btn-send" onClick={handleSend} disabled={!isConnected || !inputText.trim()}>
                  Send
                </button>
              </div>
              <button className="btn-stop" onClick={handleStop}>
                End Session
              </button>
            </>
          )}
          <div className="status-indicator">
            <span className={`dot ${isConnected ? 'connected' : ''}`} />
            {isConnected ? 'Connected' : 'Not connected'}
          </div>
        </div>
      </div>
    </div>
  )
}
