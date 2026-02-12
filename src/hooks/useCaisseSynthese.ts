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
  // Nouveau: Solde empruntable
  soldeEmpruntable: number;
  pourcentageEmpruntable: number;
}

export const useCaisseSynthese = () => {
  return useQuery({
    queryKey: ["caisse-synthese"],
    queryFn: async (): Promise<CaisseSynthese> => {
      // Pagination: récupérer TOUTES les opérations par blocs de 1000
      const operations: Array<any> = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("fond_caisse_operations")
          .select("montant, type_operation, categorie, libelle")
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (data) operations.push(...data);
        hasMore = (data?.length || 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }

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

      // CORRECTION: Distributions bénéficiaires - inclure catégorie 'beneficiaire' OU libellé contenant 'bénéficiaire'
      const totalDistributionsBeneficiaires = operations
        ?.filter(o => o.type_operation === 'sortie' && 
          (o.categorie === 'beneficiaire' || o.libelle?.toLowerCase().includes('bénéficiaire')))
        .reduce((sum, o) => sum + Number(o.montant), 0) || 0;

      // CORRECTION: Fond sport - inclure catégorie 'sport' OU libellé contenant 'sport'
      const fondSport = operations
        ?.filter(o => o.categorie === 'sport' || o.libelle?.toLowerCase().includes('sport'))
        .reduce((sum, o) => {
          const montant = Number(o.montant);
          return o.type_operation === 'entree' ? sum + montant : sum - montant;
        }, 0) || 0;

      // Récupérer les sanctions impayées (avec montant_amende non null)
      const { data: sanctionsData } = await supabase
        .from("reunions_sanctions")
        .select("montant_amende, statut")
        .not("montant_amende", "is", null);
      
      const totalSanctions = sanctionsData?.reduce((sum, s) => sum + Number(s.montant_amende || 0), 0) || 0;
      const sanctionsImpayees = totalSanctions - sanctionsEncaissees;

      // Calcul du taux de recouvrement des sanctions
      const tauxRecouvrement = totalSanctions > 0 
        ? Math.round((sanctionsEncaissees / totalSanctions) * 100) 
        : 100;

      // CORRECTION: Prêts en cours = requête directe sur table prets (capital restant dû)
      const { data: pretsData } = await supabase
        .from("prets")
        .select("montant, capital_paye, statut")
        .in('statut', ['en_cours', 'partiel', 'reconduit']);
      
      const pretsEnCours = pretsData?.reduce((sum, p) => 
        sum + (Number(p.montant) - Number(p.capital_paye || 0)), 0) || 0;

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

      // Récupérer la configuration de la caisse pour le pourcentage empruntable
      const { data: caisseConfig } = await supabase
        .from("caisse_config")
        .select("pourcentage_empruntable")
        .limit(1)
        .maybeSingle();
      
      const pourcentageEmpruntable = caisseConfig?.pourcentage_empruntable || 80;
      
      // Solde empruntable = Fond total × pourcentage - Prêts en cours
      // C'est le montant disponible pour de nouveaux prêts
      const soldeEmpruntable = Math.max(0, (fondTotal * pourcentageEmpruntable / 100) - pretsEnCours);

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
        soldeEmpruntable,
        pourcentageEmpruntable,
      };
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
    staleTime: 10000, // Données considérées fraîches pendant 10s
  });
};
