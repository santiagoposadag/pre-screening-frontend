import { createContext, useContext, useState } from 'react'

const ApplyContext = createContext()

export function ApplyProvider({ children }) {
  const [applicationData, setApplicationData] = useState(null)

  return (
    <ApplyContext.Provider value={{ applicationData, setApplicationData }}>
      {children}
    </ApplyContext.Provider>
  )
}

export const useApply = () => useContext(ApplyContext)
