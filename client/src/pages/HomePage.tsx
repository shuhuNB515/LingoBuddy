import { useNavigate } from 'react-router-dom'
import ScenarioCard from '../components/ScenarioCard'
import { useSessionStore } from '../store/sessionStore'
import './HomePage.css'

const SCENARIOS = [
  { id: 'interview', title: 'Job Interview', subtitle: '外企面试', icon: '💼', difficulty: 'B2' },
  { id: 'meeting', title: 'Business Meeting', subtitle: '商务会议', icon: '📊', difficulty: 'B2' },
  { id: 'restaurant', title: 'Restaurant Ordering', subtitle: '海外点餐', icon: '🍽️', difficulty: 'A2' },
  { id: 'customs', title: 'Customs & Immigration', subtitle: '海关通关', icon: '✈️', difficulty: 'B1' },
  { id: 'shopping', title: 'Shopping & Bargaining', subtitle: '购物砍价', icon: '🛍️', difficulty: 'A2' },
  { id: 'doctor', title: "Doctor's Visit", subtitle: '就医问诊', icon: '🏥', difficulty: 'B1' },
  { id: 'hotel', title: 'Hotel Check-in', subtitle: '酒店入住', icon: '🏨', difficulty: 'A2' },
  { id: 'networking', title: 'Social Networking', subtitle: '社交拓展', icon: '🤝', difficulty: 'B2' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { history } = useSessionStore()

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="logo">LingoBuddy</h1>
        <p className="tagline">灵语伴聊 — 你的首个零压力英语口语搭子</p>
      </header>

      <section className="scenarios-section">
        <h2>Choose a Scenario</h2>
        <div className="scenarios-grid">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              {...scenario}
              onSelect={() => navigate(`/practice/${scenario.id}`)}
            />
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="history-section">
          <h2>Recent Sessions</h2>
          <div className="history-list">
            {history.slice(-5).reverse().map((session) => (
              <div
                key={session.id}
                className="history-item"
                onClick={() => navigate(`/review/${session.id}`)}
              >
                <span className="history-scenario">{session.scenarioName}</span>
                <span className="history-score">CEFR: {session.cefrLevel}</span>
                <span className="history-date">{session.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
