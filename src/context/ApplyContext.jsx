import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'apply_data'
const PERSIST_FIELDS = ['full_name', 'email', 'vacancy_id', 'vacancy_name']

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

const ApplyContext = createContext()

export function ApplyProvider({ children }) {
  const [applicationData, setApplicationDataState] = useState(loadFromStorage)

  const setApplicationData = useCallback((data) => {
    setApplicationDataState(data)
    saveToStorage(data)
  }, [])

  const resetApplication = useCallback(() => {
    setApplicationDataState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <ApplyContext.Provider value={{ applicationData, setApplicationData, resetApplication }}>
      {children}
    </ApplyContext.Provider>
  )
}

export const useApply = () => useContext(ApplyContext)
