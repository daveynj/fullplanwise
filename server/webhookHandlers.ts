import { getStripeSync } from './stripeClient';
import { handleSubscriptionWebhookEvent } from './subscription-sync';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    // Verifies the signature (throws if invalid) and mirrors the event into
    // the stripe schema tables.
    await sync.processWebhook(payload, signature);

    // Signature verified: keep the user's PlanWise subscription tier in step
    // with Stripe. Not awaited so Stripe gets its 200 straight away.
    let event: any;
    try {
      event = JSON.parse(payload.toString('utf8'));
    } catch {
      return;
    }
    void handleSubscriptionWebhookEvent(event);
  }
}
