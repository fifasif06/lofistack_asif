// Spec-first tests for FloatingLabelForm: written from prompt.md and the FloatingLabelFormProps JSDoc.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FloatingLabelForm, { type FloatingLabelFormProps, type FormValues } from "./component";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

type Send = (values: FormValues, signal: AbortSignal) => Promise<void>;

/** A send that stays pending until the test resolves or rejects it. */
function deferredSend() {
  let resolve: () => void = () => {};
  let reject: (e: Error) => void = () => {};
  const calls: { values: FormValues; signal: AbortSignal }[] = [];
  const onSend = vi.fn<Send>((values, signal) => {
    calls.push({ values, signal });
    return new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
  });
  return { onSend, calls, resolve: () => resolve(), reject: (e: Error) => reject(e) };
}

const renderForm = (props: Partial<FloatingLabelFormProps> = {}) => {
  const user = userEvent.setup();
  return { user, ...render(<FloatingLabelForm {...props} />) };
};

const nameInput = () => screen.getByLabelText(/Your name/);
const emailInput = () => screen.getByLabelText(/Email/);
const subjectInput = () => screen.getByLabelText(/Subject/);
const messageInput = () => screen.getByLabelText(/Message/);
const submit = () => screen.getByRole("button", { name: "Send message" });
/** The innermost element whose text (possibly split over child spans) matches. */
const byJoinedText = (re: RegExp) =>
  screen.getAllByText((_, el) => !!el && re.test(el.textContent ?? "") && Array.from(el.children).every((c) => !re.test(c.textContent ?? "")));

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(nameInput(), "  Ada  ");
  await user.type(emailInput(), "ada@example.com");
  await user.type(messageInput(), "Hello there, lovely radio!");
}

describe("FloatingLabelForm — fields", () => {
  it("is a form named “Contact form” with the four default fields and real labels", () => {
    renderForm();
    expect(screen.getByRole("form", { name: "Contact form" })).toBeInTheDocument();
    expect(nameInput().tagName).toBe("INPUT");
    expect(emailInput()).toHaveAttribute("type", "email");
    expect(subjectInput()).toBeInTheDocument();
    expect(messageInput().tagName).toBe("TEXTAREA");
  });

  it("marks optional fields with “(optional)” in the label", () => {
    renderForm();
    expect(screen.getByLabelText("Subject (optional)")).toBeInTheDocument();
  });

  it("uses placeholder=\" \" (for the CSS-only float) and the autoComplete hints", () => {
    renderForm();
    for (const el of [nameInput(), emailInput(), subjectInput(), messageInput()]) expect(el).toHaveAttribute("placeholder", " ");
    expect(nameInput()).toHaveAttribute("autocomplete", "name");
    expect(emailInput()).toHaveAttribute("autocomplete", "email");
  });

  it("limits one-line fields to 120 characters and the message to maxMessage (default 500)", () => {
    const { unmount } = renderForm();
    expect(nameInput()).toHaveAttribute("maxlength", "120");
    expect(messageInput()).toHaveAttribute("maxlength", "500");
    unmount();
    renderForm({ maxMessage: 200 });
    expect(messageInput()).toHaveAttribute("maxlength", "200");
  });

  it("shows a live character counter for the message (0/500)", async () => {
    const { user } = renderForm();
    expect(byJoinedText(/\b0\s*\/\s*500/)).toHaveLength(1);
    await user.type(messageInput(), "hello");
    expect(byJoinedText(/\b5\s*\/\s*500/)).toHaveLength(1);
  });

  it("supports custom fields", () => {
    renderForm({ fields: [{ name: "company", label: "Company", optional: true }, { name: "notes", label: "Notes", multiline: true }] });
    expect(screen.getByLabelText("Company (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/).tagName).toBe("TEXTAREA");
    expect(screen.queryByLabelText(/Your name/)).toBeNull();
  });
});

describe("FloatingLabelForm — validation", () => {
  it("doesn't flag a field you only tabbed past", async () => {
    const { user } = renderForm();
    nameInput().focus();
    await user.tab();
    expect(nameInput()).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Please tell us your name.")).toBeNull();
  });

  it("checks on blur after typing: aria-invalid and aria-describedby point at the error", async () => {
    const { user } = renderForm();
    await user.type(nameInput(), "x");
    await user.clear(nameInput());
    await user.tab();
    expect(nameInput()).toHaveAttribute("aria-invalid", "true");
    expect(nameInput()).toHaveAccessibleDescription(expect.stringContaining("Please tell us your name."));
  });

  it("flags an email that doesn't look like one", async () => {
    const { user } = renderForm();
    await user.type(emailInput(), "ada@");
    await user.tab();
    expect(emailInput()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("That email doesn't look right — check for typos.")).toBeInTheDocument();
  });

  it("re-checks live once a field has an error", async () => {
    const { user } = renderForm();
    await user.type(emailInput(), "ada@");
    await user.tab();
    expect(emailInput()).toHaveAttribute("aria-invalid", "true");
    await user.type(emailInput(), "example.com");
    expect(emailInput()).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("That email doesn't look right — check for typos.")).toBeNull();
  });

  it("asks for at least minMessage characters in the message (default 10)", async () => {
    const { user } = renderForm();
    await user.type(messageInput(), "hi");
    await user.tab();
    expect(screen.getByText("Add a little more — at least 10 characters.")).toBeInTheDocument();
  });

  it("runs a field's own validate() on the trimmed value", async () => {
    const validate = vi.fn((v: string) => (v === "bob" ? "No Bobs." : ""));
    const { user } = renderForm({ fields: [{ name: "name", label: "Your name", validate }] });
    await user.type(nameInput(), "  bob ");
    await user.tab();
    expect(validate).toHaveBeenCalledWith("bob");
    expect(screen.getByText("No Bobs.")).toBeInTheDocument();
  });

  it("submit with errors: flags every bad required field, skips optional ones, focuses the first bad field, doesn't send", async () => {
    const onSend = vi.fn<Send>(() => Promise.resolve());
    const { user } = renderForm({ onSend });
    await user.click(submit());
    expect(onSend).not.toHaveBeenCalled();
    expect(nameInput()).toHaveAttribute("aria-invalid", "true");
    expect(emailInput()).toHaveAttribute("aria-invalid", "true");
    expect(messageInput()).toHaveAttribute("aria-invalid", "true");
    expect(subjectInput()).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("We need an email to reply to.")).toBeInTheDocument();
    expect(nameInput()).toHaveFocus();
  });
});

describe("FloatingLabelForm — sending", () => {
  it("sends trimmed values with an AbortSignal; shows “Sending…”, locks fields and keeps focus", async () => {
    const send = deferredSend();
    const { user } = renderForm({ onSend: send.onSend });
    await fillValid(user);
    await user.click(submit());
    expect(send.calls).toHaveLength(1);
    expect(send.calls[0].values).toEqual({ name: "Ada", email: "ada@example.com", subject: "", message: "Hello there, lovely radio!" });
    expect(send.calls[0].signal).toBeInstanceOf(AbortSignal);
    const sending = screen.getByRole("button", { name: /Sending…/ });
    expect(sending).toHaveFocus();
    await user.type(nameInput(), "zzz");
    expect(nameInput()).toHaveValue("  Ada  ");
    await user.click(sending);
    expect(send.onSend).toHaveBeenCalledTimes(1); // no double send
    await act(async () => send.resolve());
  });

  it("failure: shows a friendly alert and keeps the values", async () => {
    const send = deferredSend();
    const { user } = renderForm({ onSend: send.onSend });
    await fillValid(user);
    await user.click(submit());
    await act(async () => send.reject(new Error("network down")));
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't send — please try again.");
    expect(nameInput()).toHaveValue("  Ada  ");
    expect(messageInput()).toHaveValue("Hello there, lovely radio!");
    expect(submit()).toBeEnabled();
  });

  it("success: check-icon panel with focused heading and the default texts", async () => {
    const send = deferredSend();
    const { user } = renderForm({ onSend: send.onSend });
    await fillValid(user);
    await user.click(submit());
    await act(async () => send.resolve());
    const heading = screen.getByRole("heading", { name: "Thanks, Ada. Message sent." });
    expect(heading).toHaveFocus();
    expect(screen.getByText("We'll reply to ada@example.com within a day.")).toBeInTheDocument();
  });

  it("“send another” clears the form and focuses the first field", async () => {
    const send = deferredSend();
    const { user } = renderForm({ onSend: send.onSend });
    await fillValid(user);
    await user.click(submit());
    await act(async () => send.resolve());
    await user.click(screen.getByRole("button", { name: "send another" }));
    expect(nameInput()).toHaveValue("");
    expect(messageInput()).toHaveValue("");
    expect(nameInput()).toHaveFocus();
  });

  it("custom successTitle / successText / text overrides", async () => {
    const send = deferredSend();
    const { user } = renderForm({
      onSend: send.onSend,
      successTitle: (v) => `Got it, ${v.name}!`,
      successText: () => "Talk soon.",
      text: { submit: "Send it" },
    });
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Send it" }));
    await act(async () => send.resolve());
    expect(screen.getByRole("heading", { name: "Got it, Ada!" })).toBeInTheDocument();
    expect(screen.getByText("Talk soon.")).toBeInTheDocument();
  });

  it("aborts the send when the form unmounts", async () => {
    const send = deferredSend();
    const { user, unmount } = renderForm({ onSend: send.onSend });
    await fillValid(user);
    await user.click(submit());
    unmount();
    expect(send.calls[0].signal.aborted).toBe(true);
  });

  it("without onSend it pretends to send for demoDelay (default 1200 ms)", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FloatingLabelForm />);
    await fillValid(user);
    await user.click(submit());
    expect(screen.getByRole("button", { name: /Sending…/ })).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    expect(screen.queryByRole("heading", { name: /Thanks/ })).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    expect(screen.getByRole("heading", { name: "Thanks, Ada. Message sent." })).toBeInTheDocument();
  });

  it("unmounting during the pretend send leaves no timers", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<FloatingLabelForm />);
    await fillValid(user);
    await user.click(submit());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
