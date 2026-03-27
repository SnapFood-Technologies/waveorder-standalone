'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import {
  CATALOG_COUNTRY_OPTIONS,
  type CatalogCountryOption
} from '@/lib/catalog-country-options'

type Props = {
  id: string
  label: string
  helperText?: string
  value: string[]
  onChange: (codes: string[]) => void
}

export function CatalogCountryMultiselect({
  id,
  label,
  helperText,
  value,
  onChange
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const q = search.trim().toLowerCase()
  const filtered: CatalogCountryOption[] = q
    ? CATALOG_COUNTRY_OPTIONS.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q)
      )
    : CATALOG_COUNTRY_OPTIONS

  const toggle = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter((c) => c !== code))
    } else {
      onChange([...value, code])
    }
  }

  const remove = (code: string) => {
    onChange(value.filter((c) => c !== code))
  }

  const summary =
    value.length === 0
      ? 'Select countries…'
      : value
          .map((code) => CATALOG_COUNTRY_OPTIONS.find((o) => o.code === code)?.name || code)
          .join(', ')

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {helperText && <p className="text-xs text-gray-500 mb-2">{helperText}</p>}

      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={value.length === 0 ? 'text-gray-500' : 'text-gray-900 truncate'}>
          {summary}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((code) => {
            const o = CATALOG_COUNTRY_OPTIONS.find((c) => c.code === code)
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 text-xs"
              >
                <span>{o?.flag}</span>
                <span>{o?.name ?? code}</span>
                <button
                  type="button"
                  onClick={() => remove(code)}
                  className="p-0.5 rounded hover:bg-teal-200"
                  aria-label={`Remove ${code}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-teal-500 text-gray-900"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <ul
            role="listbox"
            className="overflow-y-auto py-1 max-h-52"
            aria-multiselectable
          >
            {filtered.map((o) => {
              const checked = value.includes(o.code)
              return (
                <li key={o.code} role="option" aria-selected={checked}>
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o.code)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-base leading-none">{o.flag}</span>
                    <span>{o.name}</span>
                    <span className="text-gray-400 font-mono text-xs ml-auto">{o.code}</span>
                  </label>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-gray-500 text-center">No match</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
