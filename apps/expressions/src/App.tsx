import { useState } from 'react'
import { ProfileProvider, useProfile } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import Onboarding from './pages/Onboarding'
import ArtifactSelect from './pages/ArtifactSelect'
import ArtifactDetail from './pages/ArtifactDetail'
import DevUsageOverlay from './components/DevUsageOverlay'
import type { Artifact } from './types'

type Screen = 'onboarding' | 'select' | 'detail'

function AppContent() {
  const { profile, isComplete } = useProfile()
  const [screen, setScreen] = useState<Screen>(isComplete ? 'select' : 'onboarding')
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)

  const handleProfileComplete = () => {
    setScreen('select')
  }

  const handleEditProfile = () => {
    setScreen('onboarding')
  }

  const handleSelectArtifact = (artifact: Artifact) => {
    setSelectedArtifact(artifact)
    setScreen('detail')
  }

  const handleBackToArtifacts = () => {
    setSelectedArtifact(null)
    setScreen('select')
  }

  return (
    <>
      <div className="container">
        {screen === 'onboarding' && (
          <Onboarding onComplete={handleProfileComplete} />
        )}
        {screen === 'select' && (
          <ArtifactSelect
            onSelectArtifact={handleSelectArtifact}
            onEditProfile={handleEditProfile}
          />
        )}
        {screen === 'detail' && selectedArtifact && (
          <ArtifactDetail
            artifact={selectedArtifact}
            profile={profile}
            onBack={handleBackToArtifacts}
          />
        )}
      </div>
      <DevUsageOverlay />
    </>
  )
}

function App() {
  return (
    <ProfileProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ProfileProvider>
  )
}

export default App
