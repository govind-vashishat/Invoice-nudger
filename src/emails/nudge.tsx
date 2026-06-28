import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type NudgeTone = "polite" | "firm" | "final";

type Props = {
  tone: NudgeTone;
  clientName: string;
  amountFormatted: string;
  daysOverdue: number;
  payNowUrl: string | null;
  senderName: string;
};

const COPY: Record<
  NudgeTone,
  { subject: (a: string, d: number) => string; intro: string; closing: string; cta: string }
> = {
  polite: {
    subject: (a, d) => `Friendly reminder: ${a} invoice (${d}d overdue)`,
    intro:
      "Hope you're doing well. Just a friendly reminder that the invoice below is past due — whenever you have a moment, you can settle it with the link below.",
    closing: "Thanks so much, and let me know if you need anything from my end.",
    cta: "Pay invoice",
  },
  firm: {
    subject: (a, d) => `Invoice for ${a} is ${d} days overdue`,
    intro:
      "Following up on the invoice below, which is now past due. Please arrange payment at your earliest convenience using the link below.",
    closing: "If there's an issue holding things up, please let me know.",
    cta: "Pay now",
  },
  final: {
    subject: (a, d) => `Final notice: ${a} invoice, ${d} days overdue`,
    intro:
      "This is a final notice for the invoice below. Please settle the amount immediately using the link below to avoid further follow-up.",
    closing: "If payment has already been sent, please disregard this message.",
    cta: "Pay immediately",
  },
};

export function NudgeEmail({
  tone,
  clientName,
  amountFormatted,
  daysOverdue,
  payNowUrl,
  senderName,
}: Props) {
  const copy = COPY[tone];
  const previewText = copy.subject(amountFormatted, daysOverdue);

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.greeting}>Hi {clientName},</Text>
          <Text style={styles.paragraph}>{copy.intro}</Text>

          <Section style={styles.card}>
            <Text style={styles.cardLabel}>Amount due</Text>
            <Text style={styles.cardAmount}>{amountFormatted}</Text>
            <Text style={styles.cardMeta}>{daysOverdue} days overdue</Text>
          </Section>

          {payNowUrl && (
            <Section style={styles.ctaWrap}>
              <Button href={payNowUrl} style={styles.button}>
                {copy.cta}
              </Button>
            </Section>
          )}

          <Text style={styles.paragraph}>{copy.closing}</Text>

          <Hr style={styles.hr} />
          <Text style={styles.signature}>
            {senderName}
            <br />
            <span style={styles.muted}>Sent via Invoice Nudger</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function nudgeSubject(tone: NudgeTone, amountFormatted: string, daysOverdue: number) {
  return COPY[tone].subject(amountFormatted, daysOverdue);
}

const styles = {
  body: { backgroundColor: "#fafafa", fontFamily: "-apple-system, system-ui, sans-serif", padding: "32px 0", margin: 0 },
  container: { backgroundColor: "#ffffff", border: "1px solid #eaeaea", borderRadius: 12, maxWidth: 520, margin: "0 auto", padding: 32 },
  greeting: { fontSize: 16, color: "#111", margin: "0 0 16px" },
  paragraph: { fontSize: 14, lineHeight: "1.6", color: "#333", margin: "0 0 16px" },
  card: { backgroundColor: "#f7f7f7", borderRadius: 8, padding: "16px 20px", margin: "20px 0" },
  cardLabel: { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#888", margin: "0 0 4px" },
  cardAmount: { fontSize: 24, fontWeight: 600, color: "#111", margin: 0 },
  cardMeta: { fontSize: 12, color: "#a16207", margin: "4px 0 0" },
  ctaWrap: { textAlign: "center" as const, margin: "24px 0 16px" },
  button: { backgroundColor: "#111", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", display: "inline-block" },
  hr: { borderColor: "#eaeaea", margin: "24px 0 16px" },
  signature: { fontSize: 13, color: "#555", margin: 0 },
  muted: { color: "#999", fontSize: 12 },
};
