import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networks, networkMembers, orgNodes } from '@orgbridge/db'
import { eq } from 'drizzle-orm'

const SLUG_REGEX = /^[a-z0-9-]+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user already owns a network
    const existing = await db.query.networks.findFirst({
      where: eq(networks.ownerId, userId),
    })
    if (existing) {
      return NextResponse.json({ error: 'Você já possui uma rede criada.', network: existing }, { status: 409 })
    }

    const body = await req.json()
    const { name, slug: rawSlug, industry, country, type, description } = body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Nome da rede deve ter entre 2 e 100 caracteres.' }, { status: 400 })
    }

    // Validate / derive slug
    const slug = rawSlug ? String(rawSlug).toLowerCase().trim() : slugify(name)
    if (!slug || !SLUG_REGEX.test(slug) || slug.length < 2 || slug.length > 60) {
      return NextResponse.json({ error: 'Identificador inválido. Use apenas letras minúsculas, números e hífens.' }, { status: 400 })
    }

    // Validate type
    if (type && !['vertical', 'horizontal'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
    }

    // Create network + owner member + root org node in a logical sequence
    // (Neon HTTP doesn't support true transactions, but these are tightly coupled inserts)
    let insertedNetwork: typeof networks.$inferSelect | undefined

    try {
      const [inserted] = await db.insert(networks).values({
        name: name.trim(),
        slug,
        industry: industry?.trim() || null,
        country: country?.trim() || null,
        type: type || 'vertical',
        description: description?.trim() || null,
        ownerId: userId,
        status: 'active',
      }).returning()

      insertedNetwork = inserted
    } catch (err: unknown) {
      if (err instanceof Error && err.message.toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'Este identificador já está em uso. Escolha outro.' }, { status: 409 })
      }
      throw err
    }

    if (!insertedNetwork) {
      return NextResponse.json({ error: 'Erro ao criar rede.' }, { status: 500 })
    }

    const network = insertedNetwork

    // Create root org node
    const [rootNode] = await db.insert(orgNodes).values({
      networkId: network.id,
      parentId: null,
      name: name.trim(),
      level: 0,
      position: 0,
    }).returning()

    if (!rootNode) {
      return NextResponse.json({ error: 'Erro ao criar organograma.' }, { status: 500 })
    }

    // Add owner as member with 'owner' role
    await db.insert(networkMembers).values({
      networkId: network.id,
      userId,
      role: 'owner',
      status: 'active',
      orgNodeId: rootNode.id,
      joinedAt: new Date(),
    })

    return NextResponse.json({ network, rootNode }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/networks]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const userId = session.user.id

    const userNetworks = await db.query.networkMembers.findMany({
      where: eq(networkMembers.userId, userId),
      with: { network: true },
    })

    return NextResponse.json({ networks: userNetworks.map((m) => m.network) })
  } catch (err) {
    console.error('[GET /api/networks]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
