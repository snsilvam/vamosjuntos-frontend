import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError, apiFetch } from '../api/client'
import type { Item, ItemCategory, Purchases } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useMe } from '../session/useMe'
import ItemForm from './ItemForm'

const categories: { id: ItemCategory; label: string }[] = [
  { id: 'comida', label: 'Comida' },
  { id: 'suministros', label: 'Suministros' },
]

const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-3 font-semibold text-orange-700 ring-2 ring-orange-200 transition hover:bg-orange-50 disabled:opacity-50'

const leftGuest = 'alguien que ya no está en la lista'

// PurchasesPage shows what to bring, by category, who brings it and whether it is bought, and lets
// any confirmed guest manage the list (spec 007).
export default function PurchasesPage() {
  const { me } = useMe()
  const myId = me?.status === 'confirmed' ? me.guest.id : ''
  const [data, setData] = useState<Purchases | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Item | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => apiFetch<Purchases>('/api/purchases'), [])

  useEffect(() => {
    let cancelled = false
    load()
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar la lista de compras. Intenta de nuevo en un momento.')
      })
    return () => {
      cancelled = true
    }
  }, [load])

  // run performs one change on an item; the list always comes back from the server.
  async function run(itemId: string, change: () => Promise<Purchases | undefined>) {
    setBusy(true)
    setError(null)
    try {
      setData((await change()) ?? (await load()))
    } catch (err) {
      const fresh = await load().catch(() => null)
      if (fresh) setData(fresh)
      // "Este ítem ya lo lleva {nombre}": the name comes from the reloaded list (research R4).
      const owner = fresh?.items.find((i) => i.id === itemId)?.responsible
      setError(err instanceof ApiError && err.code === 'item_taken' && owner ? `Este ítem ya lo lleva ${owner.name || leftGuest}.` : friendlyMessage(err, 'list'))
    } finally {
      setBusy(false)
      setDeleting(null)
    }
  }

  const path = (id: string) => `/api/purchases/items/${encodeURIComponent(id)}`
  const take = (id: string) => run(id, () => apiFetch<Purchases>(`${path(id)}/take`, { method: 'POST' }))
  const release = (id: string) => run(id, () => apiFetch<Purchases>(`${path(id)}/release`, { method: 'POST' }))
  const markBought = (id: string, bought: boolean) => run(id, () => apiFetch<Purchases>(`${path(id)}/bought`, { method: 'POST', body: { bought } }))
  const remove = (id: string) => run(id, () => apiFetch<undefined>(path(id), { method: 'DELETE' }))

  if (editing && data) {
    return (
      <Screen title="Compras">
        <ItemForm
          item={editing === 'new' ? undefined : editing}
          items={data.items}
          onSaved={(fresh) => {
            setData(fresh)
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    )
  }

  const items = data?.items ?? []

  return (
    <Screen title="Compras" subtitle="Comida y suministros: qué hace falta y quién lo lleva.">
      {error && <Alert>{error}</Alert>}

      {data === null && !error && (
        <p className="text-center text-stone-500" aria-busy="true">
          Cargando la lista…
        </p>
      )}

      {data && (
        <p className="rounded-3xl bg-white/80 p-4 text-center text-lg font-bold shadow-sm ring-2 ring-orange-100">
          <span className="text-rose-700">{data.summary.pending} por comprar</span>
          {' · '}
          <span className="text-emerald-700">
            {data.summary.bought} {data.summary.bought === 1 ? 'comprado' : 'comprados'}
          </span>
        </p>
      )}

      {data && items.length === 0 && (
        <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-stone-600">Aún no hay nada en la lista. Agrega lo primero que haga falta.</p>
      )}

      {data && (
        <button type="button" className={primaryButton} disabled={busy} onClick={() => setEditing('new')}>
          Agregar ítem
        </button>
      )}

      {categories.map((c) => {
        const group = items.filter((i) => i.category === c.id)
        if (group.length === 0) return null
        return (
          <section key={c.id} className="flex flex-col gap-3">
            <h2 className="text-lg font-extrabold text-orange-700">{c.label}</h2>
            {group.map((i) => {
              const mine = i.responsible?.id === myId
              const owner = i.responsible ? (mine ? `${i.responsible.name} (tú)` : i.responsible.name || leftGuest) : null
              return (
                <article key={i.id} className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-md ring-2 ring-orange-100">
                  <header className="flex items-start justify-between gap-2">
                    <h3 className={`text-xl font-extrabold break-words ${i.bought ? 'text-stone-400 line-through' : ''}`}>
                      {i.name}
                      {i.quantity && <span className="font-semibold text-stone-500"> · {i.quantity}</span>}
                    </h3>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${i.bought ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {i.bought ? 'Comprado' : 'Por comprar'}
                    </span>
                  </header>
                  {i.note && <p className="text-stone-500 italic break-words">{i.note}</p>}
                  <p className="text-stone-600">{owner ? <>Lo lleva <strong>{owner}</strong></> : 'Sin responsable'}</p>

                  {!i.responsible && (
                    <button type="button" className={smallButton} disabled={busy} onClick={() => void take(i.id)}>
                      Yo lo llevo
                    </button>
                  )}
                  {mine && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={smallButton} disabled={busy} onClick={() => void markBought(i.id, !i.bought)}>
                        {i.bought ? 'Aún no lo compro' : 'Ya lo compré'}
                      </button>
                      <button type="button" className={smallButton} disabled={busy} onClick={() => void release(i.id)}>
                        Soltar
                      </button>
                    </div>
                  )}

                  {deleting === i.id ? (
                    <div className="flex flex-col gap-2 rounded-2xl bg-rose-50 p-3 text-center">
                      <p className="font-semibold text-rose-800">¿Eliminar este ítem?{owner && ` Lo lleva ${owner}.`}</p>
                      <div className="flex justify-center gap-2">
                        <button type="button" className={smallButton} disabled={busy} onClick={() => void remove(i.id)}>
                          Sí, eliminar
                        </button>
                        <button type="button" className={smallButton} disabled={busy} onClick={() => setDeleting(null)}>
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button type="button" className={smallButton} disabled={busy} onClick={() => setEditing(i)}>
                        Editar
                      </button>
                      <button type="button" className={smallButton} disabled={busy} onClick={() => setDeleting(i.id)}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )
      })}

      <Link to="/inicio" className={textLink}>
        Volver al inicio
      </Link>
    </Screen>
  )
}
