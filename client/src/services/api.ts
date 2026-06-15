const API_BASE = '/api'

export interface ReviewResponse {
  pronunciation: number
  vocabulary: number
  grammar: number
  fluency: number
  cefrLevel: string
  polishedSentences: { original: string; polished: string }[]
}

export async function fetchReview(sessionId: string): Promise<ReviewResponse> {
  const res = await fetch(`${API_BASE}/review/${sessionId}`)
  if (!res.ok) throw new Error('Failed to fetch review')
  return res.json()
}

export async function fetchScenarios(): Promise<{ id: string; title: string; subtitle: string; difficulty: string }[]> {
  const res = await fetch(`${API_BASE}/scenarios`)
  if (!res.ok) throw new Error('Failed to fetch scenarios')
  return res.json()
}
