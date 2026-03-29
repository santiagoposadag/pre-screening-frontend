import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'training_data'
const PERSIST_FIELDS = [
  'email', 'program_id', 'program_name', 'invitation_id',
  'session_id', 'topics',
]

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(data) {
  if (!data) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  const filtered = {}
  for (const key of PERSIST_FIELDS) {
    if (data[key] !== undefined) filtered[key] = data[key]
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

const TrainingContext = createContext()

export function TrainingProvider({ children }) {
  const [trainingData, setTrainingDataState] = useState(loadFromStorage)

  const setTrainingData = useCallback((data) => {
    setTrainingDataState(data)
    saveToStorage(data)
  }, [])

  const resetTraining = useCallback(() => {
    setTrainingDataState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <TrainingContext.Provider value={{ trainingData, setTrainingData, resetTraining }}>
      {children}
    </TrainingContext.Provider>
  )
}

export const useTraining = () => useContext(TrainingContext)
