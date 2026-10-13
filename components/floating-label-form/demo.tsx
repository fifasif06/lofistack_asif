import FloatingLabelForm, { type FormField } from "./component";

const FIELDS: FormField[] = [
  { name: "name", label: "Your name", autoComplete: "name", requiredMessage: "Please tell us your name." },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    requiredMessage: "We need an email to reply to.",
  },
  { name: "subject", label: "Subject", optional: true },
  { name: "message", label: "Message", multiline: true },
];

// Without `onSend` the form pretends to send (1.2 s). A real one throws when the request fails:
//   onSend={async (values, signal) => {
//     const res = await fetch("/api/contact", { method: "POST", body: JSON.stringify(values), signal });
//     if (!res.ok) throw new Error(res.statusText);
//   }}

export default function FloatingLabelFormDemo() {
  return (
    <FloatingLabelForm
      fields={FIELDS}
      maxMessage={500}
      minMessage={10}
      successTitle={(v) => `Thanks, ${v.name}. Message sent.`}
      successText={(v) => `We'll reply to ${v.email} within a day.`}
    />
  );
}
