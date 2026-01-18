import { useEffect, useRef, type ReactNode } from 'react'

interface ContentBoxProps {
  children: ReactNode
  revealing?: boolean
  className?: string
}

export default function ContentBox({ children, revealing, className }: ContentBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (revealing && containerRef.current) {
      const children = containerRef.current.querySelectorAll(
        'p, h1, h2, h3, ul, ol, blockquote'
      )
      children.forEach((el, i) => {
        el.classList.add('reveal-line')
        ;(el as HTMLElement).style.animationDelay = `${i * 0.08}s`
      })
    }
  }, [revealing, children])

  const classes = ['content-box', revealing && 'revealing', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={containerRef} className={classes}>
      {children}
    </div>
  )
}
