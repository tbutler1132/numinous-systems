import './globals.css'

export const metadata = {
  title: 'Projection',
  description: 'A navigable interface for exploring the system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
