import './globals.css'
import SpatialNav from '@/components/SpatialNav'
import { getSurfaces } from '@/lib/data'

export const metadata = {
  title: 'Timothy Butler',
  description: 'A multi-surface experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const surfaces = getSurfaces()

  return (
    <html lang="en">
      <body>
        <SpatialNav surfaces={surfaces} />
        <div className="page-content">{children}</div>
      </body>
    </html>
  )
}
