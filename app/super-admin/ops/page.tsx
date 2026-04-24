import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Ops actions"
      blurb="Cross-tenant operations — provision new tenants, suspend access, migrate data between regions, promote models to multiple tenants at once."
      bullets={[
        "Create / suspend / delete tenant",
        "Migrate tenant to different region",
        "Cross-tenant model promotion (A/B)",
        "Backfill + reprocess utilities",
      ]}
    />
  );
}
