import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Coins } from "lucide-react";

interface CotisationsCumulAnnuelProps {
  exerciceId?: string;
}

export default function CotisationsCumulAnnuel({ exerciceId }: CotisationsCumulAnnuelProps) {
  // Récupérer l'exercice actif si non fourni
  const { data: exercice } = useQuery({
    queryKey: ['exercice-actif-cotisations', exerciceId],
    queryFn: async () => {
      if (exerciceId) {
        const { data, error } = await supabase
          .from('exercices')
          .select('*')
          .eq('id', exerciceId)
          .single();
        if (error) throw error;
        return data;
      }
      // Utiliser order + limit + maybeSingle pour gérer les cas de multiples exercices actifs
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .eq('statut', 'actif')
        .order('date_debut', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les membres E2D actifs
  const { data: membres } = useQuery({
    queryKey: ['membres-e2d-cumul'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true)
        .order('nom');
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les types de cotisations obligatoires
  const { data: typesCotisations } = useQuery({
    queryKey: ['types-cotisations-obligatoires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('*')
        .eq('obligatoire', true);
      if (error) throw error;
      return data;
    },
  });

  // Récupérer toutes les cotisations de l'exercice
  const { data: cotisations } = useQuery({
    queryKey: ['cotisations-exercice-cumul', exercice?.id],
    queryFn: async () => {
      if (!exercice?.id) return [];
      const { data, error } = await supabase
        .from('cotisations')
        .select('*')
        .eq('exercice_id', exercice.id)
        .eq('statut', 'paye');
      if (error) throw error;
      return data;
    },
    enabled: !!exercice?.id,
  });

  // Récupérer les configurations personnalisées par membre (pour types autres que mensuelle)
  const { data: configsMembres } = useQuery({
    queryKey: ['configs-cotisations-membres', exercice?.id],
    queryFn: async () => {
      if (!exercice?.id) return [];
      const { data, error } = await supabase
        .from('cotisations_membres')
        .select('*')
        .eq('exercice_id', exercice.id)
        .eq('actif', true);
      if (error) throw error;
      return data;
    },
    enabled: !!exercice?.id,
  });

  // Récupérer les cotisations mensuelles dédiées par membre
  const { data: cotisationsMensuelles } = useQuery({
    queryKey: ['cotisations-mensuelles-cumul', exercice?.id],
    queryFn: async () => {
      if (!exercice?.id) return [];
      const { data, error } = await supabase
        .from('cotisations_mensuelles_exercice')
        .select('membre_id, montant')
        .eq('exercice_id', exercice.id)
        .eq('actif', true);
      if (error) throw error;
      return data;
    },
    enabled: !!exercice?.id,
  });

  // Calculer le nombre de mois de l'exercice
  const calculateMonthsInExercice = () => {
    if (!exercice) return 12;
    const debut = new Date(exercice.date_debut);
    const fin = new Date(exercice.date_fin);
    const months = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth()) + 1;
    return Math.min(months, 12);
  };

  // Calculer le montant attendu pour un membre
  // Utilise cotisations_mensuelles_exercice pour la cotisation mensuelle
  const getMontantAttenduMembre = (membreId: string) => {
    if (!typesCotisations) return 0;
    const nbMois = calculateMonthsInExercice();
    
    return typesCotisations.reduce((total, type) => {
      const isCotisationMensuelle = type.nom.toLowerCase().includes('cotisation mensuelle');
      
      if (isCotisationMensuelle) {
        // Utiliser la table dédiée cotisations_mensuelles_exercice
        const configMensuelle = cotisationsMensuelles?.find(cm => cm.membre_id === membreId);
        const montantMensuel = configMensuelle?.montant ?? type.montant_defaut ?? 0;
        return total + (montantMensuel * nbMois);
      } else {
        // Utiliser cotisations_membres pour les autres types
        const configPerso = configsMembres?.find(
          c => c.membre_id === membreId && c.type_cotisation_id === type.id
        );
        const montantMensuel = configPerso?.montant_personnalise ?? type.montant_defaut ?? 0;
        return total + (montantMensuel * nbMois);
      }
    }, 0);
  };

  // Calculer le montant payé pour un membre
  const getMontantPayeMembre = (membreId: string) => {
    if (!cotisations) return 0;
    return cotisations
      .filter(c => c.membre_id === membreId)
      .reduce((total, c) => total + (c.montant || 0), 0);
  };

  // Calculer les statistiques pour chaque membre
  const membresStats = membres?.map(membre => {
    const attendu = getMontantAttenduMembre(membre.id);
    const paye = getMontantPayeMembre(membre.id);
    const progression = attendu > 0 ? (paye / attendu) * 100 : 0;
    
    return {
      ...membre,
      attendu,
      paye,
      progression: Math.min(progression, 100),
    };
  }).sort((a, b) => b.progression - a.progression);

  // Statistiques globales
  const totalAttendu = membresStats?.reduce((sum, m) => sum + m.attendu, 0) || 0;
  const totalPaye = membresStats?.reduce((sum, m) => sum + m.paye, 0) || 0;
  const progressionGlobale = totalAttendu > 0 ? (totalPaye / totalAttendu) * 100 : 0;

  const getProgressColor = (progression: number) => {
    if (progression >= 80) return 'bg-green-500';
    if (progression >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBadgeVariant = (progression: number): "default" | "secondary" | "destructive" => {
    if (progression >= 80) return 'default';
    if (progression >= 50) return 'secondary';
    return 'destructive';
  };

  if (!exercice) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun exercice actif trouvé
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Attendu</p>
                <p className="text-xl font-bold">{totalAttendu.toLocaleString()} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Payé</p>
                <p className="text-xl font-bold text-green-600">{totalPaye.toLocaleString()} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Membres</p>
                <p className="text-xl font-bold">{membres?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Progression Globale</p>
            <div className="flex items-center gap-3">
              <Progress value={progressionGlobale} className="h-3 flex-1" />
              <span className="font-bold">{progressionGlobale.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé par membre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Suivi Cumulatif Annuel - {exercice.nom}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead className="text-right">Attendu Annuel</TableHead>
                <TableHead className="text-right">Payé Cumulé</TableHead>
                <TableHead className="text-right">Reste à Payer</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membresStats?.map((membre) => (
                <TableRow key={membre.id}>
                  <TableCell className="font-medium">
                    {membre.prenom} {membre.nom}
                  </TableCell>
                  <TableCell className="text-right">
                    {membre.attendu.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {membre.paye.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Math.max(0, membre.attendu - membre.paye).toLocaleString()} FCFA
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={membre.progression} 
                        className={`h-2 w-24 ${getProgressColor(membre.progression)}`}
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {membre.progression.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getBadgeVariant(membre.progression)}>
                      {membre.progression >= 100 ? 'Complet' : 
                       membre.progression >= 80 ? 'À jour' : 
                       membre.progression >= 50 ? 'En cours' : 'En retard'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!membresStats || membresStats.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun membre E2D actif trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
