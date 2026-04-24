import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Cost / usage"
      blurb="Infra spend broken down by vendor × tenant. Unit economics (cost per inspected pallet) and margin view."
      bullets={[
        "Monthly spend by vendor",
        "Per-tenant metering",
        "$/pallet trend",
        "Forecast vs. budget",
      ]}
    />
  );
}
