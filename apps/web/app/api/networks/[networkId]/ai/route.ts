import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, networks, orgNodes, posts, users } from '@orgbridge/db'
import { and, count, desc, eq } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

interface Params {
  params: Promise<{ networkId: string }>
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_MESSAGES = 20

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!member) {
      return NextResponse.json({ error: 'Sem acesso a esta rede.' }, { status: 403 })
    }

    const body = await req.json()
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? []

    if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 })
    }

    // Trim to last N messages to keep context manageable
    const trimmed = messages.slice(-MAX_MESSAGES)

    // ── Build network context ─────────────────────────────────
    const [network, nodes, memberCount, recentPosts] = await Promise.all([
      db.query.networks.findFirst({
        where: eq(networks.id, networkId),
        columns: { id: true, name: true, industry: true, country: true, description: true, type: true },
      }),
      db.query.orgNodes.findMany({
        where: eq(orgNodes.networkId, networkId),
        columns: { id: true, name: true, level: true, parentId: true },
        orderBy: (t, { asc }) => [asc(t.level), asc(t.position)],
      }),
      db.select({ count: count() }).from(networkMembers)
        .where(and(eq(networkMembers.networkId, networkId), eq(networkMembers.status, 'active'))),
      db.query.posts.findMany({
        where: and(eq(posts.networkId, networkId), eq(posts.status, 'published')),
        orderBy: [desc(posts.createdAt)],
        limit: 15,
        columns: { id: true, content: true, type: true, createdAt: true },
        with: {
          author: { columns: { name: true } },
          recognizedUser: { columns: { name: true } },
        },
      }),
    ])

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, jobTitle: true },
    })

    // Build org chart text
    function buildOrgText(parentId: string | null, indent = 0): string {
      const children = nodes.filter((n) => n.parentId === parentId)
      return children.map((n) => {
        const prefix = '  '.repeat(indent) + (indent > 0 ? '└─ ' : '• ')
        return prefix + n.name + buildOrgText(n.id, indent + 1)
      }).join('\n')
    }

    const orgText = buildOrgText(null) || '(sem áreas definidas)'

    const postsText = recentPosts.length === 0
      ? '(nenhuma publicação ainda)'
      : recentPosts.map((p) => {
          const date = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          const typeLabel = { text: 'Publicação', recognition: 'Reconhecimento', announcement: 'Comunicado', document: 'Documento' }[p.type] ?? p.type
          const who = p.author?.name ?? 'Membro'
          const recognized = p.type === 'recognition' && p.recognizedUser ? ` → ${p.recognizedUser.name}` : ''
          return `[${date}] ${typeLabel} por ${who}${recognized}: "${p.content.slice(0, 120)}${p.content.length > 120 ? '…' : ''}"`
        }).join('\n')

    const systemPrompt = `Você é o assistente de IA da rede corporativa "${network?.name ?? 'OrgBridge'}". Você tem acesso ao contexto atual da organização e responde perguntas em português do Brasil de forma clara, precisa e útil.

## Rede: ${network?.name}
- Setor: ${network?.industry ?? 'não informado'}
- País: ${network?.country ?? 'não informado'}
- Estrutura: ${network?.type === 'vertical' ? 'Hierárquica (vertical)' : 'Horizontal'}
- Descrição: ${network?.description ?? 'não informada'}
- Total de membros ativos: ${memberCount[0]?.count ?? 0}

## Organograma (áreas):
${orgText}

## Publicações recentes (últimas ${recentPosts.length}):
${postsText}

## Usuário atual:
- Nome: ${currentUser?.name ?? session.user.name ?? 'Membro'}
- Cargo: ${currentUser?.jobTitle ?? 'não informado'}
- Função na rede: ${member.role}

## Instruções:
- Responda SEMPRE em português do Brasil
- Seja direto e objetivo
- Use dados reais do contexto acima quando relevante
- Se a pergunta não tiver resposta nos dados disponíveis, diga claramente
- Não invente dados, membros ou posts que não existem no contexto
- Pode ajudar com: resumos de atividade, informações sobre a estrutura, quem publicou o quê, tendências do feed, etc.`

    // Stream response
    const stream = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: trimmed,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/ai]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
