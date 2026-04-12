import { NextRequest, NextResponse } from 'next/server'
import { db, subscriptions, networkMembers, networks } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { sendPaymentFailedEmail } from '@orgbridge/email'

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

// Must be raw body — disable Next.js body parsing
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ── Subscription created or updated ──────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const networkId = sub.metadata?.networkId
        if (!networkId) break

        const priceId = sub.items.data[0]?.price.id
        const plan = resolvePlan(priceId)

        await db
          .insert(subscriptions)
          .values({
            networkId,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            plan,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          })
          .onConflictDoUpdate({
            target: subscriptions.networkId,
            set: {
              stripeCustomerId: sub.customer as string,
              stripeSubscriptionId: sub.id,
              plan,
              status: sub.status,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              updatedAt: new Date(),
            },
          })
        break
      }

      // ── Subscription cancelled ────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const networkId = sub.metadata?.networkId
        if (!networkId) break

        await db
          .update(subscriptions)
          .set({ plan: 'free', status: 'canceled', stripeSubscriptionId: null, updatedAt: new Date() })
          .where(eq(subscriptions.networkId, networkId))
        break
      }

      // ── Payment succeeded ─────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription as string | null
        if (!subId) break

        await db
          .update(subscriptions)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, subId))
        break
      }

      // ── Payment failed — notify owner ─────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const sub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeCustomerId, customerId),
        })
        if (!sub) break

        await db
          .update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id))

        // Notify the network owner by email
        const [owner, network] = await Promise.all([
          db.query.networkMembers.findFirst({
            where: and(
              eq(networkMembers.networkId, sub.networkId),
              eq(networkMembers.role, 'owner'),
              eq(networkMembers.status, 'active'),
            ),
            with: { user: { columns: { email: true, name: true } } },
          }),
          db.query.networks.findFirst({ where: eq(networks.id, sub.networkId) }),
        ])

        if (owner) {
          const networkName = network?.name ?? 'sua rede'
          await sendPaymentFailedEmail((owner as any).user.email, networkName).catch(console.error)
        }
        break
      }

      // ── Checkout completed — link session to subscription ─────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const networkId = session.metadata?.networkId
        if (!networkId || session.mode !== 'subscription') break

        // The subscription.created event will handle the DB update.
        // Just ensure customer ID is persisted if not already.
        const customerId = session.customer as string
        const existing = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.networkId, networkId),
        })
        if (existing && !existing.stripeCustomerId) {
          await db
            .update(subscriptions)
            .set({ stripeCustomerId: customerId, updatedAt: new Date() })
            .where(eq(subscriptions.id, existing.id))
        }
        break
      }

      default:
        // Unhandled event — ignore
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook] handler error', err)
    return NextResponse.json({ error: 'Erro ao processar evento.' }, { status: 500 })
  }
}

// ── Helpers ────────────────────────────────────────────────────
function resolvePlan(priceId: string | undefined): string {
  if (!priceId) return 'free'
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER ?? '']:    'starter',
    [process.env.STRIPE_PRICE_BUSINESS ?? '']:   'business',
    [process.env.STRIPE_PRICE_ENTERPRISE ?? '']: 'enterprise',
  }
  return map[priceId] ?? 'starter'
}
