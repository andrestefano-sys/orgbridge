'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Suggestion chips ────────────────────────────────────────
const SUGGESTIONS = [
  'Resuma as publicações recentes da rede',
  'Qual é a estrutura do organograma?',
  'Quem são os membros mais ativos?',
  'Quais reconhecimentos foram feitos recentemente?',
  'O que foi publicado esta semana?',
  'Qual é a distribuição de membros por área?',
]

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ role, name }: { role: 'user' | 'assistant'; name: string }) {
  if (role === 'assistant') {
    return (
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'var(--ob-navy)' }}
        aria-hidden
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
          <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
          <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
          <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold select-none"
      style={{ background: 'var(--ob-amber)', color: 'var(--ob-navy)', fontFamily: 'var(--font-sora)' }}
      aria-hidden
    >
      {name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────
function MessageBubble({ msg, userName }: { msg: Message; userName: string }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar role={msg.role} name={isUser ? userName : 'AI'} />
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: isUser ? 'var(--ob-navy)' : 'var(--ob-surface)',
            color: isUser ? '#fff' : 'var(--ob-text)',
            border: isUser ? 'none' : '1px solid var(--ob-border)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
          {msg.streaming && (
            <span
              className="inline-block ml-1 h-3 w-0.5 animate-pulse rounded-full align-middle"
              style={{ background: 'var(--ob-amber)' }}
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'var(--ob-navy)' }}
        aria-hidden
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
          <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
          <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
          <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div
        className="flex items-center gap-1 rounded-2xl px-4 py-3"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', borderRadius: '18px 18px 18px 4px' }}
        aria-label="Digitando..."
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="inline-block h-2 w-2 rounded-full animate-bounce"
            style={{ background: 'var(--ob-text-faint)', animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Client Component ─────────────────────────────────────────
export function AiClient({
  networkId,
  networkName,
  currentUserName,
}: {
  networkId: string
  networkName: string
  currentUserName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const send = useCallback(async (userText: string) => {
    const text = userText.trim()
    if (!text || loading) return

    setError('')
    const userMsg: Message = { id: uid(), role: 'user', content: text }
    const assistantId = uid()

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Add streaming placeholder
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }])

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/networks/${networkId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao chamar a IA.')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const chunk = accumulated
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: chunk, streaming: true } : m)
          )
        }
      }

      // Finalize
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: accumulated, streaming: false } : m)
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        setError(err instanceof Error ? err.message : 'Erro desconhecido.')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [messages, networkId, loading])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-fade-slide-up" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: 'var(--ob-navy)' }}
          >
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
              <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
              <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
              <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              OrgBridge AI
            </h1>
            <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
              Assistente de {networkName}
            </p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl p-5 flex flex-col gap-4 mb-4"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', scrollbarWidth: 'thin' }}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8 text-center">
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                Como posso ajudar?
              </p>
              <p className="text-sm max-w-xs" style={{ color: 'var(--ob-text-muted)' }}>
                Faça perguntas sobre a rede, o organograma, publicações recentes ou atividade dos membros.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'var(--ob-surface-alt)',
                    border: '1px solid var(--ob-border)',
                    color: 'var(--ob-text-muted)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} userName={currentUserName} />
            ))}
            {loading && !messages.find((m) => m.streaming) && <TypingIndicator />}
          </>
        )}

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            role="alert"
            style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div
          className="flex-1 relative rounded-2xl"
          style={{ background: 'var(--ob-surface)', border: `1.5px solid ${loading ? 'var(--ob-amber)' : 'var(--ob-border)'}`, boxShadow: loading ? '0 0 0 3px var(--ob-amber-glow)' : 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
        >
          <textarea
            ref={textareaRef}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none"
            style={{ color: 'var(--ob-text)', minHeight: 48, maxHeight: 160, lineHeight: 1.6, fontFamily: 'var(--font-dm-sans)' }}
            placeholder="Pergunte algo sobre a rede..."
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
        </div>

        {loading ? (
          <button
            type="button"
            onClick={handleStop}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80"
            style={{ background: 'var(--ob-error, #ef4444)', color: '#fff' }}
            aria-label="Parar geração"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--ob-navy)', color: '#fff' }}
            aria-label="Enviar mensagem"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        )}
      </form>

      <p className="mt-2 text-center text-xs" style={{ color: 'var(--ob-text-faint)' }}>
        O assistente usa dados reais da rede. Respostas podem conter imprecisões.
      </p>
    </div>
  )
}
