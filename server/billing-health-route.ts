import type { Express } from "express";
import type { BillingHealth } from "@shared/billing-health";

export function registerBillingHealthRoute(
  app: Express,
  getUser: (id: number) => Promise<{ isAdmin: boolean | null } | undefined>,
  check: () => Promise<BillingHealth>,
) {
  app.get("/api/admin/billing-health", async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    res.vary("Cookie");
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      // Re-read permissions rather than trusting a potentially stale session.
      const user = await getUser(req.user.id);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin privileges required" });
      return res.json(await check());
    } catch {
      return res.status(503).json({ message: "Billing health check unavailable. Try again shortly." });
    }
  });
}
