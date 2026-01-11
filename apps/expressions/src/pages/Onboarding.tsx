import { useProfile } from '../context/ProfileContext'
import type { Profile } from '../types'

interface Question {
  key: keyof Profile
  text: string
  options: { value: string; label: string }[]
}

const questions: Question[] = [
  {
    key: 'register',
    text: 'How do you prefer ideas presented?',
    options: [
      { value: 'direct', label: 'Direct' },
      { value: 'poetic', label: 'Poetic' },
      { value: 'analytical', label: 'Analytical' },
      { value: 'conversational', label: 'Conversational' },
    ],
  },
  {
    key: 'sacred',
    text: 'Your relationship to the sacred?',
    options: [
      { value: 'theist', label: 'Theist' },
      { value: 'secular', label: 'Secular but open' },
      { value: 'materialist', label: 'Materialist' },
      { value: 'exploring', label: 'Exploring' },
    ],
  },
  {
    key: 'mode',
    text: 'What draws you in?',
    options: [
      { value: 'logic', label: 'Logic' },
      { value: 'stories', label: 'Stories' },
      { value: 'abstractions', label: 'Abstractions' },
      { value: 'practical', label: 'Practical application' },
    ],
  },
  {
    key: 'influences',
    text: 'Which resonates most?',
    options: [
      { value: 'ancient', label: 'Ancient philosophy' },
      { value: 'science', label: 'Modern science' },
      { value: 'art', label: 'Art & aesthetics' },
      { value: 'contemplative', label: 'Contemplative traditions' },
    ],
  },
]

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { profile, updateProfile, isComplete, saveProfile } = useProfile()

  const handleOptionClick = (key: keyof Profile, value: string) => {
    updateProfile(key, value as Profile[typeof key])
  }

  const handleContinue = () => {
    saveProfile()
    onComplete()
  }

  return (
    <>
      <h1>Expressions</h1>
      <p className="subtitle">
        Explore philosophical ideas rewritten for your sensibility. Answer a few
        questions so we can shape the language to how you think.
      </p>

      <div className="progress-indicator">
        {questions.map((q, i) => (
          <span
            key={i}
            className={`progress-dot ${profile[q.key] ? 'filled' : ''}`}
          />
        ))}
      </div>

      {questions.map((q) => (
        <div key={q.key} className="question">
          <div className="question-text">{q.text}</div>
          <div className="options">
            {q.options.map((opt) => (
              <div
                key={opt.value}
                className={`option ${profile[q.key] === opt.value ? 'selected' : ''}`}
                onClick={() => handleOptionClick(q.key, opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn" disabled={!isComplete} onClick={handleContinue}>
        Continue
      </button>
    </>
  )
}
