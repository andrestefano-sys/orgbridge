'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────
interface Author {
  id: string
  name: string
  avatarUrl: string | null
  jobTitle?: string | null
}

interface Comment {
  id: string
  content: string
  author: Author
  createdAt: string
}

interface Post {
  id: string
  content: string
  type: string
  authorId: string
  author: Author
  recognizedUser: Author | null
  reactions: Array<{ userId: string; emoji: string }>
  comments: Comment[]
  commentsCount: number
  reactionsCount: number
  isPinned: boolean
  orgNodeId: string | null
  createdAt: string
  viewerReaction: string | null
}

interface CurrentUser {
  id: string
  name: string
  avatarUrl: string | null
  role: string
}

interface OrgNode {
  id: string
  name: string
  color: string | null
  level: number
  position: number
}

// ─── Emoji config ─────────────────────────────────────────────
const EMOJIS: Array<{ key: string; label: string; symbol: string }> = [
  { key: 'like', label: 'Gostei', symbol: '👍' },
  { key: 'celebrate', label: 'Parabéns', symbol: '🎉' },
  { key: 'support', label: 'Apoio', symbol: '🤝' },
  { key: 'insightful', label: 'Perspicaz', symbol: '💡' },
  { key: 'done', label: 'Feito', symbol: '✅' },
  { key: 'urgent', label: 'Urgente', symbol: '🔥' },
]

const POST_TYPES = [
  { key: 'text', label: 'Publicação', icon: '✏️' },
  { key: 'recognition', label: 'Reconhecimento', icon: '🏆' },
  { key: 'announcement', label: 'Comunicado', icon: '📢' },
]

// ─── Helpers ─────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function Avatar({ user, size = 36 }: { user: { name: string; avatarUrl?: string | null }; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold select-none"
      style={{
        width: size,
        height: size,
        background: 'var(--ob-navy)',
        color: 'var(--ob-amber)',
        fontFamily: 'var(--font-sora)',
        fontSize: size * 0.33,
      }}
    >
      {initials(user.name)}
    </div>
  )
}

// ─── User Picker (for recognition) ───────────────────────────
function UserPicker({
  networkId,
  onSelect,
  selected,
}: {
  networkId: string
  onSelect: (user: { id: string; name: string } | null) => void
  selected: { id: string; name: string } | null
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/networks/${networkId}/members`)
      if (res.ok) {
        const data = await res.json()
        const q = query.toLowerCase()
        setResults(
          (data.members as Array<{ id: string; role: string; user: { id: string; name: string } }>)
            .filter((m) => m.user.name.toLowerCase().includes(q))
            .slice(0, 6)
            .map((m) => ({ id: m.user.id, name: m.user.name, role: m.role }))
        )
        setOpen(true)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [query, networkId])

  if (selected) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
        style={{ background: 'rgba(233,160,16,0.08)', border: '1px solid rgba(233,160,16,0.25)' }}
      >
        <span className="text-base" aria-hidden>🏆</span>
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--ob-text)' }}>
          Reconhecendo <strong>{selected.name}</strong>
        </span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--ob-text-faint)' }}
          aria-label="Remover seleção"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="relative mb-3" ref={ref}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--ob-text-faint)" strokeWidth="2" strokeLinecap="round" aria-hidden
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <input
          type="text"
          placeholder="Quem você quer reconhecer?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ob-input pl-9"
          style={{ height: 40, fontSize: 13 }}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-30 animate-fade-in"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
        >
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => { onSelect(u); setQuery(''); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-all hover:opacity-80"
              style={{ borderBottom: '1px solid var(--ob-border)' }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--ob-navy)', color: 'var(--ob-amber)', fontFamily: 'var(--font-sora)' }}
              >
                {u.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
              </div>
              <span style={{ color: 'var(--ob-text)' }}>{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Post Composer ────────────────────────────────────────────
function PostComposer({
  networkId,
  currentUser,
  orgNodes,
  onPost,
}: {
  networkId: string
  currentUser: CurrentUser
  orgNodes: OrgNode[]
  onPost: (post: Post) => void
}) {
  const [content, setContent] = useState('')
  const [type, setType] = useState('text')
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recognizedUser, setRecognizedUser] = useState<{ id: string; name: string } | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load draft on mount
  useEffect(() => {
    fetch(`/api/networks/${networkId}/drafts`)
      .then((r) => r.json())
      .then((d) => {
        if (d.draft && d.draft.content.trim()) {
          setHasDraft(true)
        }
      })
      .catch(() => null)
  }, [networkId])

  function restoreDraft() {
    fetch(`/api/networks/${networkId}/drafts`)
      .then((r) => r.json())
      .then((d) => {
        if (d.draft) {
          setContent(d.draft.content)
          setType(d.draft.type ?? 'text')
          setExpanded(true)
          setHasDraft(false)
          setTimeout(() => autoResize(), 0)
        }
      })
      .catch(() => null)
  }

  function discardDraft() {
    fetch(`/api/networks/${networkId}/drafts`, { method: 'DELETE' }).catch(() => null)
    setHasDraft(false)
  }

  // Auto-save draft debounced 1.5s after typing
  function scheduleDraftSave(value: string, postType: string) {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    if (!value.trim()) return
    draftTimerRef.current = setTimeout(() => {
      fetch(`/api/networks/${networkId}/drafts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value, type: postType }),
      })
        .then(() => { setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2000) })
        .catch(() => null)
    }, 1500)
  }

  const availableTypes = POST_TYPES.filter(
    (t) => t.key !== 'announcement' || ['owner', 'admin'].includes(currentUser.role),
  )

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }

  function handleTypeChange(newType: string) {
    setType(newType)
    if (newType !== 'recognition') setRecognizedUser(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    if (type === 'recognition' && !recognizedUser) {
      setError('Selecione um colega para reconhecer.')
      return
    }
    setError('')
    setLoading(true)

    const res = await fetch(`/api/networks/${networkId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        type,
        recognizedUserId: recognizedUser?.id ?? null,
        orgNodeId: selectedAreaId ?? null,
        visibility: selectedAreaId ? 'area' : 'network',
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao publicar.')
      return
    }

    // Clear draft after publish
    fetch(`/api/networks/${networkId}/drafts`, { method: 'DELETE' }).catch(() => null)

    setContent('')
    setType('text')
    setSelectedAreaId(null)
    setRecognizedUser(null)
    setExpanded(false)
    setDraftSaved(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onPost(data.post)
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      {/* Draft restore banner */}
      {hasDraft && !expanded && (
        <div
          className="flex items-center justify-between gap-3 mb-4 rounded-xl px-4 py-2.5"
          style={{ background: 'rgba(233,160,16,0.08)', border: '1px solid rgba(233,160,16,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ob-amber)" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="text-xs font-medium" style={{ color: 'var(--ob-amber-dim)' }}>
              Você tem um rascunho salvo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restoreDraft}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--ob-amber-dim)' }}
            >
              Retomar
            </button>
            <span style={{ color: 'var(--ob-border)' }}>·</span>
            <button
              onClick={discardDraft}
              className="text-xs hover:underline"
              style={{ color: 'var(--ob-text-faint)' }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Type selector */}
        {expanded && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {availableTypes.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTypeChange(t.key)}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: type === t.key ? 'var(--ob-navy)' : 'var(--ob-surface-alt)',
                  color: type === t.key ? '#fff' : 'var(--ob-text-muted)',
                  border: `1px solid ${type === t.key ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
                }}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Recognition user picker */}
        {expanded && type === 'recognition' && (
          <UserPicker
            networkId={networkId}
            selected={recognizedUser}
            onSelect={setRecognizedUser}
          />
        )}

        {/* Area selector — only when nodes exist */}
        {expanded && orgNodes.length > 0 && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <span className="flex-shrink-0 text-xs" style={{ color: 'var(--ob-text-faint)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} aria-hidden>
                <path d="M21 10H3M21 10V18a2 2 0 01-2 2H5a2 2 0 01-2-2V10M21 10l-9-7-9 7" />
              </svg>
              Área:
            </span>
            <button
              type="button"
              onClick={() => setSelectedAreaId(null)}
              className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all"
              style={{
                background: selectedAreaId === null ? 'var(--ob-navy)' : 'var(--ob-surface-alt)',
                color: selectedAreaId === null ? '#fff' : 'var(--ob-text-muted)',
                border: `1px solid ${selectedAreaId === null ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
              }}
            >
              Toda a rede
            </button>
            {[...orgNodes]
              .sort((a, b) => a.level - b.level || a.position - b.position)
              .map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedAreaId(node.id)}
                  className="flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all"
                  style={{
                    background: selectedAreaId === node.id
                      ? (node.color ?? 'var(--ob-text-muted)')
                      : 'var(--ob-surface-alt)',
                    color: selectedAreaId === node.id ? '#fff' : 'var(--ob-text-muted)',
                    border: `1px solid ${selectedAreaId === node.id
                      ? (node.color ?? 'var(--ob-border)')
                      : 'var(--ob-border)'}`,
                  }}
                >
                  {node.color && (
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ background: selectedAreaId === node.id ? 'rgba(255,255,255,0.7)' : node.color }}
                    />
                  )}
                  {node.name}
                </button>
              ))}
          </div>
        )}

        <div className="flex gap-3">
          <Avatar user={currentUser} size={38} />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150"
              style={{
                background: 'var(--ob-surface-alt)',
                border: `1.5px solid ${expanded ? 'var(--ob-amber)' : 'transparent'}`,
                color: 'var(--ob-text)',
                minHeight: 44,
                lineHeight: 1.6,
                fontFamily: 'var(--font-dm-sans)',
                boxShadow: expanded ? '0 0 0 3px var(--ob-amber-glow)' : 'none',
              }}
              placeholder={
                type === 'recognition'
                  ? 'Descreva a contribuição deste colega...'
                  : type === 'announcement'
                  ? 'Escreva um comunicado oficial...'
                  : `Compartilhe algo com a rede...`
              }
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                autoResize()
                scheduleDraftSave(e.target.value, type)
              }}
              onFocus={() => setExpanded(true)}
              rows={expanded ? 3 : 1}
              maxLength={5000}
            />

            {expanded && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                    {content.length}/5000
                  </span>
                  {draftSaved && (
                    <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                      · rascunho salvo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setExpanded(false); setContent(''); setError(''); setRecognizedUser(null); setSelectedAreaId(null); setDraftSaved(false) }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                    style={{ color: 'var(--ob-text-muted)', border: '1px solid var(--ob-border)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !content.trim() || (type === 'recognition' && !recognizedUser)}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--ob-navy)', color: '#fff' }}
                  >
                    {loading ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : null}
                    Publicar
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-2 text-xs" style={{ color: 'var(--ob-error)' }}>{error}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Reaction Bar ─────────────────────────────────────────────
function ReactionBar({
  post,
  networkId,
  currentUserId,
  onReacted,
}: {
  post: Post
  networkId: string
  currentUserId: string
  onReacted: (postId: string, emoji: string, action: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  async function react(emoji: string) {
    setPickerOpen(false)
    const res = await fetch(`/api/networks/${networkId}/posts/${post.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    if (res.ok) {
      const data = await res.json()
      onReacted(post.id, emoji, data.action)
    }
  }

  // Group reactions by emoji
  const grouped: Record<string, number> = {}
  for (const r of post.reactions) {
    grouped[r.emoji] = (grouped[r.emoji] ?? 0) + 1
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing reaction chips */}
      {Object.entries(grouped).map(([emoji, count]) => {
        const def = EMOJIS.find((e) => e.key === emoji)
        const isViewer = post.viewerReaction === emoji
        return (
          <button
            key={emoji}
            onClick={() => react(emoji)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 hover:opacity-80 active:scale-95"
            style={{
              background: isViewer ? 'rgba(233,160,16,0.12)' : 'var(--ob-surface-alt)',
              border: `1px solid ${isViewer ? 'var(--ob-amber)' : 'var(--ob-border)'}`,
              color: isViewer ? 'var(--ob-amber-dim)' : 'var(--ob-text-muted)',
            }}
            aria-label={`${def?.label ?? emoji}: ${count}`}
          >
            <span>{def?.symbol ?? emoji}</span>
            <span>{count}</span>
          </button>
        )
      })}

      {/* Add reaction button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-80"
          style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-faint)' }}
          aria-label="Reagir"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {pickerOpen && (
          <div
            className="absolute bottom-9 left-0 z-20 flex gap-1 rounded-xl p-2 animate-fade-in"
            style={{
              background: 'var(--ob-surface)',
              border: '1px solid var(--ob-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
          >
            {EMOJIS.map((e) => (
              <button
                key={e.key}
                onClick={() => react(e.key)}
                title={e.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all hover:scale-125 hover:bg-black/5"
                aria-label={e.label}
              >
                {e.symbol}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Comment Section ──────────────────────────────────────────
function CommentSection({
  post,
  networkId,
  currentUser,
  onCommented,
}: {
  post: Post
  networkId: string
  currentUser: CurrentUser
  onCommented: (postId: string, comment: Comment) => void
}) {
  const [allComments, setAllComments] = useState<Comment[]>(post.comments)
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  async function loadAll() {
    if (loaded) return
    const res = await fetch(`/api/networks/${networkId}/posts/${post.id}/comments`)
    if (res.ok) {
      const data = await res.json()
      setAllComments(data.comments)
      setLoaded(true)
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('Remover este comentário?')) return
    setDeletingCommentId(commentId)
    const res = await fetch(
      `/api/networks/${networkId}/posts/${post.id}/comments/${commentId}`,
      { method: 'DELETE' },
    )
    setDeletingCommentId(null)
    if (res.ok) {
      setAllComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    const res = await fetch(`/api/networks/${networkId}/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setInput('')
      setAllComments((prev) => [...prev, data.comment])
      onCommented(post.id, data.comment)
    }
  }

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--ob-border)' }}>
      {/* Show more link */}
      {!loaded && post.commentsCount > allComments.length && (
        <button
          onClick={loadAll}
          className="mb-3 text-xs font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--ob-amber-dim)' }}
        >
          Ver todos os {post.commentsCount} comentários
        </button>
      )}

      {/* Comments list */}
      <div className="flex flex-col gap-3 mb-3">
        {allComments.map((c) => (
          <div key={c.id} className="flex gap-2 group">
            <Avatar user={c.author} size={28} />
            <div className="flex-1 min-w-0">
              <div
                className="rounded-xl px-3 py-2"
                style={{ background: 'var(--ob-surface-alt)' }}
              >
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                  {c.author.name}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ob-text)' }}>
                  {c.content}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px]" style={{ color: 'var(--ob-text-faint)' }}>
                  {timeAgo(c.createdAt)}
                </span>
                {(c.author.id === currentUser.id || ['owner', 'admin'].includes(currentUser.role)) && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    disabled={deletingCommentId === c.id}
                    className="text-xs hover:underline underline-offset-2 disabled:opacity-40"
                    style={{ color: 'var(--ob-error, #f43f5e)' }}
                  >
                    {deletingCommentId === c.id ? '...' : 'Excluir'}
                  </button>
                )}
                {c.author.id !== currentUser.id && (
                  <button
                    onClick={() => setReportingCommentId(c.id)}
                    className="text-xs hover:underline underline-offset-2"
                    style={{ color: 'var(--ob-text-faint)' }}
                  >
                    Denunciar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {reportingCommentId && (
        <ReportModal
          networkId={networkId}
          targetType="comment"
          targetId={reportingCommentId}
          onClose={() => setReportingCommentId(null)}
        />
      )}

      {/* Comment input */}
      <form onSubmit={submit} className="flex gap-2">
        <Avatar user={currentUser} size={28} />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="ob-input flex-1"
            style={{ height: 36, fontSize: 13, borderRadius: 18, paddingLeft: 14 }}
            placeholder="Escreva um comentário..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--ob-navy)', color: '#fff', flexShrink: 0 }}
            aria-label="Enviar comentário"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Report Modal ─────────────────────────────────────────────
const REPORT_REASONS = [
  { key: 'harassment', label: 'Assédio ou ameaça' },
  { key: 'spam', label: 'Spam ou conteúdo repetitivo' },
  { key: 'inappropriate', label: 'Conteúdo impróprio' },
  { key: 'misinformation', label: 'Desinformação' },
  { key: 'other', label: 'Outro motivo' },
]

function ReportModal({
  networkId,
  targetType,
  targetId,
  onClose,
}: {
  networkId: string
  targetType: 'post' | 'comment'
  targetId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return
    setLoading(true)
    await fetch(`/api/networks/${networkId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, reason, description }),
    })
    setLoading(false)
    setDone(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-fade-in"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}
      >
        {done ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                Denúncia enviada
              </p>
              <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
                Obrigado. Nossa equipe de moderação irá analisar em breve.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--ob-navy)', color: '#fff' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                Denunciar conteúdo
              </h3>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                style={{ color: 'var(--ob-text-faint)' }}
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <p className="text-xs mb-1" style={{ color: 'var(--ob-text-muted)' }}>
                Selecione o motivo da denúncia:
              </p>
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.key}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                    style={{
                      background: reason === r.key ? 'rgba(233,160,16,0.08)' : 'var(--ob-surface-alt)',
                      border: `1.5px solid ${reason === r.key ? 'var(--ob-amber)' : 'var(--ob-border)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.key}
                      checked={reason === r.key}
                      onChange={() => setReason(r.key)}
                      className="sr-only"
                    />
                    <div
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-all"
                      style={{
                        border: `2px solid ${reason === r.key ? 'var(--ob-amber)' : 'var(--ob-text-faint)'}`,
                        background: reason === r.key ? 'var(--ob-amber)' : 'transparent',
                      }}
                    >
                      {reason === r.key && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--ob-text)' }}>{r.label}</span>
                  </label>
                ))}
              </div>
              {reason === 'other' && (
                <textarea
                  placeholder="Descreva o problema (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ob-input resize-none"
                  style={{ minHeight: 72, fontSize: 13 }}
                  maxLength={500}
                />
              )}
              <button
                type="submit"
                disabled={!reason || loading}
                className="mt-1 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--ob-error, #ef4444)', color: '#fff' }}
              >
                {loading ? 'Enviando...' : 'Enviar denúncia'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────
function PostCard({
  post,
  networkId,
  currentUser,
  orgNodes,
  onDelete,
  onReacted,
  onCommented,
  onPinToggle,
  onEdited,
}: {
  post: Post
  networkId: string
  currentUser: CurrentUser
  orgNodes: OrgNode[]
  onDelete: (id: string) => void
  onReacted: (postId: string, emoji: string, action: string) => void
  onCommented: (postId: string, comment: Comment) => void
  onPinToggle: (postId: string, isPinned: boolean) => void
  onEdited: (postId: string, content: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const editRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const canDelete = post.authorId === currentUser.id || ['owner', 'admin'].includes(currentUser.role)
  const canEdit = post.authorId === currentUser.id || ['owner', 'admin'].includes(currentUser.role)
  const canPin = ['owner', 'admin'].includes(currentUser.role)
  const canReport = post.authorId !== currentUser.id

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleDelete() {
    setMenuOpen(false)
    if (!confirm('Remover este post?')) return
    await fetch(`/api/networks/${networkId}/posts/${post.id}`, { method: 'DELETE' })
    onDelete(post.id)
  }

  async function handlePin() {
    setMenuOpen(false)
    const action = post.isPinned ? 'unpin' : 'pin'
    const res = await fetch(`/api/networks/${networkId}/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      onPinToggle(post.id, action === 'pin')
    }
  }

  function startEdit() {
    setMenuOpen(false)
    setEditContent(post.content)
    setEditError('')
    setEditing(true)
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus()
        editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length)
        // Auto-resize
        editRef.current.style.height = 'auto'
        editRef.current.style.height = `${editRef.current.scrollHeight}px`
      }
    }, 0)
  }

  async function saveEdit() {
    if (!editContent.trim()) { setEditError('Conteúdo não pode ser vazio.'); return }
    setEditSaving(true)
    setEditError('')
    const res = await fetch(`/api/networks/${networkId}/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', content: editContent }),
    })
    setEditSaving(false)
    if (res.ok) {
      onEdited(post.id, editContent.trim())
      setEditing(false)
    } else {
      const data = await res.json()
      setEditError(data.error ?? 'Erro ao salvar.')
    }
  }

  const typeBadge = {
    recognition: { label: 'Reconhecimento', color: 'var(--ob-amber-dim)', bg: 'rgba(233,160,16,0.1)' },
    announcement: { label: 'Comunicado', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    text: null,
    document: { label: 'Documento', color: '#0891B2', bg: 'rgba(8,145,178,0.1)' },
  }[post.type]

  const areaNode = post.orgNodeId ? orgNodes.find((n) => n.id === post.orgNodeId) : null

  return (
    <article
      className="rounded-2xl p-5 animate-fade-slide-up"
      style={{
        background: 'var(--ob-surface)',
        border: `1px solid ${post.isPinned ? 'var(--ob-amber)' : 'var(--ob-border)'}`,
        boxShadow: post.isPinned ? '0 0 0 1px var(--ob-amber-glow)' : 'none',
      }}
    >
      {/* Pinned indicator */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-medium" style={{ color: 'var(--ob-amber-dim)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16 2l-8 8-4 1 1-4 8-8 3 3zm-8 8l-4 10 4-4 4 4-4-10z" />
          </svg>
          Fixado
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar user={post.author} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                {post.author.name}
              </span>
              {typeBadge && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: typeBadge.bg, color: typeBadge.color }}
                >
                  {typeBadge.label}
                </span>
              )}
              {areaNode && (
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: areaNode.color ? `${areaNode.color}18` : 'var(--ob-surface-alt)',
                    color: areaNode.color ?? 'var(--ob-text-muted)',
                    border: `1px solid ${areaNode.color ? `${areaNode.color}40` : 'var(--ob-border)'}`,
                  }}
                >
                  {areaNode.color && (
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ background: areaNode.color }}
                    />
                  )}
                  {areaNode.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {post.author.jobTitle && (
                <span className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
                  {post.author.jobTitle} ·
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                {timeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        {(canDelete || canReport || canPin || canEdit) && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--ob-text-faint)' }}
              aria-label="Opções do post"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 rounded-xl py-1 animate-fade-in"
                style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 160 }}
              >
                {canEdit && (
                  <button
                    onClick={startEdit}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                    style={{ color: 'var(--ob-text-muted)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                )}
                {canPin && (
                  <button
                    onClick={handlePin}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                    style={{ color: 'var(--ob-text-muted)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {post.isPinned ? 'Desafixar' : 'Fixar no topo'}
                  </button>
                )}
                {canReport && (
                  <button
                    onClick={() => { setMenuOpen(false); setShowReport(true) }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                    style={{ color: 'var(--ob-text-muted)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    Denunciar
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-red-50"
                    style={{ color: 'var(--ob-error)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Remover
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {showReport && (
          <ReportModal
            networkId={networkId}
            targetType="post"
            targetId={post.id}
            onClose={() => setShowReport(false)}
          />
        )}
      </div>

      {/* Recognition special header */}
      {post.type === 'recognition' && post.recognizedUser && (
        <div
          className="flex items-center gap-3 rounded-xl p-3 mb-4"
          style={{ background: 'rgba(233,160,16,0.08)', border: '1px solid rgba(233,160,16,0.2)' }}
        >
          <span className="text-2xl" aria-hidden>🏆</span>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--ob-amber-dim)' }}>Reconhecendo</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              {post.recognizedUser.name}
            </p>
          </div>
        </div>
      )}

      {/* Content / Edit mode */}
      {editing ? (
        <div className="mb-4">
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setEditing(false); setEditError('') }
            }}
            className="ob-input w-full resize-none text-sm leading-relaxed"
            style={{ minHeight: 80, maxHeight: 400, overflow: 'hidden' }}
            maxLength={5000}
            disabled={editSaving}
          />
          {editError && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ob-error)' }}>{editError}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={saveEdit}
              disabled={editSaving || !editContent.trim()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--ob-navy)', color: '#fff' }}
            >
              {editSaving ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : null}
              {editSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditError('') }}
              disabled={editSaving}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-70 disabled:opacity-40"
              style={{ border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
            >
              Cancelar
            </button>
            <span className="ml-auto text-xs" style={{ color: 'var(--ob-text-faint)' }}>
              Esc para cancelar
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--ob-text)' }}>
          {post.content}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4" style={{ borderTop: '1px solid var(--ob-border)', paddingTop: 12 }}>
        <ReactionBar
          post={post}
          networkId={networkId}
          currentUserId={currentUser.id}
          onReacted={onReacted}
        />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70 ml-auto"
          style={{ color: showComments ? 'var(--ob-amber-dim)' : 'var(--ob-text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {post.commentsCount > 0 ? post.commentsCount : ''} Comentar
        </button>
      </div>

      {showComments && (
        <CommentSection
          post={post}
          networkId={networkId}
          currentUser={currentUser}
          onCommented={onCommented}
        />
      )}
    </article>
  )
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--ob-text-faint)' }} aria-hidden>
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
        Feed vazio
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--ob-text-muted)' }}>
        Seja o primeiro a publicar algo para a rede. Use o campo acima para compartilhar uma atualização.
      </p>
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────
const FEED_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'text', label: 'Publicações' },
  { key: 'recognition', label: 'Reconhecimentos' },
  { key: 'announcement', label: 'Comunicados' },
]

export default function FeedClient({
  networkId,
  networkName,
  currentUser,
  currentUserOrgNodeId,
  orgNodes,
}: {
  networkId: string
  networkName: string
  currentUser: CurrentUser
  currentUserOrgNodeId: string | null
  orgNodes: OrgNode[]
}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState<string>('all') // 'all' | 'mine' | nodeId

  const fetchPosts = useCallback(async (cursor?: string, area?: string) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    const areaVal = area ?? areaFilter
    if (areaVal !== 'all') params.set('orgNodeId', areaVal)
    const url = `/api/networks/${networkId}/posts${params.toString() ? `?${params}` : ''}`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    return data as { posts: Post[]; nextCursor: string | null }
  }, [networkId, areaFilter])

  useEffect(() => {
    setLoading(true)
    fetchPosts().then((data) => {
      if (data) {
        setPosts(data.posts)
        setNextCursor(data.nextCursor)
      }
      setLoading(false)
    })
  }, [fetchPosts])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const data = await fetchPosts(nextCursor)
    if (data) {
      setPosts((prev) => [...prev, ...data.posts])
      setNextCursor(data.nextCursor)
    }
    setLoadingMore(false)
  }

  function handleAreaFilter(area: string) {
    setAreaFilter(area)
    setTypeFilter('all')
    // fetchPosts triggers via useEffect[fetchPosts] which depends on areaFilter
  }

  function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev])
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleReacted(postId: string, emoji: string, action: string) {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p
      let reactions = [...p.reactions]
      const existing = reactions.find((r) => r.userId === currentUser.id)

      if (action === 'removed') {
        reactions = reactions.filter((r) => r.userId !== currentUser.id)
        return { ...p, reactions, reactionsCount: p.reactionsCount - 1, viewerReaction: null }
      }
      if (action === 'changed') {
        reactions = reactions.map((r) => r.userId === currentUser.id ? { ...r, emoji } : r)
        return { ...p, reactions, viewerReaction: emoji }
      }
      // added
      reactions = [...reactions, { userId: currentUser.id, emoji }]
      return { ...p, reactions, reactionsCount: p.reactionsCount + 1, viewerReaction: emoji }
    }))
  }

  function handleCommented(postId: string, comment: Comment) {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
    ))
  }

  function handlePinToggle(postId: string, isPinned: boolean) {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId ? { ...p, isPinned } : p
      )
      // Re-sort: pinned posts first, then by createdAt desc
      return [
        ...updated.filter((p) => p.isPinned),
        ...updated.filter((p) => !p.isPinned),
      ]
    })
  }

  function handleEdited(postId: string, content: string) {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content } : p))
  }

  return (
    <div className="animate-fade-slide-up max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-0.5" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Feed
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>{networkName}</p>
      </div>

      {/* Composer */}
      <div className="mb-5">
        <PostComposer networkId={networkId} currentUser={currentUser} orgNodes={orgNodes} onPost={handleNewPost} />
      </div>

      {/* Area filter chips */}
      {orgNodes.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => handleAreaFilter('all')}
            className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              background: areaFilter === 'all' ? 'var(--ob-navy)' : 'var(--ob-surface)',
              color: areaFilter === 'all' ? '#fff' : 'var(--ob-text-muted)',
              border: `1px solid ${areaFilter === 'all' ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
            }}
          >
            Toda a rede
          </button>
          {currentUserOrgNodeId && (
            <button
              onClick={() => handleAreaFilter('mine')}
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={{
                background: areaFilter === 'mine' ? 'var(--ob-amber)' : 'var(--ob-surface)',
                color: areaFilter === 'mine' ? 'var(--ob-navy)' : 'var(--ob-text-muted)',
                border: `1px solid ${areaFilter === 'mine' ? 'var(--ob-amber)' : 'var(--ob-border)'}`,
              }}
            >
              Minha área
            </button>
          )}
          {[...orgNodes]
            .sort((a, b) => a.level - b.level || a.position - b.position)
            .slice(0, 6)
            .map((node) => (
              <button
                key={node.id}
                onClick={() => handleAreaFilter(node.id)}
                className="flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background: areaFilter === node.id
                    ? (node.color ?? 'var(--ob-text-muted)')
                    : 'var(--ob-surface)',
                  color: areaFilter === node.id ? '#fff' : 'var(--ob-text-muted)',
                  border: `1px solid ${areaFilter === node.id
                    ? (node.color ?? 'var(--ob-border)')
                    : 'var(--ob-border)'}`,
                }}
              >
                {node.color && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ background: areaFilter === node.id ? 'rgba(255,255,255,0.7)' : node.color }}
                  />
                )}
                {node.name}
              </button>
            ))}
        </div>
      )}

      {/* Type filter tabs */}
      {!loading && posts.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {FEED_FILTERS.map((f) => {
            const count = f.key === 'all' ? posts.length : posts.filter((p) => p.type === f.key).length
            if (f.key !== 'all' && count === 0) return null
            return (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: typeFilter === f.key ? 'var(--ob-navy)' : 'var(--ob-surface)',
                  color: typeFilter === f.key ? '#fff' : 'var(--ob-text-muted)',
                  border: `1px solid ${typeFilter === f.key ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
                }}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                    style={{
                      background: typeFilter === f.key ? 'rgba(255,255,255,0.2)' : 'var(--ob-surface-alt)',
                      color: typeFilter === f.key ? '#fff' : 'var(--ob-text-faint)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}>
              <div className="flex gap-3 mb-4">
                <div className="h-10 w-10 rounded-full" style={{ background: 'var(--ob-border)' }} />
                <div className="flex-1">
                  <div className="h-3.5 w-32 rounded mb-2" style={{ background: 'var(--ob-border)' }} />
                  <div className="h-3 w-16 rounded" style={{ background: 'var(--ob-border)' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded" style={{ background: 'var(--ob-border)' }} />
                <div className="h-3 w-4/5 rounded" style={{ background: 'var(--ob-border)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="flex flex-col gap-4">
          {posts.filter((p) => typeFilter === 'all' || p.type === typeFilter).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              networkId={networkId}
              currentUser={currentUser}
              orgNodes={orgNodes}
              onDelete={handleDelete}
              onReacted={handleReacted}
              onCommented={handleCommented}
              onPinToggle={handlePinToggle}
              onEdited={handleEdited}
            />
          ))}

          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{ border: '1.5px solid var(--ob-border)', color: 'var(--ob-text-muted)', background: 'var(--ob-surface)' }}
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
