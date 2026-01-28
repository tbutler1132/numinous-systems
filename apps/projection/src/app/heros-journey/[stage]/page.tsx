import { readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'

interface ParsedLink {
  label: string
  url: string
}

interface Reference {
  label: string
  slug: string
  frontmatter: Record<string, unknown>
  page: string
  links: ParsedLink[]
}

interface Artifact {
  slug: string
  frontmatter: Record<string, unknown>
  content: string
  references: Reference[]
}

function getData(): Artifact[] {
  const raw = readFileSync(join(process.cwd(), 'public/data/heros-journey.json'), 'utf-8')
  return JSON.parse(raw)
}

export function generateStaticParams() {
  return getData().map((stage) => ({ stage: stage.slug }))
}

export default function StagePage({ params }: { params: { stage: string } }) {
  const stages = getData()
  const stageIndex = stages.findIndex((s) => s.slug === params.stage)
  const stage = stages[stageIndex]
  if (!stage) return null

  const fragment = stage.references.find(
    (r) => r.frontmatter.category === 'story-fragment'
  )
  const songs = stage.references.filter(
    (r) => r.frontmatter.category === 'song'
  )

  return (
    <div className="heros-journey">
      <Link href="/heros-journey/" className="stage-back">
        &larr; All Stages
      </Link>

      <div className="stage-detail" style={{ animationDelay: '0s' }}>
        <div className="stage-number">Stage {stageIndex + 1}</div>
        <h1 className="stage-detail-title">
          {stage.frontmatter.title as string}
        </h1>

        {fragment && fragment.page && (
          <div className="stage-fragment">
            <h2 className="stage-fragment-title">{fragment.label}</h2>
            {fragment.page.split('\n\n').map((p, i) => (
              <p key={i} className="stage-fragment-text">
                {p}
              </p>
            ))}
          </div>
        )}

        {songs.length > 0 && (
          <div className="stage-detail-songs">
            <h2 className="stage-songs-title">Candidates</h2>
            {songs.map((song) => {
              const audioLink = song.links.find((l) =>
                l.url.startsWith('http')
              )
              return (
                <div key={song.slug} className="stage-song-card">
                  <span className="stage-song-name">{song.label}</span>
                  {audioLink && (
                    <audio
                      className="stage-audio"
                      controls
                      preload="none"
                      src={audioLink.url}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
