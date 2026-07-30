import { z } from "zod";

/** Champ texte obligatoire avec libellé lisible dans le message d'erreur. */
const nonEmpty = (label: string) =>
  z.string().trim().min(1, { message: `${label} est requis` });

export const commonSchema = z.object({
  emailExpediteur: nonEmpty("Email expéditeur")
    .email({ message: "Email expéditeur invalide" })
    .max(255, "Email expéditeur trop long (255 max)"),
  emailExpediteurNom: nonEmpty("Nom expéditeur").max(100, "Nom expéditeur trop long (100 max)"),
  appUrl: nonEmpty("URL de l'application")
    .max(500, "URL trop longue (500 max)")
    .regex(/^https?:\/\/[^\s]+$/i, "URL invalide (http:// ou https://)"),
});

export const smtpFieldsSchema = z.object({
  smtpHost: nonEmpty("Serveur SMTP")
    .max(255, "Serveur trop long")
    .regex(/^\S+$/, "Le serveur ne doit pas contenir d'espaces"),
  smtpPort: z.coerce
    .number({ invalid_type_error: "Port invalide" })
    .int("Port doit être un entier")
    .min(1, "Port ≥ 1")
    .max(65535, "Port ≤ 65535"),
  smtpUser: nonEmpty("Utilisateur SMTP")
    .email({ message: "Utilisateur SMTP doit être un email" })
    .max(255, "Utilisateur trop long"),
  smtpEncryption: z.enum(["tls", "ssl", "none"]),
});

export const resendKeySchema = z
  .string()
  .trim()
  .min(20, "Clé API Resend trop courte")
  .regex(/^re_/, "La clé doit commencer par 're_'");

export type EmailProvider = "resend" | "smtp";
export type SmtpEncryption = "tls" | "ssl" | "none";
export type ValidationScope = "common" | "smtp" | "resend-key" | "all";
