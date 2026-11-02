import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { Countdown, CountdownPhase } from '../api/types'

type BannerState = { kind: 'loading' } | { kind: 'ready'; countdown: Countdown } | { kind: 'unavailable' }

interface PhaseLook {
  message: string
  // Small label at the top of the banner that names the phase's vacation scene.
  tag: string
  emoji: string
  // Full class names, never built from templates, so Tailwind generates them. White text needs
  // shade 700 or darker to read in full sun (FR-010).
  background: string
  // Decorative emojis: two drifting in the top corners and a row standing on the mountains.
  corners: [string, string]
  ground: string[]
  emojiMotion?: string
  emphasis?: string
}

// Message, scene and intensity of each phase (data-model.md, "Tramos"). Each phase has its own
// palette and scenery: mountains far away, then nature, then the pool as the trip gets closer.
const phases: Record<CountdownPhase, PhaseLook> = {
  far: {
    message: '¡Ya empieza la cuenta regresiva!',
    tag: '🏔️ Rumbo a las montañas',
    emoji: '🏔️',
    background: 'from-sky-700 via-indigo-700 to-violet-800',
    corners: ['☁️', '🦅'],
    ground: ['🌲', '⛰️', '🌲', '🏕️', '🌲'],
  },
  near: {
    message: '¡Ve alistando la maleta!',
    tag: '🌿 Se siente la naturaleza',
    emoji: '🎒',
    background: 'from-emerald-700 via-teal-700 to-sky-800',
    corners: ['🦋', '🌤️'],
    ground: ['🌿', '🌻', '🏕️', '🌲', '🍃'],
  },
  lastWeek: {
    message: '¡Ya casi! Última semana',
    tag: '🏊 Ya huele a piscina',
    emoji: '🏊',
    background: 'from-cyan-700 via-sky-700 to-blue-800',
    corners: ['☀️', '🕶️'],
    ground: ['🌊', '🛟', '🏊', '🍹', '🌊'],
    emojiMotion: 'motion-safe:animate-bounce',
    emphasis: 'shadow-2xl shadow-cyan-900/40 ring-4 ring-cyan-200/80',
  },
  tomorrow: {
    message: '¡Mañana nos vamos!',
    tag: '🧳 Maletas listas',
    emoji: '🚌',
    background: 'from-amber-700 via-orange-700 to-rose-800',
    corners: ['🗺️', '✨'],
    ground: ['🏔️', '🌲', '🚌', '💨', '🌲'],
    emphasis: 'shadow-2xl ring-4 ring-amber-200/80',
  },
  today: {
    message: '¡Hoy es el día!',
    tag: '☀️ Día de paseo',
    emoji: '🎉',
    background: 'from-fuchsia-700 via-pink-700 to-orange-700',
    corners: ['🎊', '☀️'],
    ground: ['🏖️', '🍹', '🏊', '🌴', '🎶'],
    emojiMotion: 'motion-safe:animate-bounce',
    emphasis: 'shadow-2xl ring-4 ring-pink-200/80',
  },
  ongoing: {
    message: '¡Estamos de paseo!',
    tag: '🌴 Modo vacaciones',
    emoji: '🌴',
    background: 'from-teal-700 via-emerald-700 to-cyan-800',
    corners: ['🌞', '🐦'],
    ground: ['🏞️', '🏊', '🌊', '🔥', '🌴'],
  },
  finished: {
    message: '¡Qué buen paseo! Gracias por venir',
    tag: '📸 Recuerdos para siempre',
    emoji: '🌄',
    background: 'from-indigo-700 via-violet-700 to-rose-800',
    corners: ['🌙', '⭐'],
    ground: ['🏔️', '📸', '❤️', '🌲', '🌄'],
  },
}

const bannerClass =
  'relative isolate overflow-hidden rounded-3xl bg-linear-to-br px-5 pt-5 pb-24 text-center text-white shadow-xl'

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
    const look = phases.far
    return (
      <section className={`${bannerClass} ${look.background}`} aria-busy={state.kind === 'loading'}>
        <Scenery look={look} />
        <div className="relative">
          <HeroEmoji emoji={look.emoji} />
          <h1 className="mt-4 text-3xl font-extrabold text-balance break-words">¡Hola, {name}!</h1>
          <p className="mt-3 text-lg font-semibold">
            {state.kind === 'loading' ? 'Contando los días…' : 'La cuenta regresiva no está disponible por ahora.'}
          </p>
        </div>
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
      <Scenery look={look} />

      <div className="relative">
        <p className="inline-block rounded-full bg-black/20 px-3 py-1 text-sm font-bold tracking-wide ring-1 ring-white/30">
          {look.tag}
        </p>

        <HeroEmoji emoji={look.emoji} motion={look.emojiMotion} />

        {counting ? (
          <>
            <p className="mt-4 text-xl font-extrabold text-balance">{look.message}</p>
            <h1 className="mt-3 text-2xl font-bold text-balance break-words">
              {name}, {days === 1 ? 'falta' : 'faltan'}{' '}
              <span className="my-2 block text-8xl leading-none font-black tracking-tight text-shadow-lg">{days}</span>{' '}
              {days === 1 ? 'día' : 'días'} para el paseo
            </h1>
          </>
        ) : (
          <h1 className="mt-4 text-balance break-words">
            <span className="block text-2xl font-bold">{name},</span>{' '}
            <span className="mt-1 block text-5xl leading-tight font-black text-shadow-lg">{look.message}</span>
          </h1>
        )}

        {liveCountdown && <Clock remaining={liveCountdown} />}
      </div>
    </section>
  )
}

// HeroEmoji is the phase's main emoji, inside a soft glass circle.
function HeroEmoji({ emoji, motion }: { emoji: string; motion?: string }) {
  return (
    <p className="mt-4" aria-hidden="true">
      <span className="inline-flex size-24 items-center justify-center rounded-full bg-white/15 text-6xl shadow-lg ring-4 ring-white/25">
        <span className={`inline-block ${motion ?? 'motion-safe:animate-float'}`}>{emoji}</span>
      </span>
    </p>
  )
}

// Scenery draws the decorative landscape: drifting emojis in the top corners, two layers of
// mountains at the bottom and the phase's emojis standing on them. It sits behind the text and is
// hidden from screen readers.
function Scenery({ look }: { look: PhaseLook }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 select-none" aria-hidden="true">
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
      <span className="absolute top-4 left-4 text-3xl opacity-80 motion-safe:animate-float">{look.corners[0]}</span>
      <span className="absolute top-5 right-4 text-3xl opacity-80 motion-safe:animate-float [animation-delay:-2s]">
        {look.corners[1]}
      </span>
      <svg className="absolute inset-x-0 bottom-0 h-24 w-full" viewBox="0 0 400 96" preserveAspectRatio="none">
        <path
          d="M0 60 L55 22 L95 50 L150 8 L210 52 L255 26 L310 56 L360 18 L400 44 L400 96 L0 96 Z"
          className="fill-white/10"
        />
        <path d="M0 78 L70 46 L130 72 L200 40 L270 74 L335 48 L400 70 L400 96 L0 96 Z" className="fill-black/20" />
      </svg>
      <div className="absolute inset-x-0 bottom-2 flex justify-around px-4 text-2xl">
        {look.ground.map((emoji, i) => (
          <span key={i} className="inline-block motion-safe:animate-float" style={{ animationDelay: `${-i * 0.7}s` }}>
            {emoji}
          </span>
        ))}
      </div>
    </div>
  )
}

// Clock shows the days, hours, minutes and seconds left as four tiles (FR-011).
function Clock({ remaining }: { remaining: ReturnType<typeof formatRemaining> }) {
  const units = [
    { value: String(remaining.days), label: remaining.days === 1 ? 'Día' : 'Días' },
    { value: pad(remaining.hours), label: 'Horas' },
    { value: pad(remaining.minutes), label: 'Min' },
    { value: pad(remaining.seconds), label: 'Seg' },
  ]
  return (
    <div
      className="mt-5 grid grid-cols-4 gap-2"
      role="timer"
      aria-label={`${remaining.days} días, ${remaining.hours} horas, ${remaining.minutes} minutos y ${remaining.seconds} segundos`}
    >
      {units.map((unit, i) => (
        <div key={i} className="rounded-2xl bg-black/25 px-1 py-2 shadow-inner ring-1 ring-white/25" aria-hidden="true">
          {/* A new key on every tick restarts the pop of the seconds tile. */}
          <p
            key={i === 3 ? unit.value : 'value'}
            className={`text-3xl leading-none font-black tabular-nums ${i === 3 ? 'motion-safe:animate-tick' : ''}`}
          >
            {unit.value}
          </p>
          <p className="mt-1 text-xs font-bold tracking-wider uppercase">{unit.label}</p>
        </div>
      ))}
    </div>
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
