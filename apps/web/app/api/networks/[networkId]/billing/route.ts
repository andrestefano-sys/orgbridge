import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, networks, subscriptions } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import Stripe from 'stripe'

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  }
  return _stripe
}
const stripe = new Proxy({} as Stripe, { get(_, prop) { return (getStripe() as any)[prop] } })

// Plan → Stripe Price ID mapping (configured per environment)
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  starter:    process.env.STRIPE_PRICE_STARTER,
  business:   process.env.STRIPE_PRICE_BUSINESS,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
}

const PLAN_LABELS: Record<string, string> = {
  free:       'Free',
  starter:    'Starter',
  business:   'Business',
  enterprise: 'Enterprise',
}

const PLAN_LIMITS: Record<string, number | null> = {
  free:       10,
  starter:    50,
  business:   200,
  enterprise: null,
}

interface Params {
  params: Promise<{ networkId: string }>
}

// ── GET — return current subscription details ──────────────────
export async function GET(_req: NextRequest, { params }: Params) {
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
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.networkId, networkId),
    })

    const plan = sub?.plan ?? 'free'

    return NextResponse.json({
      subscription: sub
        ? {
            plan,
            planLabel: PLAN_LABELS[plan] ?? plan,
            memberLimit: PLAN_LIMITS[plan] ?? null,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
            stripeCustomerId: sub.stripeCustomerId,
            stripeSubscriptionId: sub.stripeSubscriptionId,
          }
        : {
            plan: 'free',
            planLabel: 'Free',
            memberLimit: PLAN_LIMITS.free,
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          },
    })
  } catch (err) {
    console.error('[GET billing]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// ── POST — create checkout session or portal session ───────────
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
    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Apenas o dono da rede pode gerenciar a assinatura.' }, { status: 403 })
    }

    const network = await db.query.networks.findFirst({
      where: eq(networks.id, networkId),
    })
    if (!network) {
      return NextResponse.json({ error: 'Rede não encontrada.' }, { status: 404 })
    }

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.networkId, networkId),
    })

    const { action, plan } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // ── Checkout: upgrade from free or change plan ─────────────
    if (action === 'checkout') {
      const priceId = PLAN_PRICE_IDS[plan as string]
      if (!priceId) {
        return NextResponse.json({ error: 'Plano inválido ou não configurado.' }, { status: 400 })
      }

      // Ensure or create Stripe customer
      let customerId = sub?.stripeCustomerId ?? undefined
      if (!customerId) {
        const customerData: Stripe.CustomerCreateParams = {
          name: network.name,
          metadata: { networkId, userId: session.user.id },
        }
        if (session.user.email) customerData.email = session.user.email
        const customer = await stripe.customers.create(customerData)
        customerId = customer.id

        // Upsert subscription row with customer ID
        if (sub) {
          await db.update(subscriptions).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(subscriptions.id, sub.id))
        } else {
          await db.insert(subscriptions).values({
            networkId,
            stripeCustomerId: customerId,
            plan: 'free',
            status: 'active',
          })
        }
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing?success=1`,
        cancel_url: `${appUrl}/billing?canceled=1`,
        metadata: { networkId },
        subscription_data: { metadata: { networkId } },
        allow_promotion_codes: true,
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // ── Portal: manage existing subscription ───────────────────
    if (action === 'portal') {
      const customerId = sub?.stripeCustomerId
      if (!customerId) {
        return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 400 })
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/billing`,
      })

      return NextResponse.json({ url: portalSession.url })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (err) {
    console.error('[POST billing]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
