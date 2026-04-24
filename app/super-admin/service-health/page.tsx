import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Service health"
      blurb="Platform-wide systems view — uptime, p95 latency per tenant, error rates, circuit breaker trips, queue depths."
      bullets={[
        "Per-vendor uptime + p95 latency (Roboflow, Supabase, TTS)",
        "Per-tenant request rates and error %",
        "Circuit breaker status + trip history",
      ]}
    />
  );
}
