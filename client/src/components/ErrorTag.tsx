import './ErrorTag.css'

interface ErrorTagProps {
  type: 'grammar' | 'vocabulary' | 'pronunciation'
  original: string
  suggestion: string
}

const TYPE_COLORS = {
  grammar: '#fbbf24',
  vocabulary: '#a78bfa',
  pronunciation: '#f87171',
}

export default function ErrorTag({ type, original, suggestion }: ErrorTagProps) {
  return (
    <div className="error-tag" style={{ borderLeftColor: TYPE_COLORS[type] }}>
      <span className="error-type" style={{ color: TYPE_COLORS[type] }}>
        {type}
      </span>
      <span className="error-original">{original}</span>
      <span className="error-arrow">→</span>
      <span className="error-suggestion">{suggestion}</span>
    </div>
  )
}
