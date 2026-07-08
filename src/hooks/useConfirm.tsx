import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Promise-based replacement for the browser's native `confirm()`.
 *
 * Native `confirm()` blocks the JS thread and renders as an unstyled OS
 * dialog that looks out of place next to the rest of the design system —
 * and the same "Excluir X?" call was copy-pasted across 7 screens. This
 * hook renders a themed shadcn AlertDialog instead, with the same
 * call-and-await ergonomics as the native version:
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (await confirm("Excluir cliente?")) { await clientsRepo.remove(id); }
 *   ...
 *   return <>{dialog}{...rest of the screen}</>;
 */
export function useConfirm() {
  const [message, setMessage] = useState<string | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setMessage(null);
  };

  const dialog = (
    <AlertDialog open={message !== null} onOpenChange={(open) => !open && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => settle(true)}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
