import { artifacts } from '../data/artifacts'
import { useProfile } from '../context/ProfileContext'
import type { Artifact } from '../types'

function hasStoredExpression(artifactId: string): boolean {
  return localStorage.getItem(`expressions:${artifactId}:content`) !== null
}

interface ArtifactSelectProps {
  onSelectArtifact: (artifact: Artifact) => void
  onEditProfile: () => void
}

export default function ArtifactSelect({
  onSelectArtifact,
  onEditProfile,
}: ArtifactSelectProps) {
  const { profile } = useProfile()

  return (
    <>
      <div className="header-row">
        <h1>Expressions</h1>
      </div>
      <p className="subtitle">
        Each artifact is a core idea of this project. Select one to explore it
        in a way shaped for you.
      </p>

      <div className="profile-summary">
        {profile.register && (
          <span className="profile-chip">{profile.register}</span>
        )}
        {profile.mode && <span className="profile-chip">{profile.mode}</span>}
        {profile.influences && (
          <span className="profile-chip">{profile.influences}</span>
        )}
        <span className="edit-profile-link" onClick={onEditProfile}>
          Edit
        </span>
      </div>

      <div className="artifacts">
        {artifacts.map((artifact) => (
          <div
            key={artifact.id}
            className="artifact"
            onClick={() => onSelectArtifact(artifact)}
          >
            <div className="artifact-title">{artifact.title}</div>
            <div className="artifact-desc">{artifact.desc}</div>
            {hasStoredExpression(artifact.id) && (
              <span className="artifact-badge">Expression saved</span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
