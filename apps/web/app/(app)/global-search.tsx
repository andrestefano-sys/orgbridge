'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: 'member' | 'post'
  id: string
  title: string
  subtitle: string
  avatarUrl: string | null
  href: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Fundador',
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
}

function Initials({ name, size = 28 }: { name: string; size?: number }) {
  const chars = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        background: 'var(--ob-navy)',
        color: 'var(--ob-amber)',
        fontSize: size * 0.35,
        fontFamily: 'var(--font-sora)',
      }}
    >
      {chars}
    </div>
  )
}

export function GlobalSearch({ networkId }: { networkId: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        setResults([])
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/networks/${networkId}/search?q=${encodeURIComponent(q)}`,
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data.results ?? [])
      }
    } finally {
      setLoading(false)
    }
    setActiveIndex(-1)
  }, [networkId])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(results[activeIndex]!.href)
        setOpen(false)
        setQuery('')
        setResults([])
      }
    }
  }

  const showDropdown = open && (loading || results.length > 0 || query.trim().length >= 2)

  return (
    <div className="relative" ref={containerRef}>
      {/* Search trigger button (collapsed) */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-all hover:opacity-80"
          style={{
            background: 'var(--ob-surface-alt)',
            border: '1px solid var(--ob-border)',
            color: 'var(--ob-text-faint)',
            minWidth: 180,
          }}
          aria-label="Buscar (Ctrl+K)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 text-left">Buscar...</span>
          <kbd
            className="hidden lg:inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono"
            style={{ background: 'var(--ob-border)', color: 'var(--ob-text-faint)', fontSize: 10 }}
          >
            ⌘K
          </kbd>
        </button>
      )}

      {/* Expanded search input */}
      {open && (
        <div
          className="flex items-center gap-2 rounded-xl px-3"
          style={{
            background: 'var(--ob-surface-alt)',
            border: '1.5px solid var(--ob-amber)',
            boxShadow: '0 0 0 3px var(--ob-amber-glow)',
            height: 36,
            minWidth: 220,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar membros, posts..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--ob-text)' }}
            autoComplete="off"
            aria-label="Busca global"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />
          {loading && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin flex-shrink-0" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="var(--ob-text-faint)" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0110 10" stroke="var(--ob-amber)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          <button
            onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
            className="flex-shrink-0 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--ob-text-faint)' }}
            aria-label="Fechar busca"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Results dropdown */}
      {showDropdown && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden animate-fade-in z-50"
          style={{
            background: 'var(--ob-surface)',
            border: '1px solid var(--ob-border)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          }}
          role="listbox"
          aria-label="Resultados da busca"
        >
          {results.length === 0 && !loading && query.trim().length >= 2 && (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
                Nenhum resultado para <strong style={{ color: 'var(--ob-text)' }}>&ldquo;{query}&rdquo;</strong>
              </p>
            </div>
          )}

          {/* Group: Members */}
          {results.filter((r) => r.type === 'member').length > 0 && (
            <>
              <div
                className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--ob-text-faint)' }}
              >
                Membros
              </div>
              {results
                .filter((r) => r.type === 'member')
                .map((r, i) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <Link
                      key={r.id}
                      href={r.href}
                      role="option"
                      aria-selected={activeIndex === globalIdx}
                      onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
                      className="flex items-center gap-3 px-4 py-2.5 transition-all"
                      style={{
                        background: activeIndex === globalIdx ? 'var(--ob-surface-alt)' : 'transparent',
                      }}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                    >
                      {r.avatarUrl ? (
                        <img src={r.avatarUrl} alt={r.title} width={28} height={28} className="rounded-full object-cover flex-shrink-0" style={{ width: 28, height: 28 }} />
                      ) : (
                        <Initials name={r.title} size={28} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                          {r.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--ob-text-faint)' }}>
                          {ROLE_LABELS[r.subtitle] ?? r.subtitle}
                        </p>
                      </div>
                    </Link>
                  )
                })}
            </>
          )}

          {/* Group: Posts */}
          {results.filter((r) => r.type === 'post').length > 0 && (
            <>
              <div
                className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--ob-text-faint)', borderTop: results.filter((r) => r.type === 'member').length > 0 ? '1px solid var(--ob-border)' : 'none' }}
              >
                Publicações
              </div>
              {results
                .filter((r) => r.type === 'post')
                .map((r) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <Link
                      key={r.id}
                      href={r.href}
                      role="option"
                      aria-selected={activeIndex === globalIdx}
                      onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
                      className="flex items-center gap-3 px-4 py-2.5 transition-all"
                      style={{
                        background: activeIndex === globalIdx ? 'var(--ob-surface-alt)' : 'transparent',
                      }}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                    >
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
                        aria-hidden
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate leading-tight" style={{ color: 'var(--ob-text)' }}>
                          {r.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--ob-text-faint)' }}>
                          {r.subtitle}
                        </p>
                      </div>
                    </Link>
                  )
                })}
            </>
          )}

          {/* Footer hint */}
          {results.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-2 text-xs"
              style={{
                color: 'var(--ob-text-faint)',
                borderTop: '1px solid var(--ob-border)',
              }}
            >
              <span className="flex items-center gap-1">
                <kbd className="rounded px-1 py-0.5 font-mono" style={{ background: 'var(--ob-surface-alt)', fontSize: 9 }}>↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded px-1 py-0.5 font-mono" style={{ background: 'var(--ob-surface-alt)', fontSize: 9 }}>↵</kbd>
                abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded px-1 py-0.5 font-mono" style={{ background: 'var(--ob-surface-alt)', fontSize: 9 }}>Esc</kbd>
                fechar
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
