import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PracticePage from './pages/PracticePage'
import ReviewPage from './pages/ReviewPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice/:scenarioId" element={<PracticePage />} />
        <Route path="/review/:sessionId" element={<ReviewPage />} />
      </Routes>
    </div>
  )
}

export default App
