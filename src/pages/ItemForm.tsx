import { useState, type FormEvent } from 'react'
import { apiFetch } from '../api/client'
import type { Item, ItemCategory, ItemInput, Purchases } from '../api/types'
import { Alert, fieldInput, primaryButton, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'

interface ItemFormProps {
  // The item to edit; undefined adds a new one.
  item?: Item
  // Every item of the list, to warn about a repeated name.
  items: Item[]
  onSaved: (data: Purchases) => void
  onCancel: () => void
}

const categories: { id: ItemCategory; label: string }[] = [
  { id: 'comida', label: 'Comida' },
  { id: 'suministros', label: 'Suministros' },
]

// foldName compares names like the backend: without accents, case or surrounding spaces.
function foldName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// ItemForm adds or edits an item of the shopping list (spec 007, US2 and US4).
export default function ItemForm({ item, items, onSaved, onCancel }: ItemFormProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<ItemCategory>(item?.category ?? 'comida')
  const [quantity, setQuantity] = useState(item?.quantity ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // The name the guest already chose to keep despite the warning.
  const [confirmedName, setConfirmedName] = useState<string | null>(null)

  const repeated = items.some((other) => other.id !== item?.id && foldName(other.name) === foldName(name))
  const mustConfirm = repeated && confirmedName !== foldName(name)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim() === '') {
      setError('Escribe qué hace falta llevar.')
      return
    }
    // A repeated name is allowed, after a warning (spec 007, edge cases).
    if (mustConfirm) {
      setConfirmedName(foldName(name))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body: ItemInput = { name, category, quantity, note }
      const data = item
        ? await apiFetch<Purchases>(`/api/purchases/items/${encodeURIComponent(item.id)}`, { method: 'PUT', body })
        : await apiFetch<Purchases>('/api/purchases/items', { method: 'POST', body })
      onSaved(data)
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-md ring-2 ring-orange-100">
      <h2 className="text-xl font-extrabold text-orange-700">{item ? 'Editar ítem' : 'Agregar ítem'}</h2>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Qué hace falta
        <input className={fieldInput} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Arroz" required />
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="font-semibold text-stone-600">Categoría</legend>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <label key={c.id} className={`flex min-h-12 items-center justify-center rounded-2xl border-2 font-semibold ${category === c.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-orange-200 bg-white'}`}>
              <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} className="sr-only" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Cantidad (opcional)
        <input className={fieldInput} value={quantity} onChange={(e) => setQuantity(e.target.value)} maxLength={30} placeholder="5 kg" />
      </label>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Nota (opcional)
        <textarea className={fieldInput} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2} placeholder="Marca, tamaño…" />
      </label>

      {repeated && confirmedName === foldName(name) && (
        <p role="status" className="rounded-2xl bg-amber-100 px-4 py-3 text-center text-amber-900">
          Ya hay un ítem llamado así.
        </p>
      )}
      {error && <Alert>{error}</Alert>}
      <button type="submit" className={primaryButton} disabled={saving}>
        {saving ? 'Guardando…' : repeated && confirmedName === foldName(name) ? 'Guardar de todas formas' : 'Guardar'}
      </button>
      <button type="button" className={textLink} onClick={onCancel}>
        Cancelar
      </button>
    </form>
  )
}
