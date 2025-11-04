// CORRECTION 11: Calculs du solde net des bénéficiaires avec déductions
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export interface SoldeNetDetail {
  montantBrut: number;
  sanctionsImpayees: number;
  fondsSport: number;
  fondsInvest: number;
  totalDeductions: number;
  soldeNet: number;
  pourcentageDeduction: number;
}

/**
 * Calcule le solde net d'un bénéficiaire en déduisant les impayés
 * @param membreId ID du membre
 * @param exerciceId ID de l'exercice
 * @returns Détails du solde net avec déductions
 */
export async function calculateSoldeNetBeneficiaire(
  membreId: string,
  exerciceId: string
): Promise<SoldeNetDetail> {
  try {
    logger.debug('Calcul solde net bénéficiaire', { data: { membreId, exerciceId } });

    // 1. Récupérer cotisations payées du membre pour l'exercice
    const { data: cotisations, error: cotError } = await supabase
      .from('cotisations')
      .select('montant')
      .eq('membre_id', membreId)
      .eq('exercice_id', exerciceId)
      .eq('statut', 'paye');

    if (cotError) {
      logger.error('Erreur chargement cotisations', cotError);
      throw cotError;
    }

    const montantBrut = cotisations?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;
    logger.debug('Montant brut cotisations', { data: { montantBrut } });

    // 2. Calculer sanctions impayées
    const { data: sanctions, error: sanctError } = await supabase
      .from('sanctions')
      .select('montant, statut')
      .eq('membre_id', membreId)
      .in('statut', ['impaye', 'partiel']);

    if (sanctError) {
      logger.error('Erreur chargement sanctions', sanctError);
      throw sanctError;
    }

    const sanctionsImpayees = sanctions?.reduce((sum, s) => sum + Number(s.montant), 0) || 0;
    logger.debug('Sanctions impayées', { data: { sanctionsImpayees } });

    // 3. Calculer fonds sport impayés (selon contexte sanction = 'sport')
    const { data: sanctionsSport, error: sportError } = await supabase
      .from('sanctions')
      .select('montant, contexte_sanction')
      .eq('membre_id', membreId)
      .eq('contexte_sanction', 'sport')
      .in('statut', ['impaye', 'partiel']);

    if (sportError) {
      logger.warn('Erreur chargement sanctions sport', { data: { error: sportError } });
    }

    const fondsSport = sanctionsSport?.reduce((sum, s) => sum + Number(s.montant), 0) || 0;
    logger.debug('Fonds sport impayés', { data: { fondsSport } });

    // 4. Fonds invest (pour future implémentation)
    const fondsInvest = 0;

    // 5. Calcul final
    const totalDeductions = sanctionsImpayees + fondsSport + fondsInvest;
    const soldeNet = Math.max(0, montantBrut - totalDeductions);
    const pourcentageDeduction = montantBrut > 0
      ? (totalDeductions / montantBrut) * 100
      : 0;

    const result: SoldeNetDetail = {
      montantBrut,
      sanctionsImpayees,
      fondsSport,
      fondsInvest,
      totalDeductions,
      soldeNet,
      pourcentageDeduction
    };

    logger.success('Solde net calculé', { data: result });
    return result;

  } catch (error) {
    logger.error('Erreur calcul solde net bénéficiaire', error);

    // Retourner objet vide en cas d'erreur
    return {
      montantBrut: 0,
      sanctionsImpayees: 0,
      fondsSport: 0,
      fondsInvest: 0,
      totalDeductions: 0,
      soldeNet: 0,
      pourcentageDeduction: 0
    };
  }
}
