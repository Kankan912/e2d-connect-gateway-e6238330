/**
 * useClotureReunion — données et exécution de la clôture d'une réunion.
 * Extrait de `ClotureReunionModal.tsx` (Lot Q3), logique métier inchangée.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

  const beneficiairesImpayes = beneficiairesReunion?.filter((b: any) => b.statut !== 'paye') || [];
  const totalBeneficiairesImpayes = beneficiairesImpayes.reduce(
    (sum: number, b: any) => sum + (b.montant_final || 0),
    0,
  );

  const membresAvecCotisation = new Set(cotisationsReunion?.map((c) => c.membre_id) || []);
  const membresPresentsSansCotisation =
    presences
      ?.filter((p) => p.statut_presence === 'present' && !membresAvecCotisation.has(p.membre_id))
      .map((p: any) => ({ id: p.membre_id, nom: p.membres?.nom, prenom: p.membres?.prenom })) || [];

  const membresNonMarques =
    membresE2D?.filter((m) => !presences?.some((p) => p.membre_id === m.id)) || [];

  const membresSansHuileSavon =
    membresE2D?.filter((m) => !huileSavonData?.some((hs) => hs.membre_id === m.id && hs.valide)) || [];

  const handleCloturer = async () => {
    if (!canClose) return;

    setProcessing(true);
    try {
      // === ÉTAPE 1: membres non marqués => absents non excusés ===
      if (membresNonMarques.length > 0) {
        const absencesACreer = membresNonMarques.map((m) => ({
          reunion_id: reunionId,
          membre_id: m.id,
          statut_presence: 'absent_non_excuse',
          present: false,
        }));

        const { error: insertError } = await supabase.from('reunions_presences').insert(absencesACreer);
        if (insertError) throw insertError;
      }

      // === ÉTAPE 2: absents non excusés ===
      const { data: tousAbsentsNonExcuses } = await supabase
        .from('reunions_presences')
        .select('membre_id')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'absent_non_excuse');

      // === ÉTAPE 3: sanctions absence ===
      if (tousAbsentsNonExcuses && tousAbsentsNonExcuses.length > 0 && sanctionConfig) {
        const sanctionsACreer = tousAbsentsNonExcuses.map((abs) => ({
          reunion_id: reunionId,
          membre_id: abs.membre_id,
          type_sanction: 'absence',
          montant_amende: sanctionConfig.montant || 500,
          motif: 'Absence non excusée à la réunion',
          statut: 'impaye',
        }));

        const { error: sanctionError } = await supabase.from('reunions_sanctions').insert(sanctionsACreer);
        if (sanctionError) {
          logger.error('Erreur création sanctions:', sanctionError);
        }
      }

      // === ÉTAPE 3bis: sanctions Huile & Savon ===
      if (membresSansHuileSavon.length > 0 && sanctionHuileSavonConfig) {
        const sanctionsHuileSavon = membresSansHuileSavon.map((m) => ({
          reunion_id: reunionId,
          membre_id: m.id,
          type_sanction: 'huile_savon',
          montant_amende: sanctionHuileSavonConfig.montant || 2000,
          motif: 'Huile & Savon non apporté',
          statut: 'impaye',
        }));

        const { error: sanctionHSError } = await supabase
          .from('reunions_sanctions')
          .insert(sanctionsHuileSavon);
        if (sanctionHSError) {
          logger.error('Erreur création sanctions Huile & Savon:', sanctionHSError);
        }
      }

      const { data: presentsData } = await supabase
        .from('reunions_presences')
        .select('membres:membre_id (nom, prenom, email)')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'present');

      const destinataires =
        presentsData
          ?.filter((p: any) => p.membres?.email)
          .map((p: any) => ({ email: p.membres.email, nom: p.membres.nom, prenom: p.membres.prenom })) || [];

      // B1 — Ne pas bloquer la clôture si aucun email valide.
      const hasDestinataires = destinataires.length > 0;
      if (!hasDestinataires) {
        toast({
          title: 'Compte-rendu non envoyé',
          description: "Aucun email valide pour les membres présents. La clôture se poursuit sans envoi.",
        });
      }

      // === ÉTAPE 5: compte-rendu par email ===
      const contenuCR =
        comptesRendus
          ?.map((cr: any, index: number) => `${index + 1}. ${cr.sujet}\n   ${cr.resolution || 'Aucune résolution'}`)
          .join('\n\n') || "Aucun point à l'ordre du jour";

      const presentsNoms =
        presentsData?.map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`).filter(Boolean) || [];

      const { data: excusesData } = await supabase
        .from('reunions_presences')
        .select('membres:membre_id (nom, prenom)')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'absent_excuse');
      const excusesNoms =
        excusesData?.map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`).filter(Boolean) || [];

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
      const retardsNoms =
        retardsData?.map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`).filter(Boolean) || [];

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
                total: beneficiairesData.reduce((sum: number, b: any) => sum + (b.montant_final || 0), 0),
                details: beneficiairesData.map((b: any) => ({
                  nom: `${b.membres?.prenom} ${b.membres?.nom}`,
                  montant: b.montant_final || 0,
                  statut: b.statut,
                })),
              }
            : undefined,
      };

      let emailSent = false;
      if (hasDestinataires) {
        const { error: emailError } = await supabase.functions.invoke('send-reunion-cr', {
          body: {
            reunionId,
            destinataires,
            sujet: reunionData.sujet || 'Réunion',
            contenu: contenuCR,
            dateReunion: reunionData.date_reunion,
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

      // === ÉTAPE 6: taux de présence + statut ===
      const totalMembresE2D = membresE2D?.length || 0;
      const tauxPresenceCalcule =
        totalMembresE2D > 0 ? Math.round((presentsCount / totalMembresE2D) * 100 * 10) / 10 : 0;

      const { error: updateError } = await supabase
        .from('reunions')
        .update({ statut: 'terminee', taux_presence: tauxPresenceCalcule })
        .eq('id', reunionId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['reunion-presences'] });
      queryClient.invalidateQueries({ queryKey: ['reunion-presences-cloture'] });
      queryClient.invalidateQueries({ queryKey: ['presences-all'] });
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
      queryClient.invalidateQueries({ queryKey: ['reunions-cloturees'] });
      queryClient.invalidateQueries({ queryKey: ['reunions-sanctions'] });

      const nbSanctionsAbsence = tousAbsentsNonExcuses?.length || 0;
      const nbSanctionsHuileSavon = membresSansHuileSavon.length;
      const totalSanctions = nbSanctionsAbsence + nbSanctionsHuileSavon;

      const emailMsg = emailSent
        ? `CR envoyé à ${destinataires.length} membre(s).`
        : hasDestinataires
          ? `Envoi du CR échoué — clôture maintenue.`
          : `CR non envoyé (aucun email).`;
      toast({
        title: 'Réunion clôturée avec succès',
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
