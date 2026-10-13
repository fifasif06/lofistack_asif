// Spec-first tests for OtpInput: written from prompt.md and the OtpInputProps JSDoc.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OtpInput, { type OtpInputProps } from "./component";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

type Verify = (code: string, signal: AbortSignal) => Promise<boolean>;

/** A verify() that stays pending until the test answers it. */
function deferredVerify() {
  const calls: { code: string; signal: AbortSignal; answer: (ok: boolean) => void; fail: (e: Error) => void }[] = [];
  const verify = vi.fn<Verify>(
    (code, signal) =>
      new Promise<boolean>((resolve, reject) => {
        calls.push({ code, signal, answer: resolve, fail: reject });
      }),
  );
  return { verify, calls };
}

const boxes = () => screen.getAllByRole("textbox") as HTMLInputElement[];
const box = (n: number, length = 6) => screen.getByRole("textbox", { name: `Digit ${n} of ${length}` }) as HTMLInputElement;
const values = () => boxes().map((b) => b.value).join("");
const status = () => screen.getByRole("status");
/** The countdown re-arms a 1 s timer after each render, so advance one second per act(). */
const seconds = (n: number) => {
  for (let i = 0; i < n; i++) act(() => { vi.advanceTimersByTime(1000); });
};

function renderOtp(props: Partial<OtpInputProps> = {}, fake = false) {
  if (fake) vi.useFakeTimers();
  const user = fake ? userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) : userEvent.setup();
  return { user, ...render(<OtpInput {...props} />) };
}

describe("OtpInput — structure", () => {
  it("is a fieldset with an sr-only legend and one labelled numeric box per digit", () => {
    renderOtp();
    const group = screen.getByRole("group", { name: "One-time code, 6 digits" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group.querySelector("legend")).toHaveClass("sr-only");
    expect(boxes()).toHaveLength(6);
    for (let n = 1; n <= 6; n++) expect(box(n)).toHaveAttribute("inputmode", "numeric");
  });

  it("only box 1 has autocomplete=\"one-time-code\"", () => {
    renderOtp();
    expect(box(1)).toHaveAttribute("autocomplete", "one-time-code");
    for (let n = 2; n <= 6; n++) expect(box(n)).not.toHaveAttribute("autocomplete", "one-time-code");
  });

  it("shows the title, the subtitle with sentTo, and a role=status line", () => {
    renderOtp();
    expect(screen.getByText("Enter your code")).toBeInTheDocument();
    expect(screen.getByText("We sent a 6-digit code to ••• ••• 4821")).toBeInTheDocument();
    expect(status()).toBeInTheDocument();
  });

  it("length changes the boxes, legend and subtitle", () => {
    renderOtp({ length: 4, sentTo: "ada@example.com" });
    expect(boxes()).toHaveLength(4);
    expect(screen.getByRole("group", { name: "One-time code, 4 digits" })).toBeInTheDocument();
    expect(box(4, 4)).toBeInTheDocument();
    expect(screen.getByText("We sent a 4-digit code to ada@example.com")).toBeInTheDocument();
  });
});

describe("OtpInput — typing and moving", () => {
  it("accepts digits only and auto-advances", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.keyboard("1a2");
    expect(values()).toBe("12");
    expect(box(3)).toHaveFocus();
  });

  it("Backspace in an empty box clears the one before and moves there", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.keyboard("123");
    expect(box(4)).toHaveFocus();
    await user.keyboard("{Backspace}");
    expect(values()).toBe("12");
    expect(box(3)).toHaveFocus();
  });

  // Added after the coverage review: the filled-box Backspace path wasn't exercised.
  it("Backspace in a filled box clears that box and stays there", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.keyboard("123");
    await user.click(box(2));
    await user.keyboard("{Backspace}");
    expect(boxes().map((b) => b.value)).toEqual(["1", "", "3", "", "", ""]);
    expect(box(2)).toHaveFocus();
  });

  it("arrows, Home and End move focus", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(3));
    await user.keyboard("{ArrowRight}");
    expect(box(4)).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(box(2)).toHaveFocus();
    await user.keyboard("{End}");
    expect(box(6)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(box(1)).toHaveFocus();
  });

  it("focusing a filled box selects its digit (typing replaces it)", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.keyboard("12");
    await user.click(box(1));
    expect(box(1).selectionStart).toBe(0);
    expect(box(1).selectionEnd).toBe(1);
    await user.keyboard("9");
    expect(values()).toBe("92");
  });

  it("paste spreads the digits from the pasted box onward", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(3));
    await user.paste("4-5 6");
    expect(boxes().map((b) => b.value)).toEqual(["", "", "4", "5", "6", ""]);
  });

  it("box 1 takes the whole code at once (SMS autofill)", () => {
    const { verify } = deferredVerify();
    renderOtp({ verify });
    fireEvent.change(box(1), { target: { value: "135790" } });
    expect(values()).toBe("135790");
    expect(verify).toHaveBeenCalledWith("135790", expect.any(AbortSignal));
  });
});

describe("OtpInput — checking", () => {
  it("checks as soon as the last digit is in: “Checking…”, boxes locked", async () => {
    const { verify } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.keyboard("12345");
    expect(verify).not.toHaveBeenCalled();
    await user.keyboard("6");
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0][0]).toBe("123456");
    expect(status()).toHaveTextContent("Checking…");
    await user.keyboard("{Backspace}");
    expect(values()).toBe("123456"); // locked while checking
  });

  it("right code: verified message, onVerified(code), “start over” clears", async () => {
    const { verify, calls } = deferredVerify();
    const onVerified = vi.fn();
    const { user } = renderOtp({ verify, onVerified });
    await user.click(box(1));
    await user.paste("246810");
    await act(async () => calls[0].answer(true));
    expect(status()).toHaveTextContent("Verified — you're in.");
    expect(onVerified).toHaveBeenCalledWith("246810");
    await user.click(screen.getByRole("button", { name: "start over" }));
    expect(values()).toBe("");
    expect(box(1)).toHaveFocus();
  });

  it("wrong code: mismatch message, then after errorDelay the boxes clear and box 1 is focused; message stays until the next digit", async () => {
    const { verify, calls } = deferredVerify();
    const { user } = renderOtp({ verify }, true);
    await user.click(box(1));
    await user.paste("111111");
    await act(async () => calls[0].answer(false));
    expect(status()).toHaveTextContent("That code didn't match. Try again.");
    expect(values()).toBe("111111");
    act(() => { vi.advanceTimersByTime(900); });
    expect(values()).toBe("");
    expect(box(1)).toHaveFocus();
    expect(status()).toHaveTextContent("That code didn't match. Try again.");
    await user.keyboard("2");
    expect(status()).not.toHaveTextContent("That code didn't match.");
  });

  it("errorDelay sets how long a wrong code stays red", async () => {
    const { verify, calls } = deferredVerify();
    const { user } = renderOtp({ verify, errorDelay: 2000 }, true);
    await user.click(box(1));
    await user.paste("111111");
    await act(async () => calls[0].answer(false));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(values()).toBe("111111");
    act(() => { vi.advanceTimersByTime(600); });
    expect(values()).toBe("");
  });

  it("verify throwing shows the “couldn't check” message", async () => {
    const { verify, calls } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.paste("111111");
    await act(async () => calls[0].fail(new Error("offline")));
    expect(status()).toHaveTextContent("Couldn't check the code. Try again.");
  });

  it("default demo check accepts demoCode “246810” after 700 ms", async () => {
    const onVerified = vi.fn();
    const { user } = renderOtp({ onVerified }, true);
    await user.click(box(1));
    await user.paste("246810");
    await act(async () => { await vi.advanceTimersByTimeAsync(650); });
    expect(status()).toHaveTextContent("Checking…");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(status()).toHaveTextContent("Verified — you're in.");
    expect(onVerified).toHaveBeenCalledWith("246810");
  });

  it("text overrides change the wording", async () => {
    const { verify, calls } = deferredVerify();
    const { user } = renderOtp({ verify, text: { verified: "All good!" } });
    await user.click(box(1));
    await user.paste("246810");
    await act(async () => calls[0].answer(true));
    expect(status()).toHaveTextContent("All good!");
  });
});

describe("OtpInput — resend", () => {
  it("counts down “resend code in 0:30”, becomes clickable at zero", () => {
    renderOtp({}, true);
    const resend = screen.getByRole("button", { name: /resend code in 0:30/ });
    expect(resend).toBeDisabled();
    seconds(1);
    expect(screen.getByRole("button", { name: /resend code in 0:29/ })).toBeInTheDocument();
    seconds(29);
    expect(screen.getByRole("button", { name: "resend code" })).toBeEnabled();
  });

  it("resend calls onResend, clears the boxes and restarts the countdown (resendSeconds)", async () => {
    const onResend = vi.fn();
    const { verify } = deferredVerify();
    const { user } = renderOtp({ onResend, resendSeconds: 5, verify }, true);
    await user.click(box(1));
    await user.keyboard("12");
    seconds(5);
    await user.click(screen.getByRole("button", { name: "resend code" }));
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(values()).toBe("");
    expect(screen.getByRole("button", { name: /resend code in 0:05/ })).toBeDisabled();
  });

  it("resend while checking aborts the check", async () => {
    const { verify, calls } = deferredVerify();
    const { user } = renderOtp({ verify, resendSeconds: 1 }, true);
    await user.click(box(1));
    await user.paste("123456");
    seconds(1);
    await user.click(screen.getByRole("button", { name: "resend code" }));
    expect(calls[0].signal.aborted).toBe(true);
  });
});

// Added after the coverage review: the "check was cancelled meanwhile" path was never reached.
describe("OtpInput — races", () => {
  it("a late answer from a cancelled check is ignored (resend while checking, then the old check says yes)", async () => {
    const { verify, calls } = deferredVerify();
    const onVerified = vi.fn();
    const { user } = renderOtp({ verify, onVerified, resendSeconds: 1 }, true);
    await user.click(box(1));
    await user.paste("123456");
    seconds(1);
    await user.click(screen.getByRole("button", { name: "resend code" }));
    await act(async () => calls[0].answer(true));
    expect(onVerified).not.toHaveBeenCalled();
    expect(status()).not.toHaveTextContent("Verified");
    expect(values()).toBe("");
  });

  it("“start over” after a success, then a new code is checked again", async () => {
    const { verify, calls } = deferredVerify();
    const { user } = renderOtp({ verify });
    await user.click(box(1));
    await user.paste("246810");
    await act(async () => calls[0].answer(true));
    await user.click(screen.getByRole("button", { name: "start over" }));
    await user.paste("135791");
    expect(verify).toHaveBeenCalledTimes(2);
    expect(calls[1].code).toBe("135791");
  });
});

describe("OtpInput — cleanup", () => {
  it("unmount aborts a running check and clears all timers", async () => {
    const { verify, calls } = deferredVerify();
    const { user, unmount } = renderOtp({ verify }, true);
    await user.click(box(1));
    await user.paste("123456");
    unmount();
    expect(calls[0].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("unmount during the wrong-code delay clears that timer too", async () => {
    const { verify, calls } = deferredVerify();
    const { user, unmount } = renderOtp({ verify }, true);
    await user.click(box(1));
    await user.paste("111111");
    await act(async () => calls[0].answer(false));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
