'use client'

import { useAudio } from '@/contexts/AudioContext'
import Link from 'next/link'

/** Format seconds as m:ss */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AudioPlayerClient() {
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    toggle,
    next,
    previous,
    seek,
    removeFromQueue,
    clearQueue,
    playTrackAt,
  } = useAudio()

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(percent * duration)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="audio-player">
      {/* Now Playing */}
      <div className="audio-player-now">
        <div className="audio-player-label">Now Playing</div>
        {currentTrack ? (
          <div className="audio-player-track">
            <div className="audio-player-title">{currentTrack.title}</div>
            {currentTrack.context?.label && (
              <div className="audio-player-context">
                {currentTrack.context.path ? (
                  <Link href={currentTrack.context.path}>
                    {currentTrack.context.label}
                  </Link>
                ) : (
                  currentTrack.context.label
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="audio-player-empty">No track selected</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="audio-player-progress-container">
        <div
          className="audio-player-progress"
          onClick={handleProgressClick}
          role="slider"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
          tabIndex={0}
        >
          <div
            className="audio-player-progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div
            className="audio-player-progress-handle"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="audio-player-times">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="audio-player-controls">
        <button
          className="audio-player-btn"
          onClick={previous}
          disabled={currentIndex === null || currentIndex === 0}
          aria-label="Previous"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button
          className="audio-player-btn audio-player-btn-main"
          onClick={toggle}
          disabled={!currentTrack}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          className="audio-player-btn"
          onClick={next}
          disabled={currentIndex === null || currentIndex >= queue.length - 1}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Queue */}
      <div className="audio-player-queue">
        <div className="audio-player-queue-header">
          <span className="audio-player-label">
            Queue {queue.length > 0 && `(${queue.length})`}
          </span>
          {queue.length > 0 && (
            <button
              className="audio-player-clear"
              onClick={clearQueue}
            >
              Clear
            </button>
          )}
        </div>
        {queue.length === 0 ? (
          <div className="audio-player-queue-empty">
            Queue is empty. Add tracks from content pages.
          </div>
        ) : (
          <ul className="audio-player-queue-list">
            {queue.map((track, index) => (
              <li
                key={track.id}
                className={`audio-player-queue-item${index === currentIndex ? ' is-current' : ''}`}
              >
                <button
                  className="audio-player-queue-play"
                  onClick={() => playTrackAt(index)}
                >
                  <span className="audio-player-queue-index">
                    {index === currentIndex && isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </span>
                  <span className="audio-player-queue-title">{track.title}</span>
                </button>
                <button
                  className="audio-player-queue-remove"
                  onClick={() => removeFromQueue(index)}
                  aria-label={`Remove ${track.title}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
