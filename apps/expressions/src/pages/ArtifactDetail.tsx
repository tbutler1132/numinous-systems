import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { GITHUB_RAW_BASE } from '../data/artifacts'
import { useTheme } from '../context/ThemeContext'
import { emitUsage } from '../components/DevUsageOverlay'
import ContentBox from '../components/ContentBox'
import Spinner from '../components/Spinner'
import type { Artifact, Profile, TabType, GenerateResponse } from '../types'

interface ArtifactDetailProps {
  artifact: Artifact
  profile: Profile
  onBack: () => void
}

function getGenerationCount(artifactId: string): number {
  return parseInt(localStorage.getItem(`expressions:${artifactId}`) || '0')
}

function incrementGenerationCount(artifactId: string): number {
  const count = getGenerationCount(artifactId) + 1
  localStorage.setItem(`expressions:${artifactId}`, count.toString())
  return count
}

function getStoredExpression(artifactId: string): string | null {
  return localStorage.getItem(`expressions:${artifactId}:content`)
}

function storeExpression(artifactId: string, expression: string): void {
  localStorage.setItem(`expressions:${artifactId}:content`, expression)
}

export default function ArtifactDetail({
  artifact,
  profile,
  onBack,
}: ArtifactDetailProps) {
  const { setTheme, clearTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [about, setAbout] = useState('')
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('machinic')
  const [expression, setExpression] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)

  // Fetch artifact content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [aboutRes, notesRes] = await Promise.all([
          fetch(`${GITHUB_RAW_BASE}/${artifact.id}/about.md`),
          fetch(`${GITHUB_RAW_BASE}/${artifact.id}/notes.md`),
        ])

        if (!aboutRes.ok || !notesRes.ok) {
          throw new Error('Failed to fetch artifact content')
        }

        setAbout(await aboutRes.text())
        setNotes(await notesRes.text())

        // Check for stored expression
        const storedExpr = getStoredExpression(artifact.id)
        if (storedExpr) {
          setExpression(storedExpr)
          setHasGenerated(true)
          setTheme('machinic')
        }

        setGenerationCount(getGenerationCount(artifact.id))
        setLoading(false)
      } catch (err) {
        console.error(err)
        alert('Failed to load artifact. Please try again.')
        onBack()
      }
    }

    fetchContent()

    // Cleanup theme on unmount
    return () => clearTheme()
  }, [artifact.id, onBack, setTheme, clearTheme])

  // Handle tab switching
  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'organic') {
      setTheme('organic')
    } else if (hasGenerated) {
      setTheme('machinic')
    } else {
      clearTheme()
    }
  }

  // Handle generation
  const handleGenerate = async () => {
    if (generationCount >= 2) {
      alert(
        "You've reached the maximum of 2 generations for this artifact. Sit with what you have."
      )
      return
    }

    setGenerating(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact: artifact.id, profile }),
      })

      if (!res.ok) throw new Error('Generation failed')

      const data: GenerateResponse = await res.json()
      setExpression(data.expression)
      setHasGenerated(true)
      setIsRevealing(true)

      // Update usage overlay if usage data is present
      if (data.usage) {
        emitUsage(data.usage)
      }

      const newCount = incrementGenerationCount(artifact.id)
      setGenerationCount(newCount)

      // Store expression
      storeExpression(artifact.id, data.expression)

      // Apply machinic theme
      setTheme('machinic')

      // Reset revealing after animation
      setTimeout(() => setIsRevealing(false), 1000)
    } catch (err) {
      console.error(err)
      alert('Failed to generate expression. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Handle download
  const handleDownload = () => {
    if (!expression) return
    const filename = `${artifact.id}-expression.md`
    const blob = new Blob([expression], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle back navigation
  const handleBack = () => {
    clearTheme()
    onBack()
  }

  if (loading) {
    return <Spinner message="Loading artifact..." />
  }

  const remaining = 2 - generationCount
  const canRegenerate = remaining > 0

  return (
    <>
      <span className="back" onClick={handleBack}>
        ← Back to artifacts
      </span>
      <h1>{artifact.title}</h1>

      <div className="about-section">
        <ReactMarkdown>{about}</ReactMarkdown>
      </div>

      <p className="context-text">
        Toggle between the machinic—an AI-generated expression shaped for your
        sensibility—and the organic raw notes. The core truth remains; only the
        vessel changes.
      </p>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'machinic' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('machinic')}
        >
          Machinic
        </button>
        <button
          className={`tab ${activeTab === 'organic' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('organic')}
        >
          Organic
        </button>
      </div>

      {activeTab === 'machinic' && (
        <>
          {!hasGenerated && !generating && (
            <div className="generate-prompt">
              <p>Generate a machinic expression tailored to your sensibility.</p>
              <button
                className="btn"
                onClick={handleGenerate}
                disabled={generationCount >= 2}
              >
                {generationCount >= 2
                  ? 'Maximum generations reached'
                  : 'Generate Machinic Expression'}
              </button>
            </div>
          )}

          {generating && (
            <Spinner small inline message="Synthesizing your expression..." />
          )}

          {hasGenerated && expression && !generating && (
            <>
              <span className="mode-label">Machinic synthesis</span>
              <ContentBox revealing={isRevealing}>
                <ReactMarkdown>{expression}</ReactMarkdown>
              </ContentBox>
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={handleDownload}>
                  Download as Markdown
                </button>
                <button
                  className="btn"
                  onClick={handleGenerate}
                  disabled={!canRegenerate}
                >
                  Regenerate
                </button>
              </div>
              <p className="limit-notice">
                {canRegenerate
                  ? `${remaining} regeneration${remaining > 1 ? 's' : ''} remaining for this artifact.`
                  : 'No regenerations remaining. Sit with this expression.'}
              </p>
            </>
          )}
        </>
      )}

      {activeTab === 'organic' && (
        <>
          <span className="mode-label">Raw working notes</span>
          <ContentBox>
            <ReactMarkdown>{notes}</ReactMarkdown>
          </ContentBox>
        </>
      )}
    </>
  )
}
