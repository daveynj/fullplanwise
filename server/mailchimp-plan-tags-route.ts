import type { Express } from "express";
import type { PlanTagResult } from "./mailchimp-plan-tags";

/**
 * Admin-only: re-applies the Mailchimp "Unlimited" tag for every paying or
 * previously-paying account right now and returns the counts.
 *
 * The scheduled subscription sync also does this, but on Replit autoscale it
 * can be skipped at start-up (it runs at most once every few hours across all
 * servers) and its timers don't fire while the app is scaled down. This lets
 * an admin run the tag sync on demand after a deploy and see the result.
 */
export function registerMailchimpPlanTagsRoute(
  app: Express,
  getUser: (id: number) => Promise<{ isAdmin: boolean | null } | undefined>,
  isConnected: () => boolean,
  sync: () => Promise<PlanTagResult | null>,
) {
  app.post("/api/admin/mailchimp/sync-plan-tags", async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      // Re-read permissions rather than trusting a potentially stale session.
      const user = await getUser(req.user.id);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin privileges required" });
      if (!isConnected()) {
        return res.status(503).json({ message: "Mailchimp isn't connected on this server (missing or invalid credentials)." });
      }
      const result = await sync();
      if (!result) return res.status(503).json({ message: "The tag sync failed. Check the server logs for [MailchimpPlanTags]." });
      return res.json(result);
    } catch {
      return res.status(503).json({ message: "The tag sync failed. Check the server logs for [MailchimpPlanTags]." });
    }
  });
}
