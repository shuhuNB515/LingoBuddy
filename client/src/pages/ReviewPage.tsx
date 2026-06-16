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

const MOCK_REVIEW: ReviewData = {
  pronunciation: 72,
  vocabulary: 65,
  grammar: 78,
  fluency: 60,
  cefrLevel: 'B1',
  polishedSentences: [
    { original: 'I want go to restaurant', polished: "I'd like to go to a restaurant" },
    { original: 'The food is very deliciously', polished: 'The food was absolutely delicious' },
    { original: 'Can I have check please', polished: 'Could I have the check, please?' },
  ],
}

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const data = MOCK_REVIEW

  const radarData = {
    labels: ['Pronunciation', 'Vocabulary', 'Grammar', 'Fluency'],
    datasets: [
      {
        label: 'Your Score',
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

  return (
    <div className="review-page">
      <header className="review-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Home
        </button>
        <h2>Session Review</h2>
        <div className="cefr-badge">CEFR: {data.cefrLevel}</div>
      </header>

      <div className="review-content">
        <div className="radar-section">
          <h3>Ability Radar</h3>
          <div className="radar-chart">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        <div className="scores-section">
          <h3>Score Breakdown</h3>
          <div className="score-list">
            {[
              { label: 'Pronunciation', value: data.pronunciation, color: '#6c5ce7' },
              { label: 'Vocabulary', value: data.vocabulary, color: '#00cec9' },
              { label: 'Grammar', value: data.grammar, color: '#fdcb6e' },
              { label: 'Fluency', value: data.fluency, color: '#ff6b6b' },
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
          <h3>Polished Version</h3>
          <div className="polished-list">
            {data.polishedSentences.map((item, i) => (
              <div key={i} className="polished-item">
                <div className="original">
                  <span className="tag wrong">Original</span>
                  <p>{item.original}</p>
                </div>
                <div className="polished">
                  <span className="tag better">Polished</span>
                  <p>{item.polished}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="review-actions">
        <button className="btn-practice-again" onClick={() => navigate('/')}>
          Practice Again
        </button>
      </div>
    </div>
  )
}
