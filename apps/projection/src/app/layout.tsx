import './globals.css'
import SpatialNav from '@/components/SpatialNav'

export const metadata = {
  title: 'Timothy Butler',
  description: 'A multi-surface experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SpatialNav />
        <div className="page-content">{children}</div>
      </body>
    </html>
  )
}
