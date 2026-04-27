import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Performance"
      blurb="Cross-SKU aggregate dashboards — compare reject-rate trends, required-mitigation patterns, low-confidence volume across SKUs in one view."
      bullets={[
        "Stacked reject-rate trends per SKU",
        "Required-mitigation heatmap (model vs operator)",
        "Per-stage model latency p50/p95/p99",
        "Correlation between count mismatch and reject rate",
      ]}
    />
  );
}
