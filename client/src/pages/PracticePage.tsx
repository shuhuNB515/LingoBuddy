import { useRef, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWebRTC } from '../hooks/useWebRTC'
import { useSessionStore } from '../store/sessionStore'
import ErrorTag from '../components/ErrorTag'
import './PracticePage.css'

export default function PracticePage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const { addSession } = useSessionStore()
  const { isConnected, startSession, stopSession, errors } = useWebRTC()
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<number>(0)

  const handleStart = useCallback(async () => {
    await startSession(scenarioId!)
    setIsRecording(true)
    timerRef.current = window.setInterval(() => setElapsed((t) => t + 1), 1000)
  }, [scenarioId, startSession])

  const handleStop = useCallback(() => {
    stopSession()
    setIsRecording(false)
    clearInterval(timerRef.current)
    const sessionId = `session-${Date.now()}`
    addSession({
      id: sessionId,
      scenarioId: scenarioId!,
      scenarioName: scenarioId!,
      cefrLevel: 'B1',
      date: new Date().toLocaleDateString(),
      duration: elapsed,
    })
    navigate(`/review/${sessionId}`)
  }, [stopSession, scenarioId, elapsed, addSession, navigate])

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
        <button className="back-btn" onClick={() => navigate('/')}>
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
            {transcript.length === 0 && (
              <div className="empty-state">
                <p>Click "Start" to begin your practice session</p>
              </div>
            )}
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
            <button className="btn-start" onClick={handleStart} disabled={!isConnected}>
              Start Practice
            </button>
          ) : (
            <button className="btn-stop" onClick={handleStop}>
              End Session
            </button>
          )}
          <div className="status-indicator">
            <span className={`dot ${isConnected ? 'connected' : ''}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>
    </div>
  )
}
