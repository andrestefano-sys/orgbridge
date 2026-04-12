'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface OrgNode {
  id: string
  networkId: string
  parentId: string | null
  name: string
  level: number
  color: string | null
  position: number
  createdAt: string
}

interface LayoutNode {
  node: OrgNode
  x: number
  y: number
  width: number
  height: number
  children: LayoutNode[]
}

const NODE_W = 160
const NODE_H = 52
const H_GAP = 24
const V_GAP = 64

const DEFAULT_COLORS = [
  '#E9A010', '#6366f1', '#22c55e', '#f43f5e',
  '#06b6d4', '#a855f7', '#f97316', '#14b8a6',
]

function getNodeColor(node: OrgNode, index: number): string {
  if (node.color) return node.color
  if (node.level === 0) return '#E9A010'
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? '#E9A010'
}

// Build tree layout using Reingold-Tilford-like approach
function buildLayout(nodes: OrgNode[]): { root: LayoutNode | null; width: number; height: number } {
  if (nodes.length === 0) return { root: null, width: 0, height: 0 }

  const rootNode: OrgNode = nodes.find((n) => n.level === 0) ?? nodes[0]!
  const childMap: Record<string, OrgNode[]> = {}

  for (const n of nodes) {
    if (n.parentId) {
      if (!childMap[n.parentId]) childMap[n.parentId] = []
      const bucket = childMap[n.parentId]!
      if (!bucket.find((c) => c.id === n.id)) {
        bucket.push(n)
      }
    }
  }

  // Sort by position
  for (const key of Object.keys(childMap)) {
    childMap[key]!.sort((a, b) => a.position - b.position)
  }

  function buildNode(node: OrgNode): LayoutNode {
    const children = (childMap[node.id] ?? []).map(buildNode)

    let x = 0
    if (children.length === 1) {
      x = children[0]!.x
    } else if (children.length > 1) {
      x = (children[0]!.x + children[children.length - 1]!.x) / 2
    }

    return { node, x, y: 0, width: NODE_W, height: NODE_H, children }
  }

  const layoutRoot = buildNode(rootNode)

  // Assign x positions with no overlap
  let leafX = 0
  function assignX(ln: LayoutNode) {
    if (ln.children.length === 0) {
      ln.x = leafX
      leafX += NODE_W + H_GAP
    } else {
      for (const child of ln.children) assignX(child)
      ln.x = (ln.children[0]!.x + ln.children[ln.children.length - 1]!.x) / 2
    }
  }
  assignX(layoutRoot)

  // Assign y by level
  function assignY(ln: LayoutNode, depth: number) {
    ln.y = depth * (NODE_H + V_GAP)
    for (const child of ln.children) assignY(child, depth + 1)
  }
  assignY(layoutRoot, 0)

  // Compute bounds
  let maxX = 0, maxY = 0
  function measure(ln: LayoutNode) {
    if (ln.x + NODE_W > maxX) maxX = ln.x + NODE_W
    if (ln.y + NODE_H > maxY) maxY = ln.y + NODE_H
    for (const child of ln.children) measure(child)
  }
  measure(layoutRoot)

  return { root: layoutRoot, width: maxX, height: maxY }
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function renderEdges(ln: LayoutNode, offsetX: number): React.ReactNode[] {
  const edges: React.ReactNode[] = []

  for (const child of ln.children) {
    const x1 = offsetX + ln.x + NODE_W / 2
    const y1 = ln.y + NODE_H
    const x2 = offsetX + child.x + NODE_W / 2
    const y2 = child.y
    const midY = (y1 + y2) / 2

    edges.push(
      <path
        key={`edge-${ln.node.id}-${child.node.id}`}
        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
        fill="none"
        stroke="var(--ob-border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />,
      ...renderEdges(child, offsetX),
    )
  }

  return edges
}

let globalNodeIndex = 0

function renderNodes(
  ln: LayoutNode,
  offsetX: number,
  selectedId: string | null,
  onSelect: (id: string) => void,
  allNodes: OrgNode[],
): React.ReactNode[] {
  const result: React.ReactNode[] = []

  const idx = allNodes.findIndex((n) => n.id === ln.node.id)
  const color = getNodeColor(ln.node, idx)
  const isRoot = ln.node.level === 0
  const isSelected = selectedId === ln.node.id

  const cx = offsetX + ln.x
  const cy = ln.y

  result.push(
    <g
      key={ln.node.id}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(ln.node.id)}
      role="button"
      aria-label={ln.node.name}
    >
      {/* Shadow */}
      <rect
        x={cx + 2}
        y={cy + 2}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        fill="rgba(0,0,0,0.15)"
      />
      {/* Card */}
      <rect
        x={cx}
        y={cy}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        fill={isSelected ? color : isRoot ? 'var(--ob-navy)' : 'var(--ob-surface)'}
        stroke={isSelected ? color : isRoot ? 'rgba(233,160,16,0.4)' : 'var(--ob-border)'}
        strokeWidth={isSelected ? 2 : 1}
      />
      {/* Color accent left bar */}
      {!isRoot && (
        <rect
          x={cx}
          y={cy + 8}
          width={3}
          height={NODE_H - 16}
          rx={2}
          fill={color}
        />
      )}
      {/* Label */}
      <text
        x={cx + (isRoot ? NODE_W / 2 : 16)}
        y={cy + NODE_H / 2}
        dominantBaseline="middle"
        textAnchor={isRoot ? 'middle' : 'start'}
        fill={isSelected ? '#fff' : isRoot ? '#E9A010' : 'var(--ob-text)'}
        fontSize={12}
        fontWeight={isRoot ? 700 : 500}
        fontFamily="var(--font-sora), sans-serif"
        style={{ userSelect: 'none' }}
      >
        {ln.node.name.length > 18 ? ln.node.name.slice(0, 17) + '…' : ln.node.name}
      </text>
      {/* Level badge for non-root */}
      {!isRoot && (
        <text
          x={cx + NODE_W - 10}
          y={cy + NODE_H / 2}
          dominantBaseline="middle"
          textAnchor="end"
          fill="var(--ob-text-faint)"
          fontSize={10}
          style={{ userSelect: 'none' }}
        >
          N{ln.node.level}
        </text>
      )}
    </g>,
  )

  for (const child of ln.children) {
    result.push(...renderNodes(child, offsetX, selectedId, onSelect, allNodes))
  }

  return result
}

const NODE_COLORS_PALETTE = [
  '#E9A010', '#6366f1', '#22c55e', '#f43f5e',
  '#06b6d4', '#a855f7', '#f97316', '#14b8a6',
]

interface Props {
  networkId: string
  networkName: string
  currentUserRole: string
}

export default function OrgChartClient({ networkId, networkName, currentUserRole }: Props) {
  const [nodes, setNodes] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Edit state
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [deletingNode, setDeletingNode] = useState(false)

  // Add node state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeColor, setNewNodeColor] = useState(NODE_COLORS_PALETTE[1]!)
  const [addingNode, setAddingNode] = useState(false)
  const [addError, setAddError] = useState('')

  const canEdit = ['owner', 'admin'].includes(currentUserRole)

  // Pan & zoom
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 })
  const svgRef = useRef<SVGSVGElement>(null)
  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/networks/${networkId}/org-nodes`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setNodes(data.nodes ?? [])
      })
      .catch(() => setError('Erro ao carregar organograma.'))
      .finally(() => setLoading(false))
  }, [networkId])

  useEffect(() => { load() }, [load])

  async function handleSaveName(nodeId: string) {
    if (!editName.trim()) return
    setSavingName(true)
    const res = await fetch(`/api/networks/${networkId}/org-nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setSavingName(false)
    if (res.ok) {
      setNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, name: editName.trim() } : n))
      setEditingName(false)
    }
  }

  async function handleDeleteNode(nodeId: string) {
    if (!confirm('Remover esta área? Os subitens serão movidos para o nível acima.')) return
    setDeletingNode(true)
    const res = await fetch(`/api/networks/${networkId}/org-nodes/${nodeId}`, { method: 'DELETE' })
    setDeletingNode(false)
    if (res.ok) {
      setSelectedId(null)
      load()
    }
  }

  async function handleAddNode(parentId: string) {
    if (!newNodeName.trim()) return
    setAddingNode(true)
    setAddError('')
    const res = await fetch(`/api/networks/${networkId}/org-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newNodeName.trim(), parentId, color: newNodeColor }),
    })
    const data = await res.json()
    setAddingNode(false)
    if (res.ok) {
      setNewNodeName('')
      setShowAddForm(false)
      load()
    } else {
      setAddError(data.error ?? 'Erro ao adicionar área.')
    }
  }

  const layout = buildLayout(nodes)
  const offsetX = layout.root ? Math.max(0, (layout.root.x < 0 ? -layout.root.x : 0)) : 0

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null
  const selectedChildren = selectedId ? nodes.filter((n) => n.parentId === selectedId) : []

  // Mouse pan
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('[role="button"]')) return
    isPanning.current = true
    lastPan.current = { x: e.clientX, y: e.clientY }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPan.current.x
    const dy = e.clientY - lastPan.current.y
    lastPan.current = { x: e.clientX, y: e.clientY }
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }

  const onMouseUp = () => { isPanning.current = false }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((t) => {
      const next = Math.min(2, Math.max(0.3, t.scale * delta))
      return { ...t, scale: next }
    })
  }

  const resetView = () => setTransform({ x: 40, y: 40, scale: 1 })

  const PADDING = 48
  const svgW = layout.width + PADDING * 2
  const svgH = layout.height + PADDING * 2

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight mb-1"
            style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
          >
            Organograma
          </h1>
          <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
            Estrutura hierárquica de <strong style={{ color: 'var(--ob-text)' }}>{networkName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
            title="Centralizar visão"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M21 3H3v7h18zM21 14H3v7h18z" />
            </svg>
            <span className="hidden sm:inline">Centralizar</span>
          </button>
          <button
            onClick={() => setTransform((t) => ({ ...t, scale: Math.min(2, t.scale + 0.15) }))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
            aria-label="Aproximar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
            </svg>
          </button>
          <button
            onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale - 0.15) }))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
            aria-label="Afastar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M8 11h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: '1px solid var(--ob-border)',
          background: 'var(--ob-surface)',
          height: 520,
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center" style={{ color: 'var(--ob-text-faint)' }}>
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-sm text-center" style={{ color: 'var(--ob-error)' }}>{error}</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3" style={{ color: 'var(--ob-text-faint)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="5" r="3" />
              <circle cx="5" cy="19" r="3" />
              <circle cx="19" cy="19" r="3" />
              <path d="M12 8v4M12 12l-5 4M12 12l5 4" />
            </svg>
            <p className="text-sm">Nenhuma área cadastrada ainda.</p>
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <a
                href="/onboarding"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--ob-amber-dim)' }}
              >
                Ir para onboarding →
              </a>
            )}
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ cursor: isPanning.current ? 'grabbing' : 'grab', display: 'block' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          >
            {/* Dot grid background */}
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="var(--ob-border)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {layout.root && (
                <>
                  <g>{renderEdges(layout.root, offsetX + PADDING)}</g>
                  <g>{renderNodes(layout.root, offsetX + PADDING, selectedId, setSelectedId, nodes)}</g>
                </>
              )}
            </g>
          </svg>
        )}

        {/* Zoom indicator */}
        {!loading && !error && nodes.length > 0 && (
          <div
            className="absolute bottom-4 right-4 rounded-lg px-2 py-1 text-xs font-medium"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-faint)' }}
          >
            {Math.round(transform.scale * 100)}%
          </div>
        )}

        {/* Hint */}
        {!loading && !error && nodes.length > 0 && (
          <div
            className="absolute bottom-4 left-4 rounded-lg px-2 py-1 text-xs"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-faint)' }}
          >
            Scroll para zoom · Arrastar para mover
          </div>
        )}
      </div>

      {/* Selected node panel */}
      {selectedNode && (
        <div
          className="mt-4 rounded-xl p-5 animate-fade-in"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="ob-input flex-1"
                    style={{ height: 36, fontSize: 14 }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName(selectedNode.id)
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    maxLength={80}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveName(selectedNode.id)}
                    disabled={savingName}
                    className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'var(--ob-navy)', color: '#fff' }}
                  >
                    {savingName ? '...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="flex-shrink-0 text-xs transition-all hover:opacity-70"
                    style={{ color: 'var(--ob-text-muted)' }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-base font-semibold"
                      style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                    >
                      {selectedNode.name}
                    </h3>
                    {canEdit && (
                      <button
                        onClick={() => { setEditName(selectedNode.name); setEditingName(true) }}
                        className="flex h-6 w-6 items-center justify-center rounded-md transition-all hover:opacity-70"
                        style={{ color: 'var(--ob-text-faint)' }}
                        aria-label="Renomear"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ob-text-muted)' }}>
                    Nível {selectedNode.level}
                    {selectedChildren.length > 0 && ` · ${selectedChildren.length} subárea${selectedChildren.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canEdit && selectedNode.level > 0 && !editingName && (
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  disabled={deletingNode}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-70 disabled:opacity-40"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                  aria-label="Remover área"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => { setSelectedId(null); setEditingName(false); setShowAddForm(false) }}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-70"
                style={{ background: 'var(--ob-surface-alt)', color: 'var(--ob-text-muted)' }}
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Subareas */}
          {selectedChildren.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--ob-text-muted)' }}>
                Subáreas
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedChildren.map((child) => {
                  const idx = nodes.findIndex((n) => n.id === child.id)
                  const color = getNodeColor(child, idx)
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedId(child.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                    >
                      {child.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add sub-node */}
          {canEdit && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--ob-border)' }}>
              {!showAddForm ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70"
                    style={{ color: 'var(--ob-amber-dim)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar subárea
                  </button>
                  {selectedNode.parentId && (
                    <button
                      onClick={() => setSelectedId(selectedNode.parentId!)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--ob-text-faint)' }}
                    >
                      ↑ Área pai
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--ob-text-muted)' }}>
                    Nova subárea em <strong style={{ color: 'var(--ob-text)' }}>{selectedNode.name}</strong>
                  </p>
                  {addError && (
                    <p className="text-xs" style={{ color: 'var(--ob-error)' }}>{addError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="ob-input flex-1"
                      style={{ height: 36, fontSize: 13 }}
                      placeholder="Ex: Engenharia, Comercial..."
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNode(selectedNode.id)
                        if (e.key === 'Escape') setShowAddForm(false)
                      }}
                      maxLength={80}
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddNode(selectedNode.id)}
                      disabled={addingNode || !newNodeName.trim()}
                      className="flex-shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ background: 'var(--ob-navy)', color: '#fff' }}
                    >
                      {addingNode ? '...' : 'Adicionar'}
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setAddError('') }}
                      className="flex-shrink-0 text-xs transition-all hover:opacity-70"
                      style={{ color: 'var(--ob-text-muted)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>Cor:</span>
                    {NODE_COLORS_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewNodeColor(c)}
                        className="h-5 w-5 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                        style={{
                          background: c,
                          outline: newNodeColor === c ? `2px solid ${c}` : 'none',
                          outlineOffset: 2,
                        }}
                        aria-label={`Cor ${c}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parent link when not showing add form and no canEdit */}
          {!canEdit && selectedNode.parentId && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--ob-border)' }}>
              <button
                onClick={() => setSelectedId(selectedNode.parentId!)}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--ob-amber-dim)' }}
              >
                ↑ Ver área pai
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {!loading && !error && nodes.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: 'var(--ob-navy)', border: '1px solid rgba(233,160,16,0.4)' }} />
            Raiz
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }} />
            Área
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-6" style={{ background: 'var(--ob-border)', borderTop: '1.5px dashed var(--ob-border)' }} />
            Hierarquia
          </div>
          <span className="ml-auto">{nodes.length} {nodes.length === 1 ? 'área' : 'áreas'}</span>
        </div>
      )}
    </div>
  )
}
