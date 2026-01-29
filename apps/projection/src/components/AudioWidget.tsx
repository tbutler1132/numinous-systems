'use client'

import { useAudio } from '@/contexts/AudioContext'

/** Format seconds as m:ss */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AudioWidget() {
  const {
    queue,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    toggle,
    openPlayerInPrism,
    isPrismOpen,
  } = useAudio()

  // Only show widget if there's something in the queue and Prism is closed
  if (queue.length === 0 || isPrismOpen) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="audio-widget">
      <button
        className="audio-widget-main"
        onClick={openPlayerInPrism}
        title="Open in Prism"
      >
        <div className="audio-widget-info">
          <div className="audio-widget-title">
            {currentTrack?.title ?? 'No track selected'}
          </div>
          <div className="audio-widget-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <div className="audio-widget-progress">
          <div
            className="audio-widget-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>
      <button
        className="audio-widget-play"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        disabled={!currentTrack}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}
