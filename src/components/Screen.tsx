import type { ReactNode } from 'react'

interface ScreenProps {
  title: string
  subtitle?: ReactNode
  children: ReactNode
}

// Screen is the shared mobile-first layout of every page.
export default function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <main className="min-h-dvh bg-linear-to-b from-amber-50 via-orange-50 to-rose-100 px-4 py-8 text-stone-800">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="text-center">
          <p className="text-sm font-semibold tracking-widest text-orange-600 uppercase">
            Vamos Juntos
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-balance break-words">{title}</h1>
          {subtitle && <p className="mt-2 text-stone-600">{subtitle}</p>}
        </header>
        {children}
      </div>
    </main>
  )
}
