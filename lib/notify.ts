import "server-only";

// Stub notifier: logs instead of sending real email. Swap for Resend/Nodemailer
// later without touching call sites — every caller just awaits notify(...).
export async function notify(event: string, details: Record<string, unknown>) {
  console.log(`[notify] ${event}`, details);
}
