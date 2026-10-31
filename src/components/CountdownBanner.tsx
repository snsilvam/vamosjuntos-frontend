import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { Countdown, CountdownPhase } from '../api/types'

type BannerState = { kind: 'loading' } | { kind: 'ready'; countdown: Countdown } | { kind: 'unavailable' }

interface PhaseLook {
  message: string
  emoji: string
  // Full class names, never built from templates, so Tailwind generates them. White text needs
  // shade 700 or darker to read in full sun (FR-010).
  background: string
  emojiMotion?: string
  emphasis?: string
}

// Message, emoji and intensity of each phase (data-model.md, "Tramos").
const phases: Record<CountdownPhase, PhaseLook> = {
  far: { message: '¡Ya empieza la cuenta regresiva!', emoji: '🎒', background: 'from-orange-700 to-red-700' },
  near: { message: '¡Ve alistando la maleta!', emoji: '🧳', background: 'from-orange-700 to-rose-700' },
  lastWeek: {
    message: '¡Ya casi! Última semana',
    emoji: '🔥',
    background: 'from-rose-700 to-fuchsia-700',
    emojiMotion: 'motion-safe:animate-bounce',
    emphasis: 'shadow-2xl ring-4 ring-amber-300',
  },
  tomorrow: { message: '¡Mañana nos vamos!', emoji: '🚌', background: 'from-red-700 to-fuchsia-700' },
  today: { message: '¡Hoy es el día!', emoji: '🎉', background: 'from-fuchsia-700 to-red-700' },
  ongoing: { message: '¡Estamos de paseo!', emoji: '🌴', background: 'from-emerald-700 to-sky-700' },
  finished: { message: '¡Qué buen paseo! Gracias por venir', emoji: '❤️', background: 'from-violet-700 to-rose-700' },
}

const bannerClass = 'rounded-3xl bg-linear-to-br px-5 py-7 text-center text-white shadow-xl'

// CountdownBanner opens the home page with the days left to the trip (spec 004). The backend
// computes the phase with its own clock in Colombia time; the device clock is never read (FR-003).
// The banner asks again when the phase can change and when the tab becomes visible (FR-009).
export default function CountdownBanner({ name }: { name: string }) {
  const [state, setState] = useState<BannerState>({ kind: 'loading' })
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    let latest = 0
    let timer: number | undefined
    let tickTimer: number | undefined
    let countdownStartedAt = 0
    let countdownDuration = 0

    function load() {
      const request = ++latest
      apiFetch<Countdown>('/api/countdown')
        .then((countdown) => {
          if (!active || request !== latest) return
          setState({ kind: 'ready', countdown })
          window.clearInterval(tickTimer)
          if (countdown.secondsToStart !== undefined) {
            countdownStartedAt = performance.now()
            countdownDuration = countdown.secondsToStart
            setSecondsLeft(countdownDuration)
            tickTimer = window.setInterval(() => {
              const elapsed = Math.floor((performance.now() - countdownStartedAt) / 1000)
              setSecondsLeft(Math.max(0, countdownDuration - elapsed))
            }, 250)
          } else {
            setSecondsLeft(null)
          }
          window.clearTimeout(timer)
          // A duration, not a date: setTimeout measures elapsed time, whatever the device clock says.
          if (countdown.secondsToNextChange !== undefined) {
            timer = window.setTimeout(load, countdown.secondsToNextChange * 1000)
          }
        })
        .catch(() => {
          // A failed reload keeps what the banner already shows (research R3). A 403 or 401 is
          // handled by the API client.
          if (active) setState((s) => (s.kind === 'ready' ? s : { kind: 'unavailable' }))
        })
    }

    // Mobile browsers delay timers while the screen is off; coming back must not show yesterday.
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') load()
    }

    load()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      window.clearTimeout(timer)
      window.clearInterval(tickTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  if (state.kind !== 'ready') {
    return (
      <section className={`${bannerClass} from-orange-700 to-red-700`} aria-busy={state.kind === 'loading'}>
        <h1 className="text-3xl font-extrabold text-balance break-words">¡Hola, {name}!</h1>
        <p className="mt-3 text-lg font-semibold">
          {state.kind === 'loading' ? 'Contando los días…' : 'La cuenta regresiva no está disponible por ahora.'}
        </p>
      </section>
    )
  }

  const { phase, daysLeft } = state.countdown
  const look = phases[phase]
  // daysLeft (calendar days) only picks the phase. The big number comes from the same count as the
  // clock, so they never disagree (spec 004, FR-002 and FR-011); tomorrow and today show no number.
  const counting = phase === 'far' || phase === 'near' || phase === 'lastWeek'
  const liveSeconds = secondsLeft ?? state.countdown.secondsToStart
  const liveCountdown = liveSeconds === undefined ? null : formatRemaining(liveSeconds)
  const days = liveCountdown?.days ?? daysLeft

  return (
    // The entrance plays when the countdown arrives, not on the placeholder; reloads keep the same
    // element, so it plays once (FR-006).
    <section key="ready" className={`${bannerClass} motion-safe:animate-banner-in ${look.background} ${look.emphasis ?? ''}`}>
      <p className="text-6xl" aria-hidden="true">
        <span className={`inline-block ${look.emojiMotion ?? ''}`}>{look.emoji}</span>
      </p>
      {counting ? (
        <>
          <p className="mt-3 text-xl font-extrabold text-balance">{look.message}</p>
          <h1 className="mt-4 text-2xl font-bold text-balance break-words">
            {name}, {days === 1 ? 'falta' : 'faltan'}{' '}
            <span className="my-1 block text-8xl leading-none font-black tracking-tight">{days}</span>{' '}
            {days === 1 ? 'día' : 'días'} para el paseo
          </h1>
        </>
      ) : (
        <h1 className="mt-3 text-balance break-words">
          <span className="block text-2xl font-bold">{name},</span>{' '}
          <span className="mt-1 block text-5xl leading-tight font-black">{look.message}</span>
        </h1>
      )}
      {liveCountdown && (
        <p
          className="mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums"
          aria-label={`${liveCountdown.days} días, ${liveCountdown.hours} horas, ${liveCountdown.minutes} minutos y ${liveCountdown.seconds} segundos`}
        >
          {liveCountdown.days}d {pad(liveCountdown.hours)}h {pad(liveCountdown.minutes)}m {pad(liveCountdown.seconds)}s
        </p>
      )}
    </section>
  )
}

function formatRemaining(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  }
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}
