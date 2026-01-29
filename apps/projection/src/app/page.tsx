import { getLanding } from '@/lib/data'

export default function Home() {
  const landing = getLanding()

  return (
    <div className="landing">
      <div className="landing-content">
        <header className="landing-header">
          <h1 className="landing-name">{landing.page}</h1>
        </header>
      </div>
    </div>
  )
}
