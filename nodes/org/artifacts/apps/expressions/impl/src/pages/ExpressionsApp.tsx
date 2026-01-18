import { useState } from 'react'
import { useProfile } from '../context/ProfileContext'
import Onboarding from './Onboarding'
import ArtifactSelect from './ArtifactSelect'
import ArtifactDetail from './ArtifactDetail'
import type { Artifact } from '../types'

type Screen = 'onboarding' | 'select' | 'detail'

export default function ExpressionsApp() {
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
  )
}
