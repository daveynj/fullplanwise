/** API helpers retain status + raw response for other callers. Only the signup
 * form needs this safe, human-readable extraction (no global error changes).
 */
export function registrationErrorMessage(error: Error): string {
  const message = error.message.replace(/^\d{3}:\s*/, "");
  try {
    const parsed = JSON.parse(message);
    if (typeof parsed?.message === "string" && parsed.message.trim()) return parsed.message;
  } catch { /* Plain network errors are not JSON. */ }
  if (message.startsWith("{") || message.startsWith("<")) {
    return "We couldn't create your account. Please try again later.";
  }
  return message || "We couldn't create your account. Please try again later.";
}
