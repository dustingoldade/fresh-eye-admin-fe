import { StubPage } from "@/components/ui/stub-page";

export default function Page() {
  return (
    <StubPage
      title="Settings"
      blurb="Tenant configuration — audio mode defaults, confidence thresholds, retention window, TTS voice, alert thresholds."
      bullets={[
        "Audio cue mode (continuous / alert-only)",
        "Low-confidence threshold per stage",
        "Frame storage retention window",
        "TTS voice + language",
        "Alert threshold configuration (out of scope v1)",
      ]}
    />
  );
}
