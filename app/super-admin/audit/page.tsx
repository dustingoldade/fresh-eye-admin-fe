import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Audit"
      blurb="Cross-tenant audit — login history, super admin access log, sensitive-action trace (tenant impersonation, model promotion, data export)."
      bullets={[
        "Login audit (all tenants)",
        "Super admin action trace",
        "Impersonation history",
        "Data export events",
      ]}
    />
  );
}
