import { useQuery } from "@tanstack/react-query";
import type { BillingHealth, BillingHealthStatus } from "@shared/billing-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const messages: Record<BillingHealthStatus, string> = {
  healthy: "Account credentials accepted.",
  invalid_credentials: "Stripe rejected this account's credentials. Replace or renew the credentials for this same merchant account.",
  not_configured: "This account's credentials are missing. Restore access to this merchant account.",
  account_mismatch: "The legacy key belongs to a different merchant account. Restore credentials for the existing legacy account; do not use the main account's key.",
  permission_denied: "Stripe denied permission for the read-only check. Review this account's key permissions.",
  price_invalid: "The configured live monthly price or its product is missing, inactive or incompatible. Check the main account's checkout configuration.",
  provider_unavailable: "Stripe is temporarily unavailable or limiting requests. This does not establish that credentials are invalid; retry shortly.",
  check_failed: "The check could not confirm billing health. Investigate this account's configuration and retry.",
};

export function BillingHealthCard() {
  const { data, isError, isFetching, refetch } = useQuery<BillingHealth>({
    queryKey: ["/api/admin/billing-health"],
    staleTime: 0,
    refetchInterval: 60_000,
  });
  const warning = isError || (data && !data.healthy);
  return (
    <Card className={`mb-6 ${warning ? "border-amber-500" : ""}`}>
      <CardHeader>
        <CardTitle>Billing health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError ? (
          <p role="alert">Billing health could not be loaded. The current status is unknown; retry shortly.</p>
        ) : data ? (
          <div role={data.healthy ? "status" : "alert"} className="space-y-2">
            <p className="font-semibold">{data.healthy ? "Billing checks passed" : "Billing needs attention"}</p>
            {data.accounts.map((account) => (
              <p key={account.account}>
                <strong>{account.account === "primary" ? "Main account (new checkouts)" : "Legacy account (existing subscribers)"}: </strong>
                {messages[account.status]}
              </p>
            ))}
            <p className="text-sm text-muted-foreground">Last checked: {new Date(data.checkedAt).toLocaleString()}</p>
          </div>
        ) : <p role="status">Checking billing health…</p>}
        <p className="text-sm text-muted-foreground">
          Read-only checks only. No charges, account switching or changes to customer access.
          Main-account checks include the configured live monthly price. Results are cached for up to one minute.
        </p>
        {!isError && data?.accounts.some((a) => a.account === "legacy" && a.status !== "healthy") && (
          <p className="text-sm">
            For production, set the legacy account's key in the PLANWISE_STRIPE_LEGACY_SECRET secret.
            Keep PLANWISE_STRIPE_SECRET for the main account. Never paste keys into chat.
          </p>
        )}
        <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? "Checking…" : "Check again"}
        </Button>
      </CardContent>
    </Card>
  );
}
