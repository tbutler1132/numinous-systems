interface SpinnerProps {
  small?: boolean
  message?: string
  inline?: boolean
}

export default function Spinner({ small, message, inline }: SpinnerProps) {
  const spinnerClass = small ? 'spinner spinner-small' : 'spinner'
  const containerClass = inline ? 'loading loading-inline' : 'loading'

  return (
    <div className={containerClass}>
      <div className={spinnerClass} />
      {message && <p>{message}</p>}
    </div>
  )
}
