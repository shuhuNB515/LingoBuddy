import { useNavigate } from 'react-router-dom'
import ScenarioCard from '../components/ScenarioCard'
import { useSessionStore } from '../store/sessionStore'
import './HomePage.css'

const ICON_COLOR = 'currentColor'

const SCENARIOS = [
  {
    id: 'interview',
    title: 'Job Interview',
    subtitle: '外企面试',
    difficulty: 'B2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M9 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'meeting',
    title: 'Business Meeting',
    subtitle: '商务会议',
    difficulty: 'B2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'restaurant',
    title: 'Restaurant Ordering',
    subtitle: '海外点餐',
    difficulty: 'A2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
      </svg>
    ),
  },
  {
    id: 'customs',
    title: 'Customs & Immigration',
    subtitle: '海关通关',
    difficulty: 'B1',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    id: 'shopping',
    title: 'Shopping & Bargaining',
    subtitle: '购物砍价',
    difficulty: 'A2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: 'doctor',
    title: "Doctor's Visit",
    subtitle: '就医问诊',
    difficulty: 'B1',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    id: 'hotel',
    title: 'Hotel Check-in',
    subtitle: '酒店入住',
    difficulty: 'A2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9h1" />
        <path d="M9 13h1" />
        <path d="M9 17h1" />
      </svg>
    ),
  },
  {
    id: 'networking',
    title: 'Social Networking',
    subtitle: '社交拓展',
    difficulty: 'B2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20a6 6 0 0 0-12 0" />
        <circle cx="12" cy="10" r="4" />
        <circle cx="4.5" cy="9" r="2" />
        <path d="M2 18a4 4 0 0 1 4-4" />
        <circle cx="19.5" cy="9" r="2" />
        <path d="M22 18a4 4 0 0 0-4-4" />
      </svg>
    ),
  },
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
