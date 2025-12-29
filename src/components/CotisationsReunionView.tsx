import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CotisationsReunionViewProps {
  reunionId: string;
  reunionStatut: string;
  reunionDate: string;
}

export default function CotisationsReunionView({ reunionId, reunionStatut, reunionDate }: CotisationsReunionViewProps) {
  // Charger les cotisations de la réunion (pour réunions passées)
  const { data: cotisationsPayees, isLoading: loadingCotisations } = useQuery({
    queryKey: ['cotisations-reunion', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          id,
          montant,
          statut,
          date_paiement,
          membre:membres(id, nom, prenom),
          type:cotisations_types(id, nom, montant_defaut)
        `)
        .eq('reunion_id', reunionId);
      
      if (error) throw error;
      return data;
    },
    enabled: reunionStatut === 'terminee'
  });

  // Charger les membres E2D actifs et types de cotisations (pour projections)
  const { data: membresE2D, isLoading: loadingMembres } = useQuery({
    queryKey: ['membres-e2d-actifs'],
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
    enabled: reunionStatut === 'planifie'
  });

  const { data: typesObligatoires, isLoading: loadingTypes } = useQuery({
    queryKey: ['types-cotisations-obligatoires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('id, nom, montant_defaut, obligatoire')
        .eq('obligatoire', true);
      
      if (error) throw error;
      return data;
    },
    enabled: reunionStatut === 'planifie'
  });

  // Charger les montants personnalisés par membre
  const { data: cotisationsMembres } = useQuery({
    queryKey: ['cotisations-membres-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_membres')
        .select('membre_id, type_cotisation_id, montant_personnalise')
        .eq('actif', true);
      
      if (error) throw error;
      return data;
    },
    enabled: reunionStatut === 'planifie'
  });

  const isLoading = loadingCotisations || loadingMembres || loadingTypes;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Vue pour réunion TERMINÉE - afficher les cotisations payées
  if (reunionStatut === 'terminee') {
    const totalPaye = cotisationsPayees?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
    const nbCotisations = cotisationsPayees?.length || 0;

    // Grouper par type de cotisation
    const parType = cotisationsPayees?.reduce((acc, c) => {
      const typeNom = c.type?.nom || 'Autre';
      if (!acc[typeNom]) {
        acc[typeNom] = { total: 0, count: 0 };
      }
      acc[typeNom].total += c.montant || 0;
      acc[typeNom].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Cotisations Collectées
            <Badge className="bg-success text-success-foreground ml-2">
              Réunion terminée
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-success/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-success">{totalPaye.toLocaleString()} €</p>
              <p className="text-sm text-muted-foreground">Total collecté</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{nbCotisations}</p>
              <p className="text-sm text-muted-foreground">Cotisations payées</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{Object.keys(parType || {}).length}</p>
              <p className="text-sm text-muted-foreground">Types de cotisations</p>
            </div>
          </div>

          {/* Par type de cotisation */}
          {parType && Object.keys(parType).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Par type de cotisation</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(parType).map(([type, data]) => (
                  <div key={type} className="bg-muted/50 rounded-lg p-3">
                    <p className="font-medium text-sm">{type}</p>
                    <p className="text-lg font-bold">{data.total.toLocaleString()} €</p>
                    <p className="text-xs text-muted-foreground">{data.count} paiement(s)</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tableau détaillé */}
          {cotisationsPayees && cotisationsPayees.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotisationsPayees.map((cotisation) => (
                    <TableRow key={cotisation.id}>
                      <TableCell className="font-medium">
                        {cotisation.membre?.prenom} {cotisation.membre?.nom}
                      </TableCell>
                      <TableCell>{cotisation.type?.nom || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {cotisation.montant?.toLocaleString()} €
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Payé
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune cotisation enregistrée pour cette réunion</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Vue pour réunion PLANIFIÉE - afficher les projections
  if (reunionStatut === 'planifie') {
    // Calculer les projections par membre
    const projections = membresE2D?.map(membre => {
      const montantsAttendus = typesObligatoires?.map(type => {
        // Chercher montant personnalisé
        const configPerso = cotisationsMembres?.find(
          cm => cm.membre_id === membre.id && cm.type_cotisation_id === type.id
        );
        const montant = configPerso?.montant_personnalise || type.montant_defaut || 0;
        return { type: type.nom, montant };
      }) || [];
      
      const totalAttendu = montantsAttendus.reduce((sum, m) => sum + m.montant, 0);
      
      return {
        membre,
        montantsAttendus,
        totalAttendu
      };
    }) || [];

    const totalProjection = projections.reduce((sum, p) => sum + p.totalAttendu, 0);
    const nbMembres = membresE2D?.length || 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-warning" />
            Projection des Cotisations
            <Badge variant="secondary" className="ml-2">
              <Clock className="w-3 h-3 mr-1" />
              Réunion planifiée
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé projection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-warning/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-warning">{totalProjection.toLocaleString()} €</p>
              <p className="text-sm text-muted-foreground">Total attendu</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{nbMembres}</p>
              <p className="text-sm text-muted-foreground">Membres E2D</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{typesObligatoires?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Types obligatoires</p>
            </div>
          </div>

          {/* Types de cotisations obligatoires */}
          {typesObligatoires && typesObligatoires.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Cotisations obligatoires</h4>
              <div className="flex flex-wrap gap-2">
                {typesObligatoires.map(type => (
                  <Badge key={type.id} variant="outline" className="px-3 py-1">
                    {type.nom}: {type.montant_defaut?.toLocaleString() || 0} €
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tableau des projections par membre */}
          {projections.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    {typesObligatoires?.map(type => (
                      <TableHead key={type.id} className="text-right">{type.nom}</TableHead>
                    ))}
                    <TableHead className="text-right font-bold">Total Attendu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projections.map((projection) => (
                    <TableRow key={projection.membre.id}>
                      <TableCell className="font-medium">
                        {projection.membre.prenom} {projection.membre.nom}
                      </TableCell>
                      {projection.montantsAttendus.map((m, idx) => (
                        <TableCell key={idx} className="text-right">
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                            {m.montant.toLocaleString()} €
                          </Badge>
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <span className="font-bold text-warning">
                          {projection.totalAttendu.toLocaleString()} €
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Ligne de total */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    {typesObligatoires?.map(type => {
                      const totalType = projections.reduce((sum, p) => {
                        const m = p.montantsAttendus.find(ma => ma.type === type.nom);
                        return sum + (m?.montant || 0);
                      }, 0);
                      return (
                        <TableCell key={type.id} className="text-right">
                          {totalType.toLocaleString()} €
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right text-lg text-warning">
                      {totalProjection.toLocaleString()} €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun membre E2D actif ou cotisation obligatoire configurée</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pour les autres statuts (en_cours, annulee)
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Sélectionnez une réunion planifiée ou terminée pour voir les cotisations</p>
      </CardContent>
    </Card>
  );
}
