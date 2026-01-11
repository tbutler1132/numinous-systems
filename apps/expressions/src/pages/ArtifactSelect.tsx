import { artifacts } from '../data/artifacts'
import type { Artifact } from '../types'

interface ArtifactSelectProps {
  onSelectArtifact: (artifact: Artifact) => void
  onEditProfile: () => void
}

export default function ArtifactSelect({
  onSelectArtifact,
  onEditProfile,
}: ArtifactSelectProps) {
  return (
    <>
      <div className="header-row">
        <h1>Expressions</h1>
        <span className="edit-profile-link" onClick={onEditProfile}>
          Edit profile
        </span>
      </div>
      <p className="subtitle">
        Each artifact is a core idea of this project. Select one to explore it
        in a way shaped for you.
      </p>
      <div className="artifacts">
        {artifacts.map((artifact) => (
          <div
            key={artifact.id}
            className="artifact"
            onClick={() => onSelectArtifact(artifact)}
          >
            <div className="artifact-title">{artifact.title}</div>
            <div className="artifact-desc">{artifact.desc}</div>
          </div>
        ))}
      </div>
    </>
  )
}
