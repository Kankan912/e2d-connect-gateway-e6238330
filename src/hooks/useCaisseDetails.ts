import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DetailType = 
  | 'fond_total' 
  | 'epargnes' 
  | 'cotisations' 
  | 'prets_decaisses' 
  | 'prets_en_cours' 
  | 'sanctions_encaissees' 
  | 'sanctions_impayees' 
  | 'aides' 
  | 'reliquat' 
  | 'fond_sport';

export interface CaisseDetailItem {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  type?: string;
  categorie?: string;
  membre_nom?: string;
  notes?: string;
}

export const useCaisseDetails = (type: DetailType | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['caisse-details', type],
    queryFn: async (): Promise<CaisseDetailItem[]> => {
      if (!type) return [];

      switch (type) {
        case 'fond_total': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              type_operation,
              categorie,
              beneficiaire:beneficiaire_id(nom, prenom)
            `)
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.type_operation === 'sortie' ? -op.montant : op.montant,
            type: op.type_operation,
            categorie: op.categorie,
            membre_nom: op.beneficiaire ? `${op.beneficiaire.prenom} ${op.beneficiaire.nom}` : undefined
          }));
        }

        case 'epargnes': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              notes,
              beneficiaire:beneficiaire_id(nom, prenom)
            `)
            .eq('categorie', 'epargne')
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.montant,
            membre_nom: op.beneficiaire ? `${op.beneficiaire.prenom} ${op.beneficiaire.nom}` : undefined,
            notes: op.notes
          }));
        }

        case 'cotisations': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              notes,
              beneficiaire:beneficiaire_id(nom, prenom)
            `)
            .eq('categorie', 'cotisation')
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.montant,
            membre_nom: op.beneficiaire ? `${op.beneficiaire.prenom} ${op.beneficiaire.nom}` : undefined,
            notes: op.notes
          }));
        }

        case 'prets_decaisses': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              beneficiaire:beneficiaire_id(nom, prenom)
            `)
            .eq('categorie', 'pret_decaissement')
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.montant,
            membre_nom: op.beneficiaire ? `${op.beneficiaire.prenom} ${op.beneficiaire.nom}` : undefined
          }));
        }

        case 'prets_en_cours': {
          const { data, error } = await supabase
            .from('prets')
            .select(`
              id,
              date_pret,
              montant,
              montant_paye,
              echeance,
              statut,
              membre:membre_id(nom, prenom)
            `)
            .in('statut', ['en_cours', 'partiel', 'reconduit'])
            .order('date_pret', { ascending: false });

          if (error) throw error;
          return (data || []).map((pret: any) => ({
            id: pret.id,
            date: pret.date_pret,
            libelle: `Prêt - Échéance: ${new Date(pret.echeance).toLocaleDateString('fr-FR')}`,
            montant: pret.montant - (pret.montant_paye || 0),
            type: pret.statut,
            membre_nom: pret.membre ? `${pret.membre.prenom} ${pret.membre.nom}` : undefined
          }));
        }

        case 'sanctions_encaissees': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              beneficiaire:beneficiaire_id(nom, prenom)
            `)
            .eq('categorie', 'sanction')
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.montant,
            membre_nom: op.beneficiaire ? `${op.beneficiaire.prenom} ${op.beneficiaire.nom}` : undefined
          }));
        }

        case 'sanctions_impayees': {
          const { data, error } = await supabase
            .from('reunions_sanctions')
            .select(`
              id,
              created_at,
              motif,
              montant_amende,
              statut,
              membre:membre_id(nom, prenom)
            `)
            .neq('statut', 'paye')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return (data || []).map((sanction: any) => ({
            id: sanction.id,
            date: sanction.created_at,
            libelle: sanction.motif || 'Sanction',
            montant: sanction.montant_amende || 0,
            type: sanction.statut,
            membre_nom: sanction.membre ? `${sanction.membre.prenom} ${sanction.membre.nom}` : undefined
          }));
        }

        case 'aides': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              beneficiaire:beneficiaire_id(nom, prenom)
            `)
            .eq('categorie', 'aide')
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.montant,
            membre_nom: op.beneficiaire ? `${op.beneficiaire.prenom} ${op.beneficiaire.nom}` : undefined
          }));
        }

        case 'reliquat': {
          // Récupérer les cotisations et distributions pour montrer le calcul
          const { data: cotisations, error: errCot } = await supabase
            .from('fond_caisse_operations')
            .select('montant')
            .eq('categorie', 'cotisation');

          const { data: distributions, error: errDist } = await supabase
            .from('fond_caisse_operations')
            .select('montant')
            .eq('categorie', 'distribution_beneficiaire');

          if (errCot || errDist) throw errCot || errDist;

          const totalCot = (cotisations || []).reduce((acc, c) => acc + (c.montant || 0), 0);
          const totalDist = (distributions || []).reduce((acc, d) => acc + (d.montant || 0), 0);

          return [
            { id: '1', date: '', libelle: 'Total Cotisations Collectées', montant: totalCot },
            { id: '2', date: '', libelle: 'Distributions aux Bénéficiaires', montant: -totalDist },
            { id: '3', date: '', libelle: 'Reliquat', montant: totalCot - totalDist, type: 'total' }
          ];
        }

        case 'fond_sport': {
          const { data, error } = await supabase
            .from('fond_caisse_operations')
            .select(`
              id,
              date_operation,
              libelle,
              montant,
              type_operation
            `)
            .eq('categorie', 'sport')
            .order('date_operation', { ascending: false })
            .limit(100);

          if (error) throw error;
          return (data || []).map((op: any) => ({
            id: op.id,
            date: op.date_operation,
            libelle: op.libelle,
            montant: op.type_operation === 'sortie' ? -op.montant : op.montant,
            type: op.type_operation
          }));
        }

        default:
          return [];
      }
    },
    enabled: enabled && !!type,
    staleTime: 10000,
  });
};

export const getDetailTitle = (type: DetailType): string => {
  const titles: Record<DetailType, string> = {
    fond_total: "Détail du Fond Total Caisse",
    epargnes: "Détail des Épargnes Collectées",
    cotisations: "Détail des Cotisations Encaissées",
    prets_decaisses: "Détail des Prêts Décaissés",
    prets_en_cours: "Détail des Prêts en Cours",
    sanctions_encaissees: "Détail des Sanctions Encaissées",
    sanctions_impayees: "Détail des Sanctions Impayées",
    aides: "Détail des Aides Distribuées",
    reliquat: "Calcul du Reliquat Cotisations",
    fond_sport: "Détail du Fond Sport"
  };
  return titles[type];
};
