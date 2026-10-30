import type { ReactNode } from 'react'

export const primaryButton =
  'min-h-12 w-full rounded-2xl bg-orange-500 px-5 py-3 text-lg font-bold text-white shadow-md transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButton =
  'min-h-12 w-full rounded-2xl border-2 border-orange-300 bg-white px-5 py-3 text-lg font-semibold text-orange-700 transition hover:bg-orange-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

export const textLink =
  'inline-flex min-h-11 items-center justify-center font-semibold text-orange-700 underline underline-offset-4'

export const textInput =
  'min-h-12 w-full rounded-2xl border-2 border-orange-200 bg-white px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-orange-500'

export const fieldInput =
  'min-h-12 w-full rounded-2xl border-2 border-orange-200 bg-white px-4 py-3 text-lg outline-none focus:border-orange-500'

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-center text-rose-800">
      {children}
    </p>
  )
}

export function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-amber-50" aria-busy="true">
      <p className="text-lg font-semibold text-orange-600">Cargando…</p>
    </div>
  )
}
