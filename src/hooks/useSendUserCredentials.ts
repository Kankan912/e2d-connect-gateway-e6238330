import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeError, translateErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

interface SendResult {
  success: boolean;
  email?: string;
  passwordReset?: boolean;
}

interface SendOptions {
  /** If provided (and not resetting), reuse this known password instead of asking the server to generate one. */
  password?: string;
  /** Silent mode: caller handles toasts (default false). */
  silent?: boolean;
}

/**
 * Centralized hook for sending user credentials via email.
 *
 * - `sendExisting`: sends the current password (reuses a known one if provided,
 *   otherwise the server refuses if no password is available).
 * - `resetAndSend`: forces a new temporary password server-side, then sends it.
 *
 * Both variants:
 * - guard against concurrent calls for the same userId,
 * - map edge function errors via `translateErrorCode` (French),
 * - invalidate the `utilisateurs` query on reset so `password_changed` refreshes.
 */
export function useSendUserCredentials() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const isPending = useCallback(
    (userId?: string) => (userId ? pendingIds.has(userId) : pendingIds.size > 0),
    [pendingIds],
  );

  const invoke = useCallback(
    async (userId: string, resetPassword: boolean, options: SendOptions = {}): Promise<SendResult> => {
      if (pendingIds.has(userId)) return { success: false };
      setPendingIds((s) => new Set(s).add(userId));

      try {
        const { data, error } = await supabase.functions.invoke<{
          success?: boolean;
          email?: string;
          passwordReset?: boolean;
          code?: string;
          message?: string;
        }>("send-user-credentials", {
          body: {
            userId,
            resetPassword,
            ...(resetPassword ? {} : options.password ? { password: options.password } : {}),
          },
        });

        if (data?.success) {
          if (!options.silent) {
            const label = resetPassword
              ? `Nouveaux identifiants envoyés à ${data.email}`
              : `Identifiants envoyés à ${data.email}`;
            toast.success(label);
          }
          if (resetPassword) {
            queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
          }
          return { success: true, email: data.email, passwordReset: data.passwordReset };
        }

        const payload = extractEdgeError(error, data);
        if (!options.silent) {
          const title = translateErrorCode(payload.code, "Échec de l'envoi de l'email");
          toast.error(title);
        }
        return { success: false };
      } catch (err: unknown) {
        logger.error("[useSendUserCredentials] invoke error:", err);
        if (!options.silent) toast.error("Erreur réseau lors de l'envoi");
        return { success: false };
      } finally {
        setPendingIds((s) => {
          const n = new Set(s);
          n.delete(userId);
          return n;
        });
      }
    },
    [pendingIds, queryClient],
  );

  const sendExisting = useCallback(
    (userId: string, options?: SendOptions) => invoke(userId, false, options),
    [invoke],
  );

  const resetAndSend = useCallback(
    (userId: string, options?: SendOptions) => invoke(userId, true, options),
    [invoke],
  );

  return { sendExisting, resetAndSend, isPending };
}
