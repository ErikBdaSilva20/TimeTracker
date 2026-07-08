import { toast } from "sonner";

interface RunMutationOptions<T> {
  /** Shown on success. Omit to stay silent (matches each screen's prior UX). */
  successMessage?: string;
  /** Shown on failure when the thrown value isn't an `Error` with a message. */
  errorMessage?: string;
  /** Runs only after `action` resolves — invalidate queries / close a form here. */
  onSuccess?: (result: T) => void;
}

/**
 * Standard error handling for a write against the gateway. Several
 * create/update/delete call sites across the business screens had no
 * try/catch at all (audit 4.2) — a rejected fetch (network blip, gateway
 * 4xx/5xx) surfaced as an unhandled promise rejection instead of a toast,
 * silently leaving the UI in a stale state (form still open, list not
 * invalidated). Every write should go through this instead of a local
 * try/catch so the failure path can't be forgotten again.
 */
export async function runMutation<T>(
  action: () => Promise<T>,
  { successMessage, errorMessage, onSuccess }: RunMutationOptions<T> = {},
): Promise<void> {
  try {
    const result = await action();
    onSuccess?.(result);
    if (successMessage) toast.success(successMessage);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : (errorMessage ?? "Erro"));
  }
}
