import { useState } from "react";
import MagneticButton from "./component";

export default function MagneticButtonDemo() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const send = () => {
    setState("sending");
    window.setTimeout(() => setState("sent"), 1600);
    window.setTimeout(() => setState("idle"), 3600);
  };

  return (
    <div className="flex flex-col items-center gap-14 py-4">
      <MagneticButton>Hover me</MagneticButton>

      <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-10">
        <MagneticButton variant="outline" radius={40} loading={state === "sending"} onClick={send}>
          {state === "sent" ? "Sent ✓" : "Send"}
        </MagneticButton>
        <MagneticButton radius={40} disabled>
          Disabled
        </MagneticButton>
      </div>
    </div>
  );
}
