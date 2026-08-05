import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatFCFA } from "@/lib/utils";
import { LoanService } from "@/domain/finance";
import { calculerResumePret } from "@/lib/pretCalculsService";

export interface Alerte {
  id: string;
  type: 'pret_retard' | 'sanction_impayee' | 'caisse_bas' | 'reunion_proche';
  niveau: 'info' | 'warning' | 'danger';
  titre: string;
  description: string;
  lien?: string;
  dateCreation: Date;
  membreId?: string;
  membreNom?: string;
  montant?: number;
}

export function useAlertesGlobales() {
  const { user } = useAuth();

  // Prêts en retard
  const { data: pretsRetard = [] } = useQuery({
    queryKey: ['alertes-prets-retard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('prets')
        .select(`
          id,
          montant,
          echeance,
          montant_paye,
          montant_total_du,
          taux_interet,
          interet_initial,
          reconductions,
          membre:membres!fk_prets_membre(id, nom, prenom)
        `)
        .in('statut', ['en_cours', 'partiel'])
        .lt('echeance', today);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Sanctions impayées
  const { data: sanctionsImpayees = [] } = useQuery({
    queryKey: ['alertes-sanctions-impayees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_sanctions')
        .select(`
          id,
          montant_amende,
          statut,
          created_at,
          membre:membres!reunions_sanctions_membre_id_fkey(id, nom, prenom),
          reunion:reunions!reunions_sanctions_reunion_id_fkey(date_reunion)
        `)
        .neq('statut', 'paye')
        .gt('montant_amende', 0);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Configuration caisse pour seuils
  const { data: caisseConfig } = useQuery({
    queryKey: ['caisse-config-alertes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caisse_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Solde caisse (via RPC serveur pour éviter la pagination)
  const { data: soldeCaisse } = useQuery({
    queryKey: ['solde-caisse-alertes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_solde_caisse');
      if (error) throw error;
      return Number(data) || 0;
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Réunions proches (7 jours)
  const { data: reunionsProches = [] } = useQuery({
    queryKey: ['alertes-reunions-proches'],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from('reunions')
        .select('id, date_reunion, ordre_du_jour, lieu_description')
        .gte('date_reunion', today.toISOString().split('T')[0])
        .lte('date_reunion', nextWeek.toISOString().split('T')[0])
        .eq('statut', 'planifiee');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Construire la liste des alertes
  const alertes: Alerte[] = [];

  // Alertes prêts en retard — via LoanService (Lot 3)
  pretsRetard.forEach((pret: any) => {
    const resume = calculerResumePret({
      montant: Number(pret.montant) || 0,
      taux_interet: Number(pret.taux_interet) || 5,
      interet_initial: pret.interet_initial ?? undefined,
      reconductions: pret.reconductions ?? 0,
      montant_paye: Number(pret.montant_paye) || 0,
    });
    // La colonne montant_total_du fait foi (elle intègre les reconductions déjà enregistrées)
    const totalDu = Number(pret.montant_total_du) || resume.totalDu;
    const totalPaye = Number(pret.montant_paye) || 0;
    const resteAPayer = Math.max(0, totalDu - totalPaye);
    const statut = LoanService.resolveStatus({
      montant: totalDu,
      montantPaye: totalPaye,
      echeance: pret.echeance,
      reconductions: pret.reconductions ?? 0,
    });
    if (statut !== "en_retard" && resteAPayer <= 0) return;

    const joursRetard = Math.floor(
      (Date.now() - new Date(pret.echeance).getTime()) / (1000 * 60 * 60 * 24),
    );
    alertes.push({
      id: `pret-${pret.id}`,
      type: "pret_retard",
      niveau: joursRetard >= 30 ? "danger" : "warning",
      titre: `Prêt en retard (${joursRetard}j)`,
      description: `${pret.membre?.prenom} ${pret.membre?.nom} - Reste ${formatFCFA(resteAPayer)}`,
      lien: "/dashboard/admin/finances/prets",
      dateCreation: new Date(pret.echeance),
      membreId: pret.membre?.id,
      membreNom: `${pret.membre?.prenom} ${pret.membre?.nom}`,
      montant: resteAPayer,
    });
  });

  // Alertes sanctions impayées
  sanctionsImpayees.forEach((sanction: any) => {
    alertes.push({
      id: `sanction-${sanction.id}`,
      type: 'sanction_impayee',
      niveau: 'warning',
      titre: 'Sanction impayée',
      description: `${sanction.membre?.prenom} ${sanction.membre?.nom} - ${formatFCFA(Number(sanction.montant_amende))}`,
      lien: '/dashboard/admin/reunions',
      dateCreation: new Date(sanction.created_at),
      membreId: sanction.membre?.id,
      membreNom: `${sanction.membre?.prenom} ${sanction.membre?.nom}`,
      montant: Number(sanction.montant_amende),
    });
  });

  // Alerte caisse basse
  const seuilAlerte = caisseConfig?.seuil_alerte_solde || 50000;
  if (soldeCaisse !== undefined && soldeCaisse < seuilAlerte) {
    alertes.push({
      id: 'caisse-basse',
      type: 'caisse_bas',
      niveau: soldeCaisse < seuilAlerte / 2 ? 'danger' : 'warning',
      titre: 'Solde caisse bas',
      description: `Solde actuel: ${formatFCFA(soldeCaisse)} (seuil: ${formatFCFA(seuilAlerte)})`,
      lien: '/dashboard/admin/caisse',
      dateCreation: new Date(),
      montant: soldeCaisse,
    });
  }

  // Alertes réunions proches
  reunionsProches.forEach((reunion: any) => {
    const dateReunion = new Date(reunion.date_reunion);
    const joursRestants = Math.ceil(
      (dateReunion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    alertes.push({
      id: `reunion-${reunion.id}`,
      type: 'reunion_proche',
      niveau: 'info',
      titre: joursRestants === 0 ? "Réunion aujourd'hui" : `Réunion dans ${joursRestants}j`,
      description: reunion.ordre_du_jour || reunion.lieu_description || 'Réunion à venir',
      lien: '/dashboard/admin/reunions',
      dateCreation: dateReunion,
    });
  });

  // Trier par niveau de gravité puis par date
  const niveauPoids = { danger: 3, warning: 2, info: 1 };
  alertes.sort((a, b) => {
    const poidsDiff = niveauPoids[b.niveau] - niveauPoids[a.niveau];
    if (poidsDiff !== 0) return poidsDiff;
    return b.dateCreation.getTime() - a.dateCreation.getTime();
  });

  const alertesCritiques = alertes.filter(a => a.niveau === 'danger' || a.niveau === 'warning');

  return {
    alertes,
    alertesCritiques,
    nombreTotal: alertes.length,
    nombreCritiques: alertesCritiques.length,
    pretsRetard: pretsRetard.length,
    sanctionsImpayees: sanctionsImpayees.length,
  };
}
