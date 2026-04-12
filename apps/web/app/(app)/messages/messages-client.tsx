'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────
interface OtherUser {
  id: string
  name: string | null
  avatarUrl: string | null
}

interface Conversation {
  id: string
  other: OtherUser
  lastMessageAt: string | null
  lastMessagePreview: string | null
  createdAt: string
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  readAt: string | null
  createdAt: string
  sender: { id: string; name: string | null; avatarUrl: string | null }
}

// ─── Helpers ──────────────────────────────────────────────────
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

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function Avatar({
  user,
  size = 36,
}: {
  user: { name: string | null; avatarUrl: string | null }
  size?: number
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name ?? ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--ob-navy)',
        color: 'var(--ob-amber)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: 'var(--font-sora)',
      }}
    >
      {initials(user.name)}
    </div>
  )
}

// ─── Conversation List ────────────────────────────────────────
function ConvoList({
  convos,
  activeId,
  onSelect,
}: {
  convos: Conversation[]
  activeId: string | null
  onSelect: (c: Conversation) => void
}) {
  if (convos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ color: 'var(--ob-text-faint)' }}
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Nenhuma conversa ainda.
        </p>
        <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          Vá até o perfil de um membro para iniciar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {convos.map((c) => {
        const active = c.id === activeId
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="flex items-center gap-3 px-4 py-3 text-left transition-all"
            style={{
              background: active ? 'var(--ob-surface-alt)' : 'transparent',
              borderLeft: `3px solid ${active ? 'var(--ob-amber)' : 'transparent'}`,
            }}
          >
            <Avatar user={c.other} size={38} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                >
                  {c.other.name ?? 'Membro'}
                </span>
                {c.lastMessageAt && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--ob-text-faint)' }}>
                    {timeAgo(c.lastMessageAt)}
                  </span>
                )}
              </div>
              {c.lastMessagePreview && (
                <p className="text-xs truncate" style={{ color: 'var(--ob-text-muted)' }}>
                  {c.lastMessagePreview}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────
function Bubble({
  msg,
  isMine,
}: {
  msg: Message
  isMine: boolean
}) {
  return (
    <div
      className="flex items-end gap-2 max-w-[75%]"
      style={{ alignSelf: isMine ? 'flex-end' : 'flex-start' }}
    >
      {!isMine && <Avatar user={msg.sender} size={28} />}
      <div>
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={{
            background: isMine ? 'var(--ob-navy)' : 'var(--ob-surface)',
            color: isMine ? '#fff' : 'var(--ob-text)',
            border: isMine ? 'none' : '1px solid var(--ob-border)',
            borderBottomRightRadius: isMine ? 4 : undefined,
            borderBottomLeftRadius: !isMine ? 4 : undefined,
          }}
        >
          {msg.content}
        </div>
        <p
          className="text-[10px] mt-1 px-1"
          style={{
            color: 'var(--ob-text-faint)',
            textAlign: isMine ? 'right' : 'left',
          }}
        >
          {timeAgo(msg.createdAt)}
          {isMine && msg.readAt && (
            <span className="ml-1.5" style={{ color: 'var(--ob-amber-dim)' }}>✓ lida</span>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Conversation View ────────────────────────────────────────
const POLL_INTERVAL = 5000 // 5 seconds

function ConvoView({
  networkId,
  conversationId,
  other,
  currentUserId,
  onBack,
}: {
  networkId: string
  conversationId: string
  other: OtherUser
  currentUserId: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [oldestCursor, setOldestCursor] = useState<string | null>(null)
  const [hasOlder, setHasOlder] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const latestIdRef = useRef<string | null>(null)
  const isActiveRef = useRef(true)

  // Initial load
  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/networks/${networkId}/conversations/${conversationId}`)
    if (res.ok) {
      const data = await res.json()
      const msgs: Message[] = data.messages
      setMessages(msgs)
      setHasOlder(!!data.nextCursor)
      setOldestCursor(data.nextCursor ?? null)
      if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1]!.id
    }
    setLoading(false)
  }, [networkId, conversationId])

  useEffect(() => {
    isActiveRef.current = true
    load()
    return () => { isActiveRef.current = false }
  }, [load])

  // Poll for new messages
  useEffect(() => {
    const iv = setInterval(async () => {
      if (!isActiveRef.current) return
      const res = await fetch(`/api/networks/${networkId}/conversations/${conversationId}`)
      if (!res.ok || !isActiveRef.current) return
      const data = await res.json()
      const incoming: Message[] = data.messages
      if (incoming.length === 0) return
      const newLatest = incoming[incoming.length - 1]!.id
      if (newLatest !== latestIdRef.current) {
        // Merge: keep old messages not in incoming, append all incoming
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const fresh = incoming.filter((m) => !existingIds.has(m.id))
          return fresh.length > 0 ? [...prev, ...fresh] : prev
        })
        latestIdRef.current = newLatest
      }
    }, POLL_INTERVAL)
    return () => clearInterval(iv)
  }, [networkId, conversationId])

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom || loading) {
      bottomRef.current?.scrollIntoView({ behavior: loading ? 'instant' : 'smooth' })
    }
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [draft])

  async function loadOlder() {
    if (!oldestCursor || loadingOlder) return
    setLoadingOlder(true)
    const prevScrollHeight = scrollRef.current?.scrollHeight ?? 0
    const res = await fetch(
      `/api/networks/${networkId}/conversations/${conversationId}?cursor=${encodeURIComponent(oldestCursor)}`,
    )
    if (res.ok) {
      const data = await res.json()
      const older: Message[] = data.messages
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id))
        return [...older.filter((m) => !existingIds.has(m.id)), ...prev]
      })
      setHasOlder(!!data.nextCursor)
      setOldestCursor(data.nextCursor ?? null)
      // Restore scroll position
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
      })
    }
    setLoadingOlder(false)
  }

  async function handleSend() {
    if (!draft.trim() || sending) return
    setSending(true)
    const content = draft.trim()
    setDraft('')

    const res = await fetch(`/api/networks/${networkId}/conversations/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (res.ok) {
      const data = await res.json()
      const newMsg: Message = {
        id: data.message.id,
        conversationId,
        senderId: currentUserId,
        content,
        readAt: null,
        createdAt: data.message.createdAt,
        sender: { id: currentUserId, name: null, avatarUrl: null },
      }
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      latestIdRef.current = newMsg.id
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--ob-border)' }}
      >
        <button
          onClick={onBack}
          className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--ob-text-muted)' }}
          aria-label="Voltar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <Avatar user={other} size={34} />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
          >
            {other.name ?? 'Membro'}
          </p>
          <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
            Conversa direta
          </p>
        </div>
        {/* Polling indicator */}
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }}
          title="Atualizando automaticamente"
          aria-hidden
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Load older button */}
        {hasOlder && !loading && (
          <div className="flex justify-center">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
            >
              {loadingOlder ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
              {loadingOlder ? 'Carregando...' : 'Carregar mensagens anteriores'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: 'var(--ob-text-faint)' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl mb-1"
              style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              Nenhuma mensagem ainda.
            </p>
            <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
              Diga olá a {other.name ?? 'este membro'}!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <Bubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--ob-border)' }}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem... (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--ob-surface-alt)',
            border: '1.5px solid var(--ob-border)',
            color: 'var(--ob-text)',
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: 'auto',
          }}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90 flex-shrink-0"
          style={{ background: 'var(--ob-navy)', color: '#fff' }}
          aria-label="Enviar"
        >
          {sending ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────
export function MessagesClient({
  networkId,
  currentUserId,
  openWithUserId,
}: {
  networkId: string
  currentUserId: string
  openWithUserId: string | null
}) {
  const [convos, setConvos] = useState<Conversation[]>([])
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [active, setActive] = useState<Conversation | null>(null)
  const [showList, setShowList] = useState(true)

  const loadConvos = useCallback(async () => {
    const res = await fetch(`/api/networks/${networkId}/conversations`)
    if (res.ok) {
      const data = await res.json()
      setConvos(data.conversations)
      return data.conversations as Conversation[]
    }
    return [] as Conversation[]
  }, [networkId])

  useEffect(() => {
    setLoadingConvos(true)
    loadConvos().then(async (list) => {
      setLoadingConvos(false)

      // If openWithUserId is set, start or open that conversation
      if (openWithUserId) {
        const existing = list.find((c) => c.other.id === openWithUserId)
        if (existing) {
          setActive(existing)
          setShowList(false)
        } else {
          // Create conversation
          const res = await fetch(`/api/networks/${networkId}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId: openWithUserId }),
          })
          if (res.ok) {
            const data = await res.json()
            const fresh = await loadConvos()
            const found = fresh.find((c) => c.id === data.conversationId)
            if (found) {
              setActive(found)
              setShowList(false)
            }
          }
        }
      }
    })
  }, [networkId, openWithUserId, loadConvos])

  function handleSelect(c: Conversation) {
    setActive(c)
    setShowList(false)
  }

  function handleBack() {
    setShowList(true)
    setActive(null)
    loadConvos()
  }

  return (
    <div className="animate-fade-slide-up max-w-4xl">
      <div className="mb-5">
        <h1
          className="text-2xl font-semibold tracking-tight mb-0.5"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Mensagens
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Conversas diretas com membros da rede
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--ob-surface)',
          border: '1px solid var(--ob-border)',
          height: 'calc(100vh - 220px)',
          minHeight: 400,
          display: 'flex',
        }}
      >
        {/* Conversation list — always visible on desktop, toggled on mobile */}
        <div
          className={`flex-shrink-0 flex-col overflow-y-auto ${showList ? 'flex' : 'hidden sm:flex'}`}
          style={{
            width: 280,
            borderRight: '1px solid var(--ob-border)',
          }}
        >
          <div
            className="px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--ob-border)' }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--ob-text-faint)', fontFamily: 'var(--font-sora)' }}
            >
              Conversas
            </p>
          </div>

          {loadingConvos ? (
            <div className="flex justify-center py-8">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: 'var(--ob-text-faint)' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <ConvoList convos={convos} activeId={active?.id ?? null} onSelect={handleSelect} />
          )}
        </div>

        {/* Message pane — hidden on mobile when showing the convo list */}
        <div
          className={`flex-1 flex-col ${showList ? 'hidden sm:flex' : 'flex'}`}
          style={{ minWidth: 0 }}
        >
          {active ? (
            <ConvoView
              networkId={networkId}
              conversationId={active.id}
              other={active.other}
              currentUserId={currentUserId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{ color: 'var(--ob-text-faint)' }}
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-base font-medium" style={{ color: 'var(--ob-text-muted)', fontFamily: 'var(--font-sora)' }}>
                Selecione uma conversa
              </p>
              <p className="text-sm" style={{ color: 'var(--ob-text-faint)' }}>
                Ou inicie uma nova pelo perfil de um membro
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
