import { useState, useEffect } from "react";
import { Plus, Edit, TrendingUp, PiggyBank, DollarSign, Calculator, Download, Filter, X, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { ExportService } from '@/lib/exportService';
import { useAllEpargnes, useCreateEpargne, useUpdateEpargne, useDeleteEpargne } from "@/hooks/useEpargnes";

interface Epargne {
  id: string;
  membre_id: string;
  montant: number;
  date_depot: string;
  exercice_id?: string;
  reunion_id?: string;
  statut: string;
  notes?: string;
  membres?: {
    nom: string;
    prenom: string;
  } | null;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface Reunion {
  id: string;
  sujet: string;
  date_reunion: string;
}

interface Exercice {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: string;
}

export default function Epargnes() {
  const { data: epargnes = [], isLoading: loading } = useAllEpargnes();
  const createEpargne = useCreateEpargne();
  const updateEpargne = useUpdateEpargne();
  const deleteEpargne = useDeleteEpargne();
  
  const [membres, setMembres] = useState<Membre[]>([]);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEpargne, setSelectedEpargne] = useState<Epargne | null>(null);
  const [filtresTemporaires, setFiltresTemporaires] = useState({
    dateDebut: "",
    dateFin: "",
    membreId: "all",
    exerciceId: "all",
    montantMin: "",
    montantMax: ""
  });
  const [filtresAppliques, setFiltresAppliques] = useState({
    dateDebut: "",
    dateFin: "",
    membreId: "all",
    exerciceId: "all",
    montantMin: "",
    montantMax: ""
  });
  const [loadingFiltre, setLoadingFiltre] = useState(false); // CORRECTION 8
  const [formData, setFormData] = useState({
    membre_id: "",
    montant: "",
    reunion_id: "",
    exercice_id: "",
    notes: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-remplir les dates selon l'exercice sélectionné
  useEffect(() => {
    if (filtresTemporaires.exerciceId && filtresTemporaires.exerciceId !== "all") {
      const exercice = exercices.find(ex => ex.id === filtresTemporaires.exerciceId);
      if (exercice) {
        setFiltresTemporaires(prev => ({
          ...prev,
          dateDebut: exercice.date_debut,
          dateFin: exercice.date_fin
        }));
      }
    } else if (filtresTemporaires.exerciceId === "all") {
      setFiltresTemporaires(prev => ({
        ...prev,
        dateDebut: "",
        dateFin: ""
      }));
    }
  }, [filtresTemporaires.exerciceId, exercices]);

  useEffect(() => {
    fetchMembres();
    fetchReunions();
    fetchExercices();
  }, []);

  const fetchMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select('id, sujet, date_reunion')
        .order('date_reunion', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReunions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des réunions:', error);
    }
  };

  const fetchExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, date_debut, date_fin, statut')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.montant || !formData.reunion_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires (membre, montant et réunion)",
        variant: "destructive",
      });
      return;
    }

    const epargneData = {
      membre_id: formData.membre_id,
      montant: parseFloat(formData.montant),
      date_depot: new Date().toISOString().split('T')[0],
      reunion_id: formData.reunion_id || null,
      exercice_id: formData.exercice_id || null,
      notes: formData.notes || null,
    };

    if (selectedEpargne) {
      updateEpargne.mutate(
        { id: selectedEpargne.id, ...epargneData },
        {
          onSuccess: () => {
            setShowAddDialog(false);
            setSelectedEpargne(null);
            setFormData({ membre_id: "", montant: "", reunion_id: "", exercice_id: "", notes: "" });
          }
        }
      );
    } else {
      createEpargne.mutate(epargneData, {
        onSuccess: () => {
          setShowAddDialog(false);
          setFormData({ membre_id: "", montant: "", reunion_id: "", exercice_id: "", notes: "" });
        }
      });
    }
  };

  const openEditDialog = (epargne: Epargne) => {
    setSelectedEpargne(epargne);
    setFormData({
      membre_id: epargne.membre_id,
      montant: epargne.montant.toString(),
      reunion_id: epargne.reunion_id || "",
      exercice_id: epargne.exercice_id || "",
      notes: epargne.notes || ""
    });
    setShowAddDialog(true);
  };

  const handleDelete = (epargneId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette épargne ?')) return;
    deleteEpargne.mutate(epargneId);
  };

  const totalEpargnes = epargnes.reduce((sum, epargne) => sum + epargne.montant, 0);
  const epargnesActives = epargnes.filter(e => e.statut === 'actif');

  // Fonction de filtrage hiérarchique (Exercice → Dates)
  const epargneFiltrees = epargnes.filter(epargne => {
    // 🎯 NIVEAU 1 : FILTRE PAR EXERCICE (prioritaire)
    if (filtresAppliques.exerciceId && filtresAppliques.exerciceId !== "all") {
      const exercice = exercices.find(ex => ex.id === filtresAppliques.exerciceId);
      if (exercice) {
        const dateDepot = new Date(epargne.date_depot);
        const dateDebutExercice = new Date(exercice.date_debut);
        const dateFinExercice = new Date(exercice.date_fin);
        
        // Vérifier que l'épargne est dans la période de l'exercice
        if (dateDepot < dateDebutExercice || dateDepot > dateFinExercice) {
          return false;
        }
      }
    }
    
    // 📅 NIVEAU 2 : FILTRE PAR DATES (précision supplémentaire)
    // Ces filtres s'appliquent EN PLUS du filtre exercice (si actif)
    if (filtresAppliques.dateDebut) {
      const dateDepot = new Date(epargne.date_depot);
      const dateDebut = new Date(filtresAppliques.dateDebut);
      if (dateDepot < dateDebut) {
        return false;
      }
    }
    
    if (filtresAppliques.dateFin) {
      const dateDepot = new Date(epargne.date_depot);
      const dateFin = new Date(filtresAppliques.dateFin);
      if (dateDepot > dateFin) {
        return false;
      }
    }
    
    // Filtre par membre
    if (filtresAppliques.membreId && filtresAppliques.membreId !== "all" && epargne.membre_id !== filtresAppliques.membreId) {
      return false;
    }
    
    // Filtre par montant minimum
    if (filtresAppliques.montantMin && epargne.montant < parseFloat(filtresAppliques.montantMin)) {
      return false;
    }
    
    // Filtre par montant maximum
    if (filtresAppliques.montantMax && epargne.montant > parseFloat(filtresAppliques.montantMax)) {
      return false;
    }
    
    return true;
  });

  const totalFiltre = epargneFiltrees.reduce((sum, e) => sum + e.montant, 0);
  const epargnantsUniques = new Set(epargneFiltrees.map(e => e.membre_id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <LogoHeader 
            title="Banque E2D - Épargnes"
            subtitle="Gérez les épargnes des membres avec intérêts en fin d'exercice"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/admin/beneficiaires')} variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            Voir les Bénéficiaires
          </Button>
          <Button variant="outline" onClick={async () => {
            await ExportService.export({
              type: 'epargnes',
              format: 'pdf',
              nom: 'Liste_des_Epargnes',
            });
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
              ],
              metadata: { author: 'E2D', dateGeneration: new Date(), association: 'Association E2D' }
            });
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Panneau de filtres avancés */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filtres Avancés
              </CardTitle>
              
              {/* Indicateurs de niveau de filtre actif */}
              {filtresAppliques.exerciceId && filtresAppliques.exerciceId !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  📊 Niveau 1: Exercice
                </Badge>
              )}
              {(filtresAppliques.dateDebut || filtresAppliques.dateFin) && (
                <Badge variant="outline" className="text-xs">
                  📅 Niveau 2: Dates
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtre par période */}
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={filtresTemporaires.dateDebut}
                onChange={(e) => setFiltresTemporaires(prev => ({ ...prev, dateDebut: e.target.value }))}
                min={filtresTemporaires.exerciceId !== "all" 
                  ? exercices.find(ex => ex.id === filtresTemporaires.exerciceId)?.date_debut 
                  : undefined}
                max={filtresTemporaires.exerciceId !== "all" 
                  ? exercices.find(ex => ex.id === filtresTemporaires.exerciceId)?.date_fin 
                  : undefined}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFin">Date fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={filtresTemporaires.dateFin}
                onChange={(e) => setFiltresTemporaires(prev => ({ ...prev, dateFin: e.target.value }))}
                min={filtresTemporaires.exerciceId !== "all" 
                  ? exercices.find(ex => ex.id === filtresTemporaires.exerciceId)?.date_debut 
                  : undefined}
                max={filtresTemporaires.exerciceId !== "all" 
                  ? exercices.find(ex => ex.id === filtresTemporaires.exerciceId)?.date_fin 
                  : undefined}
              />
            </div>

            {/* Filtre par membre */}
            <div className="space-y-2">
              <Label htmlFor="membreFiltre">Membre</Label>
              <Select 
                value={filtresTemporaires.membreId} 
                onValueChange={(value) => setFiltresTemporaires(prev => ({ ...prev, membreId: value }))}
              >
                <SelectTrigger id="membreFiltre">
                  <SelectValue placeholder="Tous les membres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les membres</SelectItem>
                  {membres.map((membre) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par exercice - CORRECTION 8: Ajout spinner */}
            <div className="space-y-2">
              <Label htmlFor="exerciceFiltre">Exercice</Label>
              <Select 
                value={filtresTemporaires.exerciceId} 
                disabled={loadingFiltre}
                onValueChange={async (value) => {
                  setLoadingFiltre(true);
                  setFiltresTemporaires(prev => ({ ...prev, exerciceId: value }));
                  // Debounce pour éviter trop de re-renders
                  await new Promise(resolve => setTimeout(resolve, 300));
                  setLoadingFiltre(false);
                }}
              >
                <SelectTrigger id="exerciceFiltre" className={loadingFiltre ? 'opacity-50' : ''}>
                  {loadingFiltre ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Chargement...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Tous les exercices" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les exercices</SelectItem>
                  {exercices.map((exercice) => (
                    <SelectItem key={exercice.id} value={exercice.id}>
                      {exercice.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par montant */}
            <div className="space-y-2">
              <Label htmlFor="montantMin">Montant minimum</Label>
              <Input
                id="montantMin"
                type="number"
                placeholder="0"
                value={filtresTemporaires.montantMin}
                onChange={(e) => setFiltresTemporaires(prev => ({ ...prev, montantMin: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montantMax">Montant maximum</Label>
              <Input
                id="montantMax"
                type="number"
                placeholder="Illimité"
                value={filtresTemporaires.montantMax}
                onChange={(e) => setFiltresTemporaires(prev => ({ ...prev, montantMax: e.target.value }))}
              />
            </div>
          </div>

          {/* Message d'information sur le filtrage hiérarchique */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-md text-sm">
            <p className="font-semibold mb-1 text-primary">🔍 Filtrage hiérarchique :</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              <li><strong>Niveau 1 (Exercice) :</strong> Sélectionnez un exercice pour limiter aux épargnes de sa période</li>
              <li><strong>Niveau 2 (Dates) :</strong> Affinez avec des dates personnalisées à l'intérieur de l'exercice</li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={() => setFiltresAppliques(filtresTemporaires)}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const resetFiltres = {
                  dateDebut: "",
                  dateFin: "",
                  membreId: "all",
                  exerciceId: "all",
                  montantMin: "",
                  montantMax: ""
                };
                setFiltresTemporaires(resetFiltres);
                setFiltresAppliques(resetFiltres);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>

          {/* Indicateur de résultats filtrés */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {epargneFiltrees.length} épargne(s) trouvée(s) • {epargnantsUniques} épargnant(s) • Total: {totalFiltre.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedEpargne(null);
              setFormData({ membre_id: "", montant: "", reunion_id: "", exercice_id: "", notes: "" });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Épargne
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedEpargne ? "Modifier l'épargne" : "Ajouter une épargne"}
              </DialogTitle>
              <DialogDescription>
                Enregistrez un dépôt d'épargne pour un membre
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="membre">Membre *</Label>
                <Select value={formData.membre_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, membre_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.prenom} {membre.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="montant">Montant (FCFA) *</Label>
                <Input
                  id="montant"
                  type="number"
                  placeholder="Ex: 25000"
                  value={formData.montant}
                  onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reunion">Réunion planifiée *</Label>
                <Select value={formData.reunion_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, reunion_id: value }))
                } required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une réunion planifiée" />
                  </SelectTrigger>
                  <SelectContent>
                    {reunions.map((reunion) => (
                      <SelectItem key={reunion.id} value={reunion.id}>
                        {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')} - {reunion.sujet || 'Réunion'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  L'épargne doit être rattachée à une réunion planifiée
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exercice">Exercice</Label>
                <Select 
                  value={formData.exercice_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, exercice_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un exercice (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercices.map((exercice) => (
                      <SelectItem key={exercice.id} value={exercice.id}>
                        {exercice.nom} ({new Date(exercice.date_debut).toLocaleDateString('fr-FR')} - {new Date(exercice.date_fin).toLocaleDateString('fr-FR')})
                        {exercice.statut === 'actif' && ' - Actif'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Associer à un exercice pour le suivi des intérêts
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes additionnelles..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedEpargne ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Épargnes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEpargnes.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre d'Épargnants</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(epargnes.map(e => e.membre_id)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargnes Actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {epargnesActives.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par Membre</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {epargnes.length > 0 ? Math.round(totalEpargnes / new Set(epargnes.map(e => e.membre_id)).size).toLocaleString() : 0} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information sur les intérêts */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Information sur les Intérêts</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p>
            Les épargnes sont rémunérées en fin d'exercice avec les intérêts provenant des revenus des prêts,
            répartis au prorata du montant épargné par chaque membre.
          </p>
        </CardContent>
      </Card>

      {/* Liste des épargnes */}
      <div className="grid gap-4">
        {epargneFiltrees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {epargnes.length === 0 ? "Aucune épargne enregistrée" : "Aucune épargne ne correspond aux filtres"}
              </p>
              <p className="text-sm text-muted-foreground">
                {epargnes.length === 0 ? "Ajoutez la première épargne pour commencer" : "Essayez de modifier les critères de filtrage"}
              </p>
            </CardContent>
          </Card>
        ) : (
          epargneFiltrees.map((epargne) => (
            <Card key={epargne.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {epargne.membre?.prenom} {epargne.membre?.nom}
                    </CardTitle>
                    <CardDescription>
                      Dépôt du {format(new Date(epargne.date_depot), "dd MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {epargne.montant.toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {epargne.statut}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {epargne.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{epargne.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(epargne)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(epargne.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}