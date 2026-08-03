import { ReactNode, useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

/**
 * Remplacement promisifié de `window.confirm` basé sur AlertDialog.
 *
 * ```tsx
 * const { confirm, confirmDialog } = useConfirm();
 * const onDelete = async (id: string) => {
 *   if (!(await confirm({ title: "Supprimer ?", destructive: true }))) return;
 *   remove(id);
 * };
 * return <>{confirmDialog}...</>;
 * ```
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({ open: false, title: "" });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      title={state.title}
      description={state.description ?? "Cette action est définitive."}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      destructive={state.destructive}
      onConfirm={() => settle(true)}
    />
  );

  return { confirm, confirmDialog };
}
