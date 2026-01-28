import Link from 'next/link'
import { getHerosJourney } from '@/lib/data'

export default function HerosJourney() {
  const stages = getHerosJourney()

  return (
    <div className="heros-journey">
      <h1 className="heros-journey-title">Hero&apos;s Journey</h1>

      {stages.map((stage, i) => {
        const fragment = stage.references.find(
          (r) => r.frontmatter.category === 'story-fragment'
        )
        const songs = stage.references.filter(
          (r) => r.frontmatter.category === 'song'
        )

        return (
          <Link
            key={stage.slug}
            href={`/heros-journey/${stage.slug}/`}
            className="stage-card stage-card-link"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="stage-number">Stage {i + 1}</div>
            <h2 className="stage-title">
              {stage.frontmatter.title as string}
            </h2>

            {fragment && fragment.page && (
              <p className="stage-fragment-preview">
                {fragment.page.slice(0, 120)}
                {fragment.page.length > 120 ? '...' : ''}
              </p>
            )}

            {songs.length > 0 ? (
              <div className="stage-songs">
                {songs.map((ref) => {
                  const hasAudio = ref.links.some((l) =>
                    l.url.startsWith('http')
                  )
                  return (
                    <span
                      key={ref.slug}
                      className={`song-tag${hasAudio ? ' has-audio' : ''}`}
                    >
                      {ref.label}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div className="stage-empty">No candidates yet</div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
