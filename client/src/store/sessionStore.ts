import { create } from 'zustand'

export interface TranscriptMessage {
  speaker: 'ai' | 'user'
  text: string
  translation?: string
}

export interface SpeechError {
  type: 'grammar' | 'vocabulary' | 'pronunciation'
  original: string
  suggestion: string
}

export interface Session {
  id: string
  scenarioId: string
  scenarioName: string
  cefrLevel: string
  date: string
  duration: number
  transcript: TranscriptMessage[]
  errors: SpeechError[]
}

interface SessionState {
  history: Session[]
  currentSession: Session | null
  addSession: (session: Session) => void
  setCurrentSession: (session: Session | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  history: [],
  currentSession: null,
  addSession: (session) =>
    set((state) => ({
      history: [...state.history, session],
      currentSession: session,
    })),
  setCurrentSession: (session) => set({ currentSession: session }),
}))
