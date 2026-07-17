/**
 * Schémas Zod partagés pour les Edge Functions.
 * Import : `import { EmailSchema, UuidSchema, ... } from '../_shared/schemas.ts';`
 *
 * Rappels (Lot 4) :
 *  - Toute Edge Function acceptant un payload JSON doit le valider ici avant
 *    d'exécuter la moindre action métier (voir `send-contact-notification`).
 *  - Retour standard en cas d'échec :
 *      new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
 *        { status: 400, headers: corsHeaders });
 */
import { z } from "npm:zod@3.23.8";

export const EmailSchema = z.string().trim().email().max(255);
export const UuidSchema = z.string().uuid();
export const NonEmptyString = (max = 500) => z.string().trim().min(1).max(max);
export const OptionalString = (max = 2000) =>
  z.string().trim().max(max).optional().nullable();
export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^[+0-9 ()-]{6,20}$/i, "Téléphone invalide")
  .optional()
  .nullable();

/** Payload générique pour tout envoi d'email transactionnel. */
export const SendEmailPayload = z.object({
  to: z.union([EmailSchema, z.array(EmailSchema).min(1).max(50)]),
  subject: NonEmptyString(200),
  html: NonEmptyString(200_000).optional(),
  text: NonEmptyString(50_000).optional(),
  replyTo: EmailSchema.optional(),
  templateId: z.string().max(120).optional(),
  vars: z.record(z.any()).optional(),
});

/** Payload minimal pour les webhooks de paiement / adhésion. */
export const WebhookPayload = z.object({
  id: NonEmptyString(120),
  event: NonEmptyString(80),
  data: z.record(z.any()),
});

export type SendEmailInput = z.infer<typeof SendEmailPayload>;
export type WebhookInput = z.infer<typeof WebhookPayload>;

/** Helper d'analyse : renvoie { data } ou une Response 400 prête à retourner. */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
  corsHeaders: Record<string, string>,
): { ok: true; data: z.infer<T> } | { ok: false; response: Response } {
  const parsed = schema.safeParse(body);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    response: new Response(
      JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    ),
  };
}
