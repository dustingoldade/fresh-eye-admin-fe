import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Operators"
      blurb="Operator roster and per-operator performance — accept/reject rates, speed, agreement with model over time, active hours."
      bullets={[
        "Team member list with roles",
        "Invite / remove member flow (tenant admin)",
        "Per-operator accept/reject distribution",
        "Required-mitigation history for QA",
      ]}
    />
  );
}
