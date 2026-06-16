import { create } from 'zustand'

export interface Session {
  id: string
  scenarioId: string
  scenarioName: string
  cefrLevel: string
  date: string
  duration: number
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
