import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { useSessionStore } from '../store/sessionStore'
import './ReviewPage.css'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface ReviewData {
  pronunciation: number
  vocabulary: number
  grammar: number
  fluency: number
  cefrLevel: string
  polishedSentences: { original: string; polished: string }[]
}

const DEFAULT_REVIEW: ReviewData = {
  pronunciation: 0,
  vocabulary: 0,
  grammar: 0,
  fluency: 0,
  cefrLevel: '--',
  polishedSentences: [],
}

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { currentSession } = useSessionStore()
  const [data, setData] = useState<ReviewData>(DEFAULT_REVIEW)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReview() {
      if (!currentSession || currentSession.transcript.length === 0) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`http://${window.location.hostname}:8000/api/review/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: currentSession.transcript,
            errors: currentSession.errors,
          }),
        })
        const result = await res.json()
        setData(result)
      } catch (e) {
        console.error('Failed to fetch review:', e)
        // Fallback: compute basic scores from errors
        const errorCount = currentSession.errors.length
        const userMsgs = currentSession.transcript.filter(m => m.speaker === 'user')
        const baseGrammar = Math.max(40, 90 - errorCount * 10)
        const baseVocab = Math.min(85, 50 + userMsgs.length * 5)
        const baseFluency = Math.min(80, 45 + userMsgs.length * 4)
        setData({
          pronunciation: 65,
          vocabulary: baseVocab,
          grammar: baseGrammar,
          fluency: baseFluency,
          cefrLevel: 'B1',
          polishedSentences: currentSession.errors.map(e => ({
            original: e.original,
            polished: e.suggestion,
          })),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReview()
  }, [sessionId, currentSession])

  const radarData = {
    labels: ['发音', '词汇', '语法', '流利度'],
    datasets: [
      {
        label: '你的得分',
        data: [data.pronunciation, data.vocabulary, data.grammar, data.fluency],
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        borderColor: 'rgba(108, 92, 231, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(108, 92, 231, 1)',
      },
    ],
  }

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, color: '#a0a0c0', backdropColor: 'transparent' },
        grid: { color: '#2d2d5e' },
        pointLabels: { color: '#ffffff', font: { size: 14 } },
      },
    },
    plugins: {
      legend: { display: false },
    },
  }

  if (loading) {
    return (
      <div className="review-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p style={{ color: '#a0a0c0', fontSize: '1.2rem' }}>正在生成复盘报告...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="review-page">
      <header className="review-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 首页
        </button>
        <h2>练习复盘</h2>
        <div className="cefr-badge">CEFR: {data.cefrLevel}</div>
      </header>

      <div className="review-content">
        <div className="radar-section">
          <h3>能力雷达图</h3>
          <div className="radar-chart">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        <div className="scores-section">
          <h3>分数明细</h3>
          <div className="score-list">
            {[
              { label: '发音', value: data.pronunciation, color: '#6c5ce7' },
              { label: '词汇', value: data.vocabulary, color: '#00cec9' },
              { label: '语法', value: data.grammar, color: '#fdcb6e' },
              { label: '流利度', value: data.fluency, color: '#ff6b6b' },
            ].map((item) => (
              <div key={item.label} className="score-item">
                <span className="score-label">{item.label}</span>
                <div className="score-bar-bg">
                  <div
                    className="score-bar-fill"
                    style={{ width: `${item.value}%`, background: item.color }}
                  />
                </div>
                <span className="score-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="polished-section">
          <h3>地道润色建议</h3>
          <div className="polished-list">
            {data.polishedSentences.length === 0 ? (
              <p style={{ color: '#a0a0c0', textAlign: 'center', padding: '20px' }}>暂无润色建议</p>
            ) : (
              data.polishedSentences.map((item, i) => (
                <div key={i} className="polished-item">
                  <div className="original">
                    <span className="tag wrong">原句</span>
                    <p>{item.original}</p>
                  </div>
                  <div className="polished">
                    <span className="tag better">润色</span>
                    <p>{item.polished}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="review-actions">
        <button className="btn-practice-again" onClick={() => navigate('/')}>
          再练一次
        </button>
      </div>
    </div>
  )
}
