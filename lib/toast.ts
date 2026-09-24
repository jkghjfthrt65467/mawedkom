export type ToastKind = "ok" | "err";

export function showToast(message: string, kind: ToastKind = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("nubo-toast", { detail: { message, kind } }));
}
