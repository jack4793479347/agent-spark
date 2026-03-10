import { NextRequest, NextResponse } from 'next/server';
import { getStripe, handleStripeWebhook } from '@/lib/billing/engine';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Signature verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleStripeWebhook(event);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook handler error:', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
