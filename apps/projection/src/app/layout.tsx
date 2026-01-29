import './globals.css'
import Prism from '@/components/prism'
import AudioWidget from '@/components/AudioWidget'
import { AudioProvider } from '@/contexts/AudioContext'
import { WorldProvider } from '@/contexts/WorldContext'
import { WorldLoader } from '@/components/road/WorldLoader'
import { getSurfaces } from '@/lib/data'
import { isAuthenticated } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Timothy Butler',
  description: 'A multi-surface experience',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const surfaces = getSurfaces()
  const authenticated = await isAuthenticated()

  return (
    <html lang="en">
      <body>
        <AudioProvider>
          <WorldProvider>
            <Prism surfaces={surfaces} initialAuthenticated={authenticated} />
            <AudioWidget />
            <WorldLoader />
            <div className="page-content">{children}</div>
          </WorldProvider>
        </AudioProvider>
      </body>
    </html>
  )
}
