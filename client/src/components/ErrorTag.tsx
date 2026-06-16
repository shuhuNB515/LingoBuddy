interface ErrorTagProps {
  type: 'grammar' | 'vocabulary' | 'pronunciation'
  original: string
  suggestion: string
}

const TYPE_COLORS = {
  grammar: '#fdcb6e',
  vocabulary: '#6c5ce7',
  pronunciation: '#ff6b6b',
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
