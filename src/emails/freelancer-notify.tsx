import { Body, Container, Head, Html, Preview, Text } from "@react-email/components";

type Props = {
  freelancerName: string;
  clientName: string;
  amountFormatted: string;
  daysOverdue: number;
  tone: "polite" | "firm" | "final";
};

export function FreelancerNotifyEmail({ freelancerName, clientName, amountFormatted, daysOverdue, tone }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nudged {clientName} ({tone}, {daysOverdue}d overdue)</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "-apple-system, system-ui, sans-serif", padding: "32px 0", margin: 0 }}>
        <Container style={{ backgroundColor: "#ffffff", border: "1px solid #eaeaea", borderRadius: 12, maxWidth: 480, margin: "0 auto", padding: 28 }}>
          <Text style={{ fontSize: 16, color: "#111", margin: "0 0 12px" }}>Hi {freelancerName},</Text>
          <Text style={{ fontSize: 14, lineHeight: "1.6", color: "#333", margin: 0 }}>
            We just sent a <strong>{tone}</strong> reminder to <strong>{clientName}</strong> about the
            <strong> {amountFormatted}</strong> invoice ({daysOverdue} days overdue).
          </Text>
          <Text style={{ fontSize: 12, color: "#999", marginTop: 16 }}>Logged in your nudge history.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function freelancerNotifySubject(clientName: string) {
  return `Nudged ${clientName} for you`;
}
