/**
 * useClotureReunion — données et exécution de la clôture d'une réunion.
 * Extrait de `ClotureReunionModal.tsx` (Lot Q3), logique métier inchangée.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

/** Formes minimales utilisées pour les jointures et les agrégats (A21). */
type MembreLite = { nom?: string | null; prenom?: string | null; email?: string | null };
type PresenceJointe = { membre_id?: string; membres?: MembreLite | null };
type BeneficiaireRow = {
  statut?: string | null;
  montant_final?: number | null;
  membres?: MembreLite | null;
};
type PointCR = { sujet?: string | null; resolution?: string | null };

const nomComplet = (m?: MembreLite | null) =>
  `${m?.prenom ?? ''} ${m?.nom ?? ''}`.trim();

const nomsDepuisPresences = (rows: unknown): string[] =>
  ((rows as PresenceJointe[] | null) ?? []).map((p) => nomComplet(p.membres)).filter(Boolean);


interface Params {
  open: boolean;
  reunionId: string;
  reunionData: { sujet?: string; date_reunion: string };
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function useClotureReunion({ open, reunionId, reunionData, onOpenChange, onSuccess }: Params) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membresE2D } = useQuery({
    queryKey: ['membres-e2d-cloture'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, email')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: presences } = useQuery({
    queryKey: ['reunion-presences-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_presences')
        .select(`
          membre_id,
          statut_presence,
          membres:membre_id (
            nom,
            prenom,
            email
          )
        `)
        .eq('reunion_id', reunionId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: comptesRendus } = useQuery({
    queryKey: ['comptes-rendus-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports_seances')
        .select('*')
        .eq('reunion_id', reunionId)
        .order('numero_ordre', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: sanctionConfig } = useQuery({
    queryKey: ['sanction-absence-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configurations')
        .select('valeur')
        .eq('cle', 'sanction_absence_montant')
        .maybeSingle();
      if (error) throw error;
      return data ? { montant: parseFloat(data.valeur) } : { montant: 500 };
    },
    enabled: open,
  });

  const { data: cotisationsReunion } = useQuery({
    queryKey: ['cotisations-reunion', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('montant, statut, membre_id')
        .eq('reunion_id', reunionId)
        .eq('statut', 'paye');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: beneficiairesReunion } = useQuery({
    queryKey: ['beneficiaires-reunion-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select('*, membres:membre_id(nom, prenom)')
        .eq('reunion_id', reunionId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: huileSavonData } = useQuery({
    queryKey: ['huile-savon-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_huile_savon')
        .select('membre_id, valide')
        .eq('reunion_id', reunionId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: sanctionHuileSavonConfig } = useQuery({
    queryKey: ['sanction-huile-savon-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configurations')
        .select('valeur')
        .eq('cle', 'sanction_huile_savon_montant')
        .maybeSingle();
      if (error) throw error;
      return data ? { montant: parseFloat(data.valeur) } : { montant: 2000 };
    },
    enabled: open,
  });

  const presentsCount = presences?.filter((p) => p.statut_presence === 'present').length || 0;
  const pointsCRCount = comptesRendus?.length || 0;
  const canClose = presentsCount > 0 && pointsCRCount > 0;

  const totalCotisations = cotisationsReunion?.reduce((sum, c) => sum + c.montant, 0) || 0;
  const nbCotisations = cotisationsReunion?.length || 0;

  const beneficiairesImpayes = ((beneficiairesReunion as BeneficiaireRow[] | null) ?? []).filter(
    (b) => b.statut !== 'paye',
  );
  const totalBeneficiairesImpayes = beneficiairesImpayes.reduce(
    (sum, b) => sum + (b.montant_final || 0),
    0,
  );

  const membresAvecCotisation = new Set(cotisationsReunion?.map((c) => c.membre_id) || []);
  const membresPresentsSansCotisation = ((presences as (PresenceJointe & {
    statut_presence?: string | null;
  })[] | null) ?? [])
    .filter((p) => p.statut_presence === 'present' && !membresAvecCotisation.has(p.membre_id!))
    .map((p) => ({ id: p.membre_id, nom: p.membres?.nom, prenom: p.membres?.prenom }));


  const membresNonMarques =
    membresE2D?.filter((m) => !presences?.some((p) => p.membre_id === m.id)) || [];

  const membresSansHuileSavon =
    membresE2D?.filter((m) => !huileSavonData?.some((hs) => hs.membre_id === m.id && hs.valide)) || [];

  const handleCloturer = async () => {
    if (!canClose) return;

    setProcessing(true);
    try {
      // === ÉTAPE 1: clôture transactionnelle côté base ===
      // Absences, sanctions (absence + huile & savon), taux de présence et statut
      // sont appliqués d'un bloc et de façon idempotente par la RPC.
      const { data: clotureResult, error: clotureError } = await supabase.rpc('cloturer_reunion', {
        _reunion_id: reunionId,
      });
      if (clotureError) throw clotureError;

      const resume = (clotureResult ?? {}) as {
        sanctions_absence?: number;
        sanctions_huile_savon?: number;
        deja_cloturee?: boolean;
      };

      const { data: tousAbsentsNonExcuses } = await supabase
        .from('reunions_presences')
        .select('membre_id')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'absent_non_excuse');


      const { data: presentsData } = await supabase
        .from('reunions_presences')
        .select('membres:membre_id (nom, prenom, email)')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'present');

      // Le compte-rendu est diffusé à TOUS les membres actifs de l'association
      const { data: tousMembresData } = await supabase
        .from('membres')
        .select('nom, prenom, email')
        .eq('statut', 'actif')
        .not('email', 'is', null);

      // Les destinataires réels sont calculés côté serveur (membres actifs de
      // l'association de la réunion). Ce décompte sert uniquement à l'affichage.
      const nbDestinatairesEstime = ((tousMembresData as MembreLite[] | null) ?? []).filter(
        (m) => !!m.email,
      ).length;


      // B1 — Ne pas bloquer la clôture si aucun email valide.
      const hasDestinataires = nbDestinatairesEstime > 0;
      if (!hasDestinataires) {
        toast({
          title: 'Compte-rendu non envoyé',
          description: "Aucun email valide parmi les membres actifs. La clôture se poursuit sans envoi.",
        });
      }


      // === ÉTAPE 5: compte-rendu par email ===
      const contenuCR =
        ((comptesRendus as PointCR[] | null) ?? [])

          .map((cr, index) => `${index + 1}. ${cr.sujet}\n   ${cr.resolution || 'Aucune résolution'}`)
          .join('\n\n') || "Aucun point à l'ordre du jour";

      const presentsNoms = nomsDepuisPresences(presentsData);


      const { data: excusesData } = await supabase
        .from('reunions_presences')
        .select('membres:membre_id (nom, prenom)')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'absent_excuse');
      const excusesNoms = nomsDepuisPresences(excusesData);


      const absentsNonExcusesNoms = tousAbsentsNonExcuses?.length
        ? membresE2D
            ?.filter((m) => tousAbsentsNonExcuses.some((a) => a.membre_id === m.id))
            .map((m) => `${m.prenom} ${m.nom}`) || []
        : [];

      const { data: retardsData } = await supabase
        .from('reunions_presences')
        .select('membres:membre_id (nom, prenom)')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'present')
        .not('heure_arrivee', 'is', null);
      const retardsNoms = nomsDepuisPresences(retardsData);


      const totalMembresCalcul = presentsNoms.length + excusesNoms.length + absentsNonExcusesNoms.length;
      const tauxPresenceEmail =
        totalMembresCalcul > 0 ? Math.round((presentsNoms.length / totalMembresCalcul) * 100) : 0;

      const { data: epargnesReunion } = await supabase
        .from('epargnes')
        .select('montant')
        .eq('reunion_id', reunionId);

      const { data: sanctionsReunion } = await supabase
        .from('reunions_sanctions')
        .select('montant_amende')
        .eq('reunion_id', reunionId);

      const { data: beneficiairesData } = await supabase
        .from('reunion_beneficiaires')
        .select('*, membres:membre_id(nom, prenom)')
        .eq('reunion_id', reunionId);

      const financials = {
        cotisations: { count: nbCotisations, total: totalCotisations },
        epargnes: {
          count: epargnesReunion?.length || 0,
          total: epargnesReunion?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0,
        },
        sanctions: {
          count: sanctionsReunion?.length || 0,
          total: sanctionsReunion?.reduce((sum, s) => sum + (s.montant_amende || 0), 0) || 0,
        },
        beneficiaires:
          beneficiairesData && beneficiairesData.length > 0
            ? {
                count: beneficiairesData.length,
                total: (beneficiairesData as BeneficiaireRow[]).reduce(
                  (sum, b) => sum + (b.montant_final || 0),
                  0,
                ),
                details: (beneficiairesData as BeneficiaireRow[]).map((b) => ({
                  nom: nomComplet(b.membres),
                  montant: b.montant_final || 0,

                  statut: b.statut,
                })),
              }
            : undefined,
      };

      const { data: reunionDetails } = await supabase
        .from('reunions')
        .select('lieu_description, ordre_du_jour, date_reunion')
        .eq('id', reunionId)
        .maybeSingle();

      const dateObj = new Date(reunionDetails?.date_reunion || reunionData.date_reunion);

      let emailSent = false;
      if (hasDestinataires) {
        const { error: emailError } = await supabase.functions.invoke('send-reunion-cr', {
          body: {
            reunionId,
            sujet: reunionData.sujet || 'Réunion',
            contenu: contenuCR,
            dateReunion: dateObj.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            heure: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            lieu: reunionDetails?.lieu_description || undefined,
            ordreDuJour: reunionDetails?.ordre_du_jour || undefined,

            presences: {
              presents: presentsNoms,
              excuses: excusesNoms,
              absentsNonExcuses: absentsNonExcusesNoms,
              retards: retardsNoms,
              tauxPresence: tauxPresenceEmail,
            },
            financials,
          },
        });

        if (emailError) {
          logger.error('Email error details:', emailError);
          // B1 — Ne pas bloquer la clôture si l'email échoue
        } else {
          emailSent = true;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['reunion-presences'] });
      queryClient.invalidateQueries({ queryKey: ['reunion-presences-cloture'] });
      queryClient.invalidateQueries({ queryKey: ['presences-all'] });
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
      queryClient.invalidateQueries({ queryKey: ['reunions-cloturees'] });
      queryClient.invalidateQueries({ queryKey: ['reunions-sanctions'] });

      const nbSanctionsAbsence = resume.sanctions_absence ?? 0;
      const nbSanctionsHuileSavon = resume.sanctions_huile_savon ?? 0;
      const totalSanctions = nbSanctionsAbsence + nbSanctionsHuileSavon;

      const emailMsg = emailSent
        ? `CR envoyé à ${nbDestinatairesEstime} membre(s).`
        : hasDestinataires
          ? `Envoi du CR échoué — clôture maintenue.`
          : `CR non envoyé (aucun email).`;
      toast({
        title: resume.deja_cloturee ? 'Réunion déjà clôturée' : 'Réunion clôturée avec succès',
        description: `${emailMsg} ${
          totalSanctions > 0
            ? `${totalSanctions} sanction(s) créée(s) (${nbSanctionsAbsence} absence${
                nbSanctionsAbsence > 1 ? 's' : ''
              }, ${nbSanctionsHuileSavon} Huile & Savon).`
            : ''
        }`,
      });


      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      logger.error('Erreur clôture réunion:', error);
      toast({
        title: 'Erreur',
        description:
          'Impossible de clôturer la réunion: ' + (error instanceof Error ? error.message : 'Erreur'),
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    presences,
    presentsCount,
    pointsCRCount,
    canClose,
    totalCotisations,
    nbCotisations,
    sanctionConfig,
    sanctionHuileSavonConfig,
    beneficiairesReunion,
    beneficiairesImpayes,
    totalBeneficiairesImpayes,
    membresNonMarques,
    membresSansHuileSavon,
    membresPresentsSansCotisation,
    handleCloturer,
  };
}

export type ClotureController = ReturnType<typeof useClotureReunion>;
