import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Epargnant {
  id: string;
  membre_id: string;
  nom: string;
  prenom: string;
  montantEpargne: number;
  part: number;
  gainsEstimes: number;
  totalAttendu: number;
}

interface Exercice {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
}

interface Reunion {
  id: string;
  sujet: string;
  date_reunion: string;
}

interface Stats {
  totalEpargnes: number;
  totalInteretsPrets: number;
  nombreEpargnants: number;
}

export const useEpargnantsBenefices = () => {
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [selectedExerciceId, setSelectedExerciceId] = useState<string>("all");
  const [selectedReunionId, setSelectedReunionId] = useState<string>("all");
  const [epargnants, setEpargnants] = useState<Epargnant[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEpargnes: 0,
    totalInteretsPrets: 0,
    nombreEpargnants: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Charger les exercices
  useEffect(() => {
    const fetchExercices = async () => {
      try {
        const { data, error } = await supabase
          .from('exercices')
          .select('id, nom, date_debut, date_fin')
          .order('date_debut', { ascending: false });

        if (error) throw error;
        setExercices(data || []);
      } catch (error) {
        console.error('Erreur chargement exercices:', error);
      }
    };

    fetchExercices();
  }, []);

  // Charger les réunions selon l'exercice sélectionné
  useEffect(() => {
    const fetchReunions = async () => {
      try {
        let query = supabase
          .from('reunions')
          .select('id, sujet, date_reunion')
          .order('date_reunion', { ascending: false });

        if (selectedExerciceId !== "all") {
          const exercice = exercices.find(e => e.id === selectedExerciceId);
          if (exercice) {
            query = query
              .gte('date_reunion', exercice.date_debut)
              .lte('date_reunion', exercice.date_fin);
          }
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        setReunions(data || []);
      } catch (error) {
        console.error('Erreur chargement réunions:', error);
      }
    };

    fetchReunions();
  }, [selectedExerciceId, exercices]);

  // Charger les données des épargnants et calculer les bénéfices
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer toutes les épargnes avec les membres
        let epargnesQuery = supabase
          .from('epargnes')
          .select(`
            id,
            membre_id,
            montant,
            date_depot,
            exercice_id,
            reunion_id,
            membres:membre_id(id, nom, prenom)
          `)
          .eq('statut', 'actif');

        if (selectedExerciceId !== "all") {
          epargnesQuery = epargnesQuery.eq('exercice_id', selectedExerciceId);
        }

        if (selectedReunionId !== "all") {
          epargnesQuery = epargnesQuery.eq('reunion_id', selectedReunionId);
        }

        const { data: epargnesData, error: epargnesError } = await epargnesQuery;
        if (epargnesError) throw epargnesError;

        // 2. Récupérer les intérêts des prêts
        let pretsQuery = supabase
          .from('prets')
          .select('montant, taux_interet, interet_paye, exercice_id')
          .in('statut', ['actif', 'rembourse']);

        if (selectedExerciceId !== "all") {
          pretsQuery = pretsQuery.eq('exercice_id', selectedExerciceId);
        }

        const { data: pretsData, error: pretsError } = await pretsQuery;
        if (pretsError) throw pretsError;

        // 3. Calculer le total des intérêts des prêts
        const totalInterets = (pretsData || []).reduce((sum, pret) => {
          const interet = pret.interet_paye || (pret.montant * (pret.taux_interet || 10) / 100);
          return sum + interet;
        }, 0);

        // 4. Grouper les épargnes par membre
        const epargnesParMembre: { [membreId: string]: { membre: any; total: number } } = {};
        
        (epargnesData || []).forEach(epargne => {
          const membreId = epargne.membre_id;
          if (!epargnesParMembre[membreId]) {
            epargnesParMembre[membreId] = {
              membre: epargne.membres,
              total: 0
            };
          }
          epargnesParMembre[membreId].total += epargne.montant;
        });

        // 5. Calculer le total des épargnes
        const totalEpargnes = Object.values(epargnesParMembre).reduce(
          (sum, item) => sum + item.total, 0
        );

        // 6. Calculer les bénéfices pour chaque épargnant
        const epargnantsList: Epargnant[] = Object.entries(epargnesParMembre)
          .map(([membreId, data]) => {
            const part = totalEpargnes > 0 ? (data.total / totalEpargnes) * 100 : 0;
            const gainsEstimes = totalEpargnes > 0 
              ? (data.total / totalEpargnes) * totalInterets 
              : 0;
            
            return {
              id: membreId,
              membre_id: membreId,
              nom: data.membre?.nom || 'Inconnu',
              prenom: data.membre?.prenom || '',
              montantEpargne: data.total,
              part: part,
              gainsEstimes: gainsEstimes,
              totalAttendu: data.total + gainsEstimes
            };
          })
          .sort((a, b) => b.montantEpargne - a.montantEpargne);

        setEpargnants(epargnantsList);
        setStats({
          totalEpargnes,
          totalInteretsPrets: totalInterets,
          nombreEpargnants: epargnantsList.length
        });

      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données des épargnants",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedExerciceId, selectedReunionId, toast]);

  return {
    exercices,
    reunions,
    selectedExerciceId,
    setSelectedExerciceId,
    selectedReunionId,
    setSelectedReunionId,
    epargnants,
    stats,
    loading
  };
};
