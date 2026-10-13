import OtpInput from "./component";

const SENT_TO = "••• ••• 4821";

// Without `verify` the built-in demo check accepts this code. In your app, ask your server instead:
//   verify={(code, signal) => fetch("/api/otp/verify", { method: "POST", body: code, signal }).then((r) => r.ok)}
const DEMO_CODE = "246810";

export default function OtpInputDemo() {
  return <OtpInput length={6} resendSeconds={30} sentTo={SENT_TO} demoCode={DEMO_CODE} />;
}
