export type BillingHealthStatus =
  | "healthy"
  | "invalid_credentials"
  | "not_configured"
  | "account_mismatch"
  | "permission_denied"
  | "price_invalid"
  | "provider_unavailable"
  | "check_failed";

export interface BillingAccountHealth {
  account: "primary" | "legacy";
  status: BillingHealthStatus;
}

export interface BillingHealth {
  checkedAt: string;
  healthy: boolean;
  accounts: BillingAccountHealth[];
}
