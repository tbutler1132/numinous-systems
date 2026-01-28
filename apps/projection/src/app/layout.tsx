import './globals.css'
import SpatialNav from '@/components/SpatialNav'
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
        <SpatialNav surfaces={surfaces} initialAuthenticated={authenticated} />
        <div className="page-content">{children}</div>
      </body>
    </html>
  )
}
