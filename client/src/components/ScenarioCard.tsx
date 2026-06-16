interface ScenarioCardProps {
  id: string
  title: string
  subtitle: string
  icon: string
  difficulty: string
  onSelect: () => void
}

export default function ScenarioCard({ title, subtitle, icon, difficulty, onSelect }: ScenarioCardProps) {
  return (
    <div className="scenario-card" onClick={onSelect}>
      <div className="scenario-icon">{icon}</div>
      <div className="scenario-info">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <span className="difficulty-badge">{difficulty}</span>
    </div>
  )
}
