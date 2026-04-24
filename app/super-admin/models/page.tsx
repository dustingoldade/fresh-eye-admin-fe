import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Model management"
      blurb="Per-tenant model chain config (SKU classifier / item counter / defect detector), model registry, upload flow, version history with rollback."
      bullets={[
        "3-slot chain config per tenant",
        "Model registry with all versions",
        "Upload new model version",
        "Promote / demote / rollback",
        "Per-version performance summary",
      ]}
    />
  );
}
