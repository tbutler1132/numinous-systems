'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

/** A track that can be queued for playback */
export interface AudioTrack {
  id: string
  title: string
  url: string
  context?: {
    type: 'heros-journey' | 'song' | 'other'
    label?: string
    path?: string
  }
}

/** Playback state */
interface AudioState {
  queue: AudioTrack[]
  currentIndex: number | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

/** Controls that Prism registers for cross-component communication */
interface PrismControls {
  open: () => void
  setActivePage: (page: string) => void
  setIsOpen: (isOpen: boolean) => void
}

/** Full context value exposed to consumers */
interface AudioContextValue extends AudioState {
  // Queue management
  queueTrack: (track: AudioTrack) => void
  queueTracks: (tracks: AudioTrack[], startIndex?: number) => void
  playNow: (track: AudioTrack) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  playTrackAt: (index: number) => void

  // Playback controls
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void

  // Prism integration
  registerPrismControls: (controls: PrismControls) => void
  openPlayerInPrism: () => void
  isPrismOpen: boolean
  setPrismOpen: (isOpen: boolean) => void

  // Current track helper
  currentTrack: AudioTrack | null
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<AudioTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPrismOpen, setIsPrismOpen] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prismControlsRef = useRef<PrismControls | null>(null)

  // Initialize audio element on mount
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      // Auto-advance to next track
      setCurrentIndex((prev) => {
        if (prev === null) return null
        const nextIndex = prev + 1
        if (nextIndex < queue.length) {
          return nextIndex
        }
        // End of queue
        setIsPlaying(false)
        return prev
      })
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.pause()
      audio.src = ''
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load and play when currentIndex changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (currentIndex !== null && queue[currentIndex]) {
      const track = queue[currentIndex]
      if (audio.src !== track.url) {
        audio.src = track.url
        audio.load()
      }
      if (isPlaying) {
        audio.play().catch(() => {
          // Autoplay may be blocked
          setIsPlaying(false)
        })
      }
    }
  }, [currentIndex, queue, isPlaying])

  // Queue management
  const queueTrack = useCallback((track: AudioTrack) => {
    setQueue((prev) => {
      // Don't add duplicates
      if (prev.some((t) => t.id === track.id)) return prev
      const newQueue = [...prev, track]
      // If queue was empty, start playing the new track
      if (prev.length === 0) {
        setCurrentIndex(0)
        setIsPlaying(true)
      }
      return newQueue
    })
  }, [])

  const queueTracks = useCallback((tracks: AudioTrack[], startIndex = 0) => {
    setQueue((prev) => {
      const newTracks = tracks.filter((t) => !prev.some((p) => p.id === t.id))
      if (newTracks.length === 0) return prev
      const newQueue = [...prev, ...newTracks]
      // If queue was empty, start playing from startIndex
      if (prev.length === 0 && newTracks.length > 0) {
        setCurrentIndex(startIndex)
        setIsPlaying(true)
      }
      return newQueue
    })
  }, [])

  const playNow = useCallback((track: AudioTrack) => {
    setQueue((prev) => {
      // Check if track is already in queue
      const existingIndex = prev.findIndex((t) => t.id === track.id)
      if (existingIndex !== -1) {
        // Already in queue, just skip to it
        setCurrentIndex(existingIndex)
        setIsPlaying(true)
        return prev
      }

      // Insert after current track (or at start if nothing playing)
      const insertIndex = currentIndex !== null ? currentIndex + 1 : 0
      const newQueue = [
        ...prev.slice(0, insertIndex),
        track,
        ...prev.slice(insertIndex),
      ]
      setCurrentIndex(insertIndex)
      setIsPlaying(true)
      return newQueue
    })
  }, [currentIndex])

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      if (index < 0 || index >= prev.length) return prev
      const newQueue = prev.filter((_, i) => i !== index)

      // Adjust currentIndex if needed
      setCurrentIndex((prevIndex) => {
        if (prevIndex === null) return null
        if (index < prevIndex) return prevIndex - 1
        if (index === prevIndex) {
          // Removed current track
          if (newQueue.length === 0) {
            setIsPlaying(false)
            return null
          }
          // Stay at same index (will be next track) or go to last
          return Math.min(prevIndex, newQueue.length - 1)
        }
        return prevIndex
      })

      return newQueue
    })
  }, [])

  const clearQueue = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    setQueue([])
    setCurrentIndex(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const playTrackAt = useCallback((index: number) => {
    setQueue((prev) => {
      if (index >= 0 && index < prev.length) {
        setCurrentIndex(index)
        setIsPlaying(true)
        setCurrentTime(0)
      }
      return prev
    })
  }, [])

  // Playback controls
  const play = useCallback(() => {
    const audio = audioRef.current
    if (audio && currentIndex !== null) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentIndex])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const next = useCallback(() => {
    if (currentIndex !== null && currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentTime(0)
    }
  }, [currentIndex, queue.length])

  const previous = useCallback(() => {
    const audio = audioRef.current
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setCurrentTime(0)
    }
  }, [currentIndex])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0))
    }
  }, [])

  // Prism integration
  const registerPrismControls = useCallback((controls: PrismControls) => {
    prismControlsRef.current = controls
  }, [])

  const openPlayerInPrism = useCallback(() => {
    if (prismControlsRef.current) {
      prismControlsRef.current.setActivePage('/audio/')
      prismControlsRef.current.open()
    }
  }, [])

  const currentTrack = currentIndex !== null ? queue[currentIndex] ?? null : null

  const value: AudioContextValue = {
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    currentTrack,
    queueTrack,
    queueTracks,
    playNow,
    removeFromQueue,
    clearQueue,
    playTrackAt,
    play,
    pause,
    toggle,
    next,
    previous,
    seek,
    registerPrismControls,
    openPlayerInPrism,
    isPrismOpen,
    setPrismOpen: setIsPrismOpen,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
