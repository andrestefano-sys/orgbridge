'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface Member {
  id: string
  role: string
  status: string
  orgNodeId: string | null
  joinedAt: string | null
  user: { id: string; name: string; email: string; image: string | null; jobTitle?: string | null }
}

interface OrgNode {
  id: string
  name: string
  color: string | null
  level: number
  position: number
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
}

const ROLE_ORDER: Record<string, number> = { owner: 0, admin: 1, manager: 2, member: 3 }

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  owner: { bg: 'rgba(233,160,16,0.12)', text: 'var(--ob-amber)', border: 'rgba(233,160,16,0.3)' },
  admin: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  manager: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  member: { bg: 'var(--ob-surface-alt)', text: 'var(--ob-text-muted)', border: 'var(--ob-border)' },
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0 font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: 'var(--ob-navy)',
        color: 'var(--ob-amber)',
        fontFamily: 'var(--font-sora)',
      }}
    >
      {initials}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS['member']!
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'active' ? '#4ade80' : status === 'suspended' ? 'var(--ob-error)' : '#94a3b8'
  return (
    <span
      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
      style={{ background: color }}
      title={status}
    />
  )
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`
  return `há ${Math.floor(months / 12)} ${Math.floor(months / 12) === 1 ? 'ano' : 'anos'}`
}

interface Props {
  networkId: string
  networkName: string
  currentUserRole: string
  currentUserId: string
}

// ─── Member Row with management menu ──────────────────────────
function MemberRow({
  member,
  networkId,
  currentUserRole,
  currentUserId,
  index,
  orgNodes,
  onRoleChange,
  onOrgNodeChange,
  onRemove,
}: {
  member: Member
  networkId: string
  currentUserRole: string
  currentUserId: string
  index: number
  orgNodes: OrgNode[]
  onRoleChange: (memberId: string, role: string) => void
  onOrgNodeChange: (memberId: string, orgNodeId: string | null) => void
  onRemove: (memberId: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPanel, setMenuPanel] = useState<'main' | 'area'>('main')
  const [acting, setActing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAdmin = ['owner', 'admin'].includes(currentUserRole)
  const canManage =
    isAdmin &&
    member.user.id !== currentUserId &&
    member.role !== 'owner'

  const currentNode = orgNodes.find((n) => n.id === member.orgNodeId) ?? null

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setMenuPanel('main')
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function changeRole(role: string) {
    setMenuOpen(false)
    setMenuPanel('main')
    setActing(true)
    const res = await fetch(`/api/networks/${networkId}/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setActing(false)
    if (res.ok) onRoleChange(member.id, role)
  }

  async function assignOrgNode(orgNodeId: string | null) {
    setMenuOpen(false)
    setMenuPanel('main')
    setActing(true)
    const res = await fetch(`/api/networks/${networkId}/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgNodeId }),
    })
    setActing(false)
    if (res.ok) onOrgNodeChange(member.id, orgNodeId)
  }

  async function removeMember() {
    setMenuOpen(false)
    setMenuPanel('main')
    if (!confirm(`Remover ${member.user.name ?? 'este membro'} da rede?`)) return
    setActing(true)
    const res = await fetch(`/api/networks/${networkId}/members/${member.id}`, {
      method: 'DELETE',
    })
    setActing(false)
    if (res.ok) onRemove(member.id)
  }

  const availableRoles = ['admin', 'manager', 'member'].filter((r) => r !== member.role)
  const roleLabelsMenu: Record<string, string> = {
    admin: 'Promover a Administrador',
    manager: 'Definir como Gestor',
    member: 'Definir como Membro',
  }

  // Sort nodes by level then position for display
  const sortedNodes = [...orgNodes].sort((a, b) => a.level - b.level || a.position - b.position)

  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{ borderTop: index > 0 ? '1px solid var(--ob-border)' : 'none' }}
    >
      <Link href={`/profile/${member.user.id}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={member.user.name ?? '?'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-sm font-medium truncate"
              style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
            >
              {member.user.name}
              {member.user.id === currentUserId && (
                <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--ob-text-faint)' }}>
                  (você)
                </span>
              )}
            </span>
            <StatusDot status={member.status} />
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--ob-text-muted)' }}>
            {member.user.jobTitle
              ? <span><span style={{ color: 'var(--ob-text-muted)' }}>{member.user.jobTitle}</span> · <span style={{ color: 'var(--ob-text-faint)' }}>{member.user.email}</span></span>
              : member.user.email}
          </p>
          {currentNode && (
            <div className="mt-1 flex items-center gap-1">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: currentNode.color ? `${currentNode.color}18` : 'var(--ob-surface-alt)',
                  color: currentNode.color ?? 'var(--ob-text-faint)',
                  border: `1px solid ${currentNode.color ? `${currentNode.color}40` : 'var(--ob-border)'}`,
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M21 10H3M21 10V18a2 2 0 01-2 2H5a2 2 0 01-2-2V10M21 10l-9-7-9 7" />
                </svg>
                {currentNode.name}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 flex-shrink-0">
        <RoleBadge role={member.role} />
        <span className="text-xs hidden sm:block" style={{ color: 'var(--ob-text-faint)' }}>
          {timeAgo(member.joinedAt)}
        </span>

        {/* Send message button — only for other members */}
        {member.user.id !== currentUserId && (
          <Link
            href={`/messages?with=${member.user.id}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--ob-text-faint)' }}
            aria-label={`Enviar mensagem para ${member.user.name ?? 'membro'}`}
            title="Enviar mensagem"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </Link>
        )}

        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setMenuOpen((v) => !v); setMenuPanel('main') }}
              disabled={acting}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:opacity-40"
              style={{ color: 'var(--ob-text-faint)' }}
              aria-label={`Gerenciar ${member.user.name}`}
            >
              {acting ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-30 rounded-xl py-1 animate-fade-in"
                style={{
                  background: 'var(--ob-surface)',
                  border: '1px solid var(--ob-border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  minWidth: 220,
                }}
              >
                {menuPanel === 'main' ? (
                  <>
                    <div className="px-3 py-1.5 mb-1" style={{ borderBottom: '1px solid var(--ob-border)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--ob-text-faint)' }}>
                        Alterar função
                      </p>
                    </div>
                    {availableRoles
                      .filter((r) => !(currentUserRole === 'admin' && r === 'admin'))
                      .map((r) => (
                        <button
                          key={r}
                          onClick={() => changeRole(r)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                          style={{ color: 'var(--ob-text)' }}
                        >
                          <div
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: ROLE_COLORS[r]?.text ?? 'var(--ob-text-faint)' }}
                          />
                          {roleLabelsMenu[r]}
                        </button>
                      ))}

                    {orgNodes.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--ob-border)', marginTop: 4, paddingTop: 4 }}>
                        <button
                          onClick={() => setMenuPanel('area')}
                          className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                          style={{ color: 'var(--ob-text)' }}
                        >
                          <div className="flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Atribuir área
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--ob-border)', marginTop: 4 }}>
                      <button
                        onClick={removeMember}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-red-50 mt-1"
                        style={{ color: 'var(--ob-error)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM19 8l5 5M24 8l-5 5" />
                        </svg>
                        Remover da rede
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-2 px-3 py-2 mb-1"
                      style={{ borderBottom: '1px solid var(--ob-border)' }}
                    >
                      <button
                        onClick={() => setMenuPanel('main')}
                        className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-black/5"
                        style={{ color: 'var(--ob-text-faint)' }}
                        aria-label="Voltar"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <p className="text-xs font-semibold" style={{ color: 'var(--ob-text-faint)' }}>
                        Escolher área
                      </p>
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      <button
                        onClick={() => assignOrgNode(null)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                        style={{ color: member.orgNodeId === null ? 'var(--ob-amber-dim)' : 'var(--ob-text-muted)' }}
                      >
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: 'var(--ob-border)' }} />
                        Sem área
                        {member.orgNodeId === null && (
                          <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                      {sortedNodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => assignOrgNode(node.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-black/5"
                          style={{ color: member.orgNodeId === node.id ? 'var(--ob-amber-dim)' : 'var(--ob-text)', paddingLeft: 16 + node.level * 10 }}
                        >
                          <div
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: node.color ?? 'var(--ob-text-faint)' }}
                          />
                          <span className="truncate">{node.name}</span>
                          {member.orgNodeId === node.id && (
                            <svg className="ml-auto flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MembersClient({ networkId, networkName, currentUserRole, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    Promise.all([
      fetch(`/api/networks/${networkId}/members`).then((r) => r.json()),
      fetch(`/api/networks/${networkId}/org-nodes`).then((r) => r.json()),
    ])
      .then(([membersData, nodesData]) => {
        if (membersData.error) setError(membersData.error)
        else setMembers(membersData.members)
        if (nodesData.nodes) setOrgNodes(nodesData.nodes)
      })
      .catch(() => setError('Erro ao carregar membros.'))
      .finally(() => setLoading(false))
  }, [networkId])

  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        m.user.name?.toLowerCase().includes(q) ||
        m.user.email?.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || m.role === roleFilter
      return matchSearch && matchRole
    })
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 4) - (ROLE_ORDER[b.role] ?? 4))

  const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Membros
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          {members.length} {members.length === 1 ? 'membro' : 'membros'} em{' '}
          <strong style={{ color: 'var(--ob-text)' }}>{networkName}</strong>
        </p>
      </div>

      {/* Stats row */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['owner', 'admin', 'manager', 'member'] as const).map((role) => {
            const count = roleCounts[role] ?? 0
            const colors = ROLE_COLORS[role]!
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
                className="text-left rounded-xl p-3 transition-all"
                style={{
                  background: roleFilter === role ? colors.bg : 'var(--ob-surface)',
                  border: `1px solid ${roleFilter === role ? colors.border : 'var(--ob-border)'}`,
                }}
              >
                <p
                  className="text-2xl font-semibold mb-0.5"
                  style={{ color: roleFilter === role ? colors.text : 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                >
                  {count}
                </p>
                <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
                  {ROLE_LABELS[role]}
                </p>
              </button>
            )
          })}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--ob-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ob-input pl-9"
          />
        </div>

        {roleFilter !== 'all' && (
          <button
            onClick={() => setRoleFilter('all')}
            className="flex items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-all"
            style={{
              background: ROLE_COLORS[roleFilter]?.bg ?? 'var(--ob-surface)',
              color: ROLE_COLORS[roleFilter]?.text ?? 'var(--ob-text)',
              border: `1px solid ${ROLE_COLORS[roleFilter]?.border ?? 'var(--ob-border)'}`,
            }}
          >
            {ROLE_LABELS[roleFilter]}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--ob-text-faint)' }}>
          <Spinner />
        </div>
      ) : error ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}
        >
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center" style={{ color: 'var(--ob-text-faint)' }}>
          <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          <p className="text-sm">Nenhum membro encontrado</p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--ob-border)', background: 'var(--ob-surface)' }}
        >
          {filtered.map((member, i) => (
            <MemberRow
              key={member.id}
              member={member}
              networkId={networkId}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              index={i}
              orgNodes={orgNodes}
              onRoleChange={(memberId, role) =>
                setMembers((prev) =>
                  prev.map((m) => m.id === memberId ? { ...m, role } : m)
                )
              }
              onOrgNodeChange={(memberId, orgNodeId) =>
                setMembers((prev) =>
                  prev.map((m) => m.id === memberId ? { ...m, orgNodeId } : m)
                )
              }
              onRemove={(memberId) =>
                setMembers((prev) => prev.filter((m) => m.id !== memberId))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
