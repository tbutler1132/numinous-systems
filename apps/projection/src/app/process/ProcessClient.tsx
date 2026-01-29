/**
 * @file ProcessClient - Tabbed viewer for org process documents.
 *
 * Displays markdown files from nodes/org/process/ in a tabbed interface.
 * Uses react-markdown for full markdown rendering.
 *
 * Can receive tabs as props (server-side) or fetch them (client-side in Prism).
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Tab definition with id, label, and content */
export interface ProcessTab {
  id: string
  label: string
  content: string
}

interface Props {
  /** Pre-loaded tabs (optional - will fetch if not provided) */
  tabs?: ProcessTab[]
}

/**
 * Strips YAML frontmatter from markdown content.
 */
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n?/)
  return match ? content.slice(match[0].length) : content
}

export default function ProcessClient({ tabs: initialTabs }: Props) {
  const [tabs, setTabs] = useState<ProcessTab[]>(initialTabs ?? [])
  const [activeTab, setActiveTab] = useState(initialTabs?.[0]?.id ?? 'about')
  const [loading, setLoading] = useState(!initialTabs)
  const router = useRouter()

  // Fetch tabs if not provided as props
  useEffect(() => {
    if (initialTabs) return

    fetch('/api/process/')
      .then((res) => res.json())
      .then((data) => {
        setTabs(data.tabs)
        if (data.tabs.length > 0) {
          setActiveTab(data.tabs[0].id)
        }
      })
      .catch(() => {
        // Handle error silently
      })
      .finally(() => setLoading(false))
  }, [initialTabs])

  const handleLogout = async () => {
    await fetch('/api/auth/logout/', { method: 'POST' })
    router.push('/process/login/')
  }

  if (loading) {
    return (
      <div className="process">
        <div className="process-container">
          <div className="process-loading">Loading...</div>
        </div>
      </div>
    )
  }

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]

  return (
    <div className="process">
      <div className="process-container">
        <header className="process-header">
          <h1 className="process-title">Process</h1>
          <button className="process-logout" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="process-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`process-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="process-content">
          {currentTab && (
            <div className="process-markdown">
              <Markdown remarkPlugins={[remarkGfm]}>
                {stripFrontmatter(currentTab.content)}
              </Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
