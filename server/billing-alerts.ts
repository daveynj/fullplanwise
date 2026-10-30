import { randomUUID } from "node:crypto";
import type { BillingAccountHealth, BillingHealth, BillingHealthStatus } from "@shared/billing-health";

type Account = BillingAccountHealth["account"];
type Observation = { confirmed: BillingHealthStatus; candidate: BillingHealthStatus; count: number };
export interface BillingAlert {
  id: string;
  type: "billing_health.failure" | "billing_health.recovery";
  account: Account;
  previousStatus: BillingHealthStatus;
  status: BillingHealthStatus;
  category: "credentials" | "provider_outage" | "configuration" | "unknown" | "recovery";
  confirmedAt: string;
}
export interface BillingAlertState {
  observedAt?: number;
  accounts: Partial<Record<Account, Observation>>;
  pending: BillingAlert[];
}
export interface AlertSession {
  now: number;
  read(): Promise<BillingAlertState>;
  write(state: BillingAlertState): Promise<void>;
}
export interface BillingAlertStore {
  exclusive(work: (session: AlertSession) => Promise<void>): Promise<void>;
}

// Longer than the monitor's cache, so concurrent autoscale observations cannot
// confirm one failure. Slightly below the scheduler interval to allow jitter.
export const ALERT_OBSERVATION_GAP_MS = 4 * 60_000;

function category(status: BillingHealthStatus): BillingAlert["category"] {
  if (status === "healthy") return "recovery";
  if (status === "invalid_credentials" || status === "permission_denied") return "credentials";
  if (status === "provider_unavailable") return "provider_outage";
  if (status === "check_failed") return "unknown";
  return "configuration";
}

export function createBillingAlertProcessor(
  store: BillingAlertStore,
  deliver: (event: BillingAlert) => Promise<void>,
  report: (message: string) => void = console.warn,
) {
  return async (health: BillingHealth) => {
    try {
      await store.exclusive(async (session) => {
        const state = await session.read();
        if (state.observedAt === undefined || session.now - state.observedAt >= ALERT_OBSERVATION_GAP_MS) {
          for (const { account, status } of health.accounts) {
            const observation = state.accounts[account] ?? { confirmed: "healthy", candidate: "healthy", count: 0 };
            observation.count = observation.candidate === status ? Math.min(2, observation.count + 1) : 1;
            observation.candidate = status;
            if (observation.count >= 2 && observation.confirmed !== status) {
              state.pending.push({
                id: randomUUID(),
                type: status === "healthy" ? "billing_health.recovery" : "billing_health.failure",
                account, previousStatus: observation.confirmed, status,
                category: category(status), confirmedAt: new Date(session.now).toISOString(),
              });
              observation.confirmed = status;
            }
            state.accounts[account] = observation;
          }
          state.observedAt = session.now;
          // Durably enqueue BEFORE attempting delivery. A failed delivery must
          // not erase a confirmed transition or suppress its later recovery.
          await session.write(state);
        }
        // Preserve event order, including recovery after an undelivered failure.
        // Bound network time under the cross-instance lock.
        for (let i = 0; state.pending.length && i < 10; i++) {
          try {
            await deliver(state.pending[0]);
          } catch {
            report("[BillingHealth] Alert delivery failed; queued for retry");
            break;
          }
          state.pending.shift();
          await session.write(state);
        }
      });
    } catch {
      // Never log DB/provider/destination errors: they can contain credentials.
      report("[BillingHealth] Alert state could not be processed; will retry");
    }
  };
}

/** A generic JSON receiver, not a provider-specific Slack/Discord payload. */
export function createBillingWebhookDelivery(url: string, send: typeof fetch = fetch) {
  const destination = new URL(url);
  if (destination.protocol !== "https:" || destination.username || destination.password || destination.hash) {
    throw new Error("Billing alert destination must be an HTTPS URL without userinfo or a fragment");
  }
  return async (event: BillingAlert) => {
    const response = await send(destination, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": event.id },
      body: JSON.stringify(event),
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    // Never read or log the receiver's response body.
    await response.body?.cancel();
    if (!response.ok) throw new Error("Billing alert delivery was not accepted");
  };
}

let productionProcessor: ReturnType<typeof createBillingAlertProcessor> | undefined;
let warned = false;
export async function processBillingAlerts(health: BillingHealth, report: (message: string) => void) {
  const url = process.env.BILLING_ALERT_WEBHOOK_URL;
  if (!url) {
    if (!warned) report("[BillingHealth] External alerts disabled: BILLING_ALERT_WEBHOOK_URL is not configured");
    warned = true;
    return;
  }
  try {
    if (!productionProcessor) {
      const deliver = createBillingWebhookDelivery(url);
      const { billingAlertStore } = await import("./billing-alert-store");
      productionProcessor = createBillingAlertProcessor(billingAlertStore, deliver, report);
    }
    await productionProcessor(health);
  } catch {
    report("[BillingHealth] Alert configuration or initialization failed; will retry");
  }
}
