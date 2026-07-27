import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAssociation } from '@/contexts/AssociationContext';
import {
  useExerciseContributionSettings,
  useUpsertExerciseContributionSetting,
} from '@/hooks/useExerciseContributionSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Settings2 } from 'lucide-react';
import { formatFCFA } from '@/lib/utils';

interface ExerciceRow {
  id: string;
  nom: string;
  statut: string | null;
  date_debut: string;
  date_fin: string;
}

const ExerciseContributionSettingsAdmin = () => {
  const { currentAssociation } = useAssociation();
  const [exerciceId, setExerciceId] = useState<string>('');
  const [typeCotisation, setTypeCotisation] = useState('');
  const [montant, setMontant] = useState('');
  const [dateEffet, setDateEffet] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const { data: exercices = [], isLoading: loadingExercices } = useQuery({
    queryKey: ['exercices-contribution-settings'],
    queryFn: async (): Promise<ExerciceRow[]> => {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, statut, date_debut, date_fin')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExerciceRow[];
    },
  });

  const selectedExerciceId = exerciceId || exercices.find((e) => e.statut === 'actif')?.id || exercices[0]?.id || '';
  const selectedExercice = useMemo(
    () => exercices.find((e) => e.id === selectedExerciceId),
    [exercices, selectedExerciceId]
  );

  const { data: settings = [], isLoading: loadingSettings } = useExerciseContributionSettings(selectedExerciceId);
  const upsert = useUpsertExerciseContributionSetting();

  const canSubmit =
    !!currentAssociation?.id && !!selectedExerciceId && typeCotisation.trim().length > 0 && Number(montant) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await upsert.mutateAsync({
      association_id: currentAssociation!.id,
      exercice_id: selectedExerciceId,
      type_cotisation: typeCotisation.trim(),
      montant: Number(montant),
      date_effet: dateEffet,
      notes: notes.trim() || null,
      actif: true,
    });
    setTypeCotisation('');
    setMontant('');
    setNotes('');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Settings2 className="h-7 w-7 text-primary" />
          Paramètres de cotisation par exercice
        </h1>
        <p className="text-muted-foreground mt-1">
          Source unique des montants utilisés par le moteur de calcul des cotisations et des bénéficiaires.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exercice</CardTitle>
          <CardDescription>Sélectionnez l'exercice à paramétrer.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExercices ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Select value={selectedExerciceId} onValueChange={setExerciceId}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Choisir un exercice" />
              </SelectTrigger>
              <SelectContent>
                {exercices.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom} {e.statut === 'actif' ? '(Actif)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ajouter / mettre à jour un montant</CardTitle>
          <CardDescription>
            Un montant est identifié par le couple type de cotisation + date d'effet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="type_cotisation">Type de cotisation</Label>
              <Input
                id="type_cotisation"
                value={typeCotisation}
                onChange={(e) => setTypeCotisation(e.target.value)}
                placeholder="Cotisation mensuelle"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="montant">Montant (FCFA)</Label>
              <Input
                id="montant"
                type="number"
                min={0}
                step={100}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="5000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_effet">Date d'effet</Label>
              <Input
                id="date_effet"
                type="date"
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={1}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={!canSubmit || upsert.isPending}>
                {upsert.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Montants actifs {selectedExercice ? `— ${selectedExercice.nom}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSettings ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type de cotisation</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date d'effet</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.type_cotisation}</TableCell>
                    <TableCell className="text-right">{formatFCFA(s.montant)}</TableCell>
                    <TableCell>{new Date(s.date_effet).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.notes ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.actif ? 'default' : 'secondary'}>
                        {s.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {settings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun montant paramétré pour cet exercice
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExerciseContributionSettingsAdmin;
