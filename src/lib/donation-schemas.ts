import { z } from "zod";

export const donorInfoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export const donationAmountSchema = z.object({
  amount: z.number().min(1, "Le montant doit être supérieur à 0"),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF']).default('EUR'),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['monthly', 'yearly']).optional(),
});

export const adhesionSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Numéro de téléphone invalide"),
  type_adhesion: z.enum(['e2d', 'phoenix', 'both']),
  message: z.string().optional(),
  accepte_conditions: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions",
  }),
});

export type DonorInfo = z.infer<typeof donorInfoSchema>;
export type DonationAmount = z.infer<typeof donationAmountSchema>;
export type AdhesionForm = z.infer<typeof adhesionSchema>;