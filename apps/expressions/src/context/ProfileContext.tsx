import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Profile } from '../types'

const STORAGE_KEY = 'expressions:profile'

const defaultProfile: Profile = {
  register: null,
  sacred: null,
  mode: null,
  influences: null,
}

interface ProfileContextType {
  profile: Profile
  setProfile: (profile: Profile) => void
  updateProfile: <K extends keyof Profile>(key: K, value: Profile[K]) => void
  isComplete: boolean
  saveProfile: () => void
  resetProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return defaultProfile
      }
    }
    return defaultProfile
  })

  const isComplete = Object.values(profile).every((v) => v !== null)

  const setProfile = (newProfile: Profile) => {
    setProfileState(newProfile)
  }

  const updateProfile = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfileState((prev) => ({ ...prev, [key]: value }))
  }

  const saveProfile = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }

  const resetProfile = () => {
    setProfileState(defaultProfile)
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        isComplete,
        saveProfile,
        resetProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
