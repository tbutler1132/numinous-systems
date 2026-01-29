'use client'

import { useState } from 'react'
import { useAudio, type AudioTrack } from '@/contexts/AudioContext'

interface AudioButtonsProps {
  track: AudioTrack
}

export default function AudioButtons({ track }: AudioButtonsProps) {
  const { playNow, queueTrack, queue, currentTrack, isPlaying, pause } = useAudio()
  const [queued, setQueued] = useState(false)

  const isInQueue = queue.some((t) => t.id === track.id)
  const isCurrentTrack = currentTrack?.id === track.id
  const isCurrentlyPlaying = isCurrentTrack && isPlaying

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      pause()
    } else {
      playNow(track)
    }
  }

  const handleQueue = () => {
    if (isInQueue) return
    queueTrack(track)
    setQueued(true)
    setTimeout(() => setQueued(false), 2000)
  }

  return (
    <div className="audio-buttons">
      <button
        className={`audio-btn audio-btn-play${isCurrentlyPlaying ? ' is-playing' : ''}`}
        onClick={handlePlay}
        title={isCurrentlyPlaying ? 'Playing' : 'Play now'}
        aria-label={isCurrentlyPlaying ? 'Currently playing' : `Play ${track.title}`}
      >
        {isCurrentlyPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <button
        className={`audio-btn audio-btn-queue${queued ? ' is-queued' : ''}${isInQueue && !queued ? ' in-queue' : ''}`}
        onClick={handleQueue}
        disabled={isInQueue}
        title={isInQueue ? 'In queue' : 'Add to queue'}
        aria-label={isInQueue ? 'Already in queue' : `Add ${track.title} to queue`}
      >
        {queued ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ) : isInQueue ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
