import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CaisseSynthese {
  fondTotal: number;
  totalEpargnes: number;
  totalCotisations: number;
  sanctionsEncaissees: number;
  sanctionsImpayees: number;
  aidesDistribuees: number;
  pretsDecaisses: number;
  pretsRembourses: number;
  pretsEnCours: number;
  fondSport: number;
  reliquatCotisations: number;
  totalDistributionsBeneficiaires: number;
  tauxRecouvrement: number;
}

export const useCaisseSynthese = () => {
  return useQuery({
    queryKey: ["caisse-synthese"],
    queryFn: async (): Promise<CaisseSynthese> => {
      // Récupérer toutes les opérations de caisse
      const { data: operations } = await supabase
        .from("fond_caisse_operations")
        .select("*");

      // Calculer les totaux par catégorie
      const totalEpargnes = operations
        ?.filter(o => o.type_operation === 'entree' && o.categorie === 'epargne')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const totalCotisations = operations
        ?.filter(o => o.type_operation === 'entree' && o.categorie === 'cotisation')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const sanctionsEncaissees = operations
        ?.filter(o => o.type_operation === 'entree' && o.categorie === 'sanction')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const aidesDistribuees = operations
        ?.filter(o => o.type_operation === 'sortie' && o.categorie === 'aide')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const pretsDecaisses = operations
        ?.filter(o => o.type_operation === 'sortie' && o.categorie === 'pret_decaissement')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const pretsRembourses = operations
        ?.filter(o => o.type_operation === 'entree' && o.categorie === 'pret_remboursement')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const totalDistributionsBeneficiaires = operations
        ?.filter(o => o.type_operation === 'sortie' && o.categorie === 'beneficiaire')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const fondSport = operations
        ?.filter(o => o.categorie === 'sport' || o.libelle?.toLowerCase().includes('sport'))
        .reduce((sum, o) => {
          const montant = Number(o.montant);
          return o.type_operation === 'entree' ? sum + montant : sum - montant;
        }, 0) || 0;

      // Récupérer les sanctions impayées
      const { data: sanctionsData } = await supabase
        .from("reunions_sanctions")
        .select("montant_amende, statut");
      
      const totalSanctions = sanctionsData?.reduce((sum, s) => sum + Number(s.montant_amende || 0), 0) || 0;
      const sanctionsImpayees = totalSanctions - sanctionsEncaissees;

      // Calcul du taux de recouvrement des sanctions
      const tauxRecouvrement = totalSanctions > 0 
        ? Math.round((sanctionsEncaissees / totalSanctions) * 100) 
        : 100;

      // Prêts en cours = décaissés - remboursés
      const pretsEnCours = pretsDecaisses - pretsRembourses;

      // Reliquat cotisations = cotisations - distributions aux bénéficiaires
      const reliquatCotisations = totalCotisations - totalDistributionsBeneficiaires;

      // Fond total = toutes entrées - toutes sorties
      const totalEntrees = operations
        ?.filter(o => o.type_operation === 'entree')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const totalSorties = operations
        ?.filter(o => o.type_operation === 'sortie')
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      const fondTotal = totalEntrees - totalSorties;

      return {
        fondTotal,
        totalEpargnes,
        totalCotisations,
        sanctionsEncaissees,
        sanctionsImpayees,
        aidesDistribuees,
        pretsDecaisses,
        pretsRembourses,
        pretsEnCours,
        fondSport,
        reliquatCotisations,
        totalDistributionsBeneficiaires,
        tauxRecouvrement,
      };
    },
  });
};
