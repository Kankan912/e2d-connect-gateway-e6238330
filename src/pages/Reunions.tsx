
import { useState, useEffect, useMemo } from "react";
import CompteRenduActions from "@/components/CompteRenduActions";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Plus, 
  Search, 
  MapPin,
  Clock,
  FileText,
  Users,
  Edit,
  Trash2,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  BarChart3,
  UserCog,
  Mail,
  Coins,
  Lock,
  Gift,
  Unlock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReunionForm from "@/components/forms/ReunionForm";
import CompteRenduForm from "@/components/forms/CompteRenduForm";
import CompteRenduViewer from "@/components/CompteRenduViewer";
import ClotureReunionModal from "@/components/ClotureReunionModal";
import ReouvrirReunionModal from "@/components/ReouvrirReunionModal";
import NotifierReunionModal from "@/components/NotifierReunionModal";
import CalendrierBeneficiaires from "@/components/CalendrierBeneficiaires";
import BeneficiairesReunionWidget from "@/components/BeneficiairesReunionWidget";
import ReunionSanctionsManager from "@/components/ReunionSanctionsManager";
import ReunionPresencesManager from "@/components/ReunionPresencesManager";
import PresencesEtatAbsences from "@/components/PresencesEtatAbsences";
import PresencesRecapMensuel from "@/components/PresencesRecapMensuel";
import PresencesRecapAnnuel from "@/components/PresencesRecapAnnuel";
import PresencesHistoriqueMembre from "@/components/PresencesHistoriqueMembre";
import LogoHeader from "@/components/LogoHeader";
import CotisationsReunionView from "@/components/CotisationsReunionView";
import CotisationsGridView from "@/components/CotisationsGridView";
import CotisationsCumulAnnuel from "@/components/CotisationsCumulAnnuel";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import BackButton from "@/components/BackButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { useMembers } from "@/hooks/useMembers";

// Composant pour l'onglet Rappels
function RappelsTab() {
  const [joursAvant, setJoursAvant] = useState("2");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  // Récupérer les prochaines réunions
  const { data: prochReunions } = useQuery({
    queryKey: ["prochaines-reunions"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("reunions")
        .select("id, date_reunion, ordre_du_jour, lieu_description")
        .eq("statut", "planifie")
        .gte("date_reunion", today)
        .order("date_reunion", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les membres avec email
  const { data: membresAvecEmail } = useQuery({
    queryKey: ["membres-avec-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membres")
        .select("id, nom, prenom, email")
        .eq("statut", "actif")
        .not("email", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const handleSendReminders = async (testMode: boolean = false) => {
    setSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-presence-reminders", {
        body: { joursAvant: parseInt(joursAvant), testMode },
      });

      if (error) throw error;

      setLastResult(data);

      if (data.emailsSent > 0) {
        toast({
          title: testMode ? "Test réussi" : "Rappels envoyés",
          description: `${data.emailsSent} email(s) ${testMode ? "simulé(s)" : "envoyé(s)"} pour ${data.reunionsCount} réunion(s)`,
        });
      } else {
        toast({
          title: "Aucun rappel nécessaire",
          description: data.message || "Aucune réunion ou membre trouvé",
        });
      }
    } catch (error: unknown) {
      console.error("Erreur envoi rappels:", error);
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      setLastResult({ error: msg });
      toast({
        title: "Erreur",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration des Rappels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Envoyer les rappels X jours avant la réunion</Label>
                <Select value={joursAvant} onValueChange={setJoursAvant}>
                  <SelectTrigger className="w-48 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jour avant</SelectItem>
                    <SelectItem value="2">2 jours avant</SelectItem>
                    <SelectItem value="3">3 jours avant</SelectItem>
                    <SelectItem value="7">1 semaine avant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleSendReminders(true)}
                  disabled={sending}
                  variant="outline"
                >
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Tester (simulation)
                </Button>
                <Button
                  onClick={() => handleSendReminders(false)}
                  disabled={sending}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Envoyer maintenant
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Statistiques</h4>
              <div className="text-sm space-y-2">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Membres avec email :</span>
                  <Badge variant="secondary">{membresAvecEmail?.length || 0}</Badge>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prochaines réunions :</span>
                  <Badge variant="secondary">{prochReunions?.length || 0}</Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Résultat du dernier envoi */}
          {lastResult && (
            <div className={`rounded-lg p-4 ${lastResult.error ? "bg-destructive/10 border border-destructive/30" : "bg-success/10 border border-success/30"}`}>
              <div className="flex items-start gap-3">
                {lastResult.error ? (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">
                    {lastResult.error ? "Erreur" : "Résultat de l'envoi"}
                  </p>
                  {lastResult.error ? (
                    <p className="text-sm text-destructive">{lastResult.error}</p>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p>✉️ {lastResult.emailsSent} email(s) envoyé(s)</p>
                      {lastResult.emailsErrors > 0 && (
                        <p className="text-destructive">❌ {lastResult.emailsErrors} erreur(s)</p>
                      )}
                      <p className="text-muted-foreground">
                        Pour {lastResult.reunionsCount} réunion(s), {lastResult.membresCount} membre(s)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prochaines réunions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prochaines réunions planifiées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prochReunions && prochReunions.length > 0 ? (
            <div className="space-y-3">
              {prochReunions.map((reunion) => {
                const date = new Date(reunion.date_reunion);
                const joursRestants = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={reunion.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-primary/10 rounded-lg p-2 min-w-[50px]">
                        <p className="text-lg font-bold text-primary">{date.getDate()}</p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {date.toLocaleDateString("fr-FR", { month: "short" })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{reunion.ordre_du_jour || "Réunion"}</p>
                        {reunion.lieu_description && (
                          <p className="text-sm text-muted-foreground">{reunion.lieu_description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={joursRestants <= 2 ? "default" : "secondary"}>
                      {joursRestants === 0 ? "Aujourd'hui" : joursRestants === 1 ? "Demain" : `Dans ${joursRestants} jours`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              Aucune réunion planifiée à venir
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour l'onglet Cotisations avec sélecteur d'exercice
function CotisationsTabContent({ 
  reunions, 
  selectedReunion, 
  onSelectReunion 
}: { 
  reunions: Reunion[]; 
  selectedReunion: Reunion | null; 
  onSelectReunion: (r: Reunion) => void;
}) {
  const [selectedExercice, setSelectedExercice] = useState<string>("__init__");

  // Charger les exercices
  const { data: exercices } = useQuery({
    queryKey: ['exercices-cotisations-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, date_debut, date_fin, statut')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Pré-sélectionner l'exercice actif au chargement
  useEffect(() => {
    if (selectedExercice === "__init__" && exercices?.length) {
      const actif = exercices.find(e => e.statut === 'actif');
      setSelectedExercice(actif ? actif.id : "all");
    }
  }, [exercices, selectedExercice]);

  // Filtrer réunions par exercice
  const reunionsFiltrees = reunions.filter(r => {
    if (selectedExercice === "all") return true;
    const exercice = exercices?.find(e => e.id === selectedExercice);
    if (!exercice) return true;
    return r.date_reunion >= exercice.date_debut && r.date_reunion <= exercice.date_fin;
  });

  // Trouver l'exercice d'une réunion
  const getExerciceForReunion = (dateReunion: string) => {
    return exercices?.find(e => dateReunion >= e.date_debut && dateReunion <= e.date_fin);
  };

  // Grouper par mois
  const reunionsParMois = reunionsFiltrees.reduce((acc, r) => {
    const date = new Date(r.date_reunion);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = { label, reunions: [] };
    acc[key].reunions.push(r);
    return acc;
  }, {} as Record<string, { label: string; reunions: Reunion[] }>);

  const currentExercice = selectedReunion ? getExerciceForReunion(selectedReunion.date_reunion) : null;

  return (
    <Tabs defaultValue="par-reunion" className="space-y-4">
      <TabsList>
        <TabsTrigger value="par-reunion">Par Réunion</TabsTrigger>
        <TabsTrigger value="cumul-annuel">Suivi Annuel</TabsTrigger>
      </TabsList>
      
      <TabsContent value="par-reunion">
        <Card className="mb-4">
          <CardContent className="pt-6">
            {/* Sélecteur d'exercice */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <h3 className="font-semibold">Sélectionner une réunion</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Exercice :</span>
                <Select value={selectedExercice} onValueChange={setSelectedExercice}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tous les exercices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les exercices</SelectItem>
                    {exercices?.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nom} {e.statut === 'actif' && '(Actif)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Liste des réunions groupées par mois */}
            {Object.keys(reunionsParMois).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(reunionsParMois).map(([key, { label, reunions: reunionsMois }]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">{label}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {reunionsMois.map(reunion => {
                        const isSelected = selectedReunion?.id === reunion.id;
                        const nbCotisations = 0; // Sera enrichi par les queries
                        return (
                          <Button
                            key={reunion.id}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => onSelectReunion(reunion)}
                            className={`justify-start h-auto py-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-1 w-full">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="font-medium">
                                  {new Date(reunion.date_reunion).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </span>
                                {reunion.statut === 'terminee' && (
                                  <Lock className="w-3 h-3 ml-auto text-success" />
                                )}
                                {reunion.statut === 'planifie' && (
                                  <Clock className="w-3 h-3 ml-auto text-muted-foreground" />
                                )}
                                {reunion.statut === 'en_cours' && (
                                  <Users className="w-3 h-3 ml-auto text-warning" />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                                {reunion.statut === 'terminee' ? 'Clôturée' : 
                                 reunion.statut === 'planifie' ? 'Planifiée' : 
                                 reunion.statut === 'en_cours' ? 'En cours' : reunion.statut}
                              </span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Aucune réunion pour cet exercice
              </p>
            )}
          </CardContent>
        </Card>

        {/* Message explicatif selon le statut */}
        {selectedReunion && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            selectedReunion.statut === 'terminee' 
              ? 'bg-success/10 text-success border border-success/30' 
              : selectedReunion.statut === 'en_cours'
              ? 'bg-warning/10 text-warning border border-warning/30'
              : 'bg-primary/10 text-primary border border-primary/30'
          }`}>
            {selectedReunion.statut === 'terminee' && (
              <p className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Réunion clôturée - Vue en lecture seule avec comparaison attendu/payé</span>
              </p>
            )}
            {selectedReunion.statut === 'planifie' && (
              <p className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Réunion planifiée - Projection des cotisations attendues + saisie possible</span>
              </p>
            )}
            {selectedReunion.statut === 'en_cours' && (
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Réunion en cours - Saisie des cotisations activée</span>
              </p>
            )}
          </div>
        )}

        {selectedReunion ? (
          selectedReunion.statut === 'terminee' ? (
            // Vue comparative pour les réunions clôturées
            <CotisationsReunionView 
              reunionId={selectedReunion.id} 
              reunionStatut={selectedReunion.statut}
              reunionDate={selectedReunion.date_reunion}
              exerciceId={currentExercice?.id}
            />
          ) : (
            // Grille matricielle pour les réunions en cours ou planifiées
            <CotisationsGridView 
              reunionId={selectedReunion.id} 
              exerciceId={currentExercice?.id}
              isEditable={selectedReunion.statut === 'planifie' || selectedReunion.statut === 'en_cours'}
            />
          )
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Sélectionnez une réunion pour voir les cotisations</p>
              <p className="text-sm mt-2">
                • Réunion planifiée = projection des montants attendus<br/>
                • Réunion terminée = bilan comparatif attendu/payé
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="cumul-annuel">
        <CotisationsCumulAnnuel />
      </TabsContent>
    </Tabs>
  );
}

interface Reunion {
  id: string;
  sujet?: string;
  date_reunion: string;
  statut: string;
  ordre_du_jour: string;
  lieu_description: string;
  compte_rendu_url: string;
  lieu_membre_id?: string;
  beneficiaire_id?: string;
  taux_presence?: number;
}

export default function Reunions() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCompteRenduForm, setShowCompteRenduForm] = useState(false);
  const [showCompteRenduViewer, setShowCompteRenduViewer] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [showReouvrirModal, setShowReouvrirModal] = useState(false);
  const [showNotifierModal, setShowNotifierModal] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);
  const [editingReunion, setEditingReunion] = useState<Reunion | null>(null);
  const [selectedMembreId, setSelectedMembreId] = useState<string | null>(null);
  const [selectedMembreNom, setSelectedMembreNom] = useState<string>("");
  const [showHistoriqueMembre, setShowHistoriqueMembre] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // Charger tous les membres une fois pour éviter N+1 queries
  const { members } = useMembers();
  
  // Créer une Map pour lookups O(1) au lieu de requêtes individuelles
  const membresMap = useMemo(() => {
    return new Map(members?.map(m => [m.id, m]) || []);
  }, [members]);

  // Fonction helper pour afficher le nom d'un membre
  const getMemberName = (memberId: string | undefined | null) => {
    if (!memberId) return null;
    const membre = membresMap.get(memberId);
    return membre ? `${membre.prenom} ${membre.nom}` : null;
  };

  useEffect(() => {
    loadReunions();
  }, []);

  const loadReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select(`*`)
        .order('date_reunion', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }
      
      setReunions((data || []) as Reunion[]);
    } catch (error: unknown) {
      console.error('Erreur lors du chargement des réunions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions: " + (error instanceof Error ? error.message : "Erreur"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reunion: Reunion) => {
    setEditingReunion(reunion);
    setShowForm(true);
  };

  const handleDelete = async (reunionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) return;
    try {
      const { error } = await supabase.from('reunions').delete().eq('id', reunionId);
      if (error) throw error;
      toast({ title: "Succès", description: "Réunion supprimée avec succès" });
      loadReunions();
    } catch (error: unknown) {
      toast({ title: "Erreur", description: "Impossible de supprimer la réunion: " + (error instanceof Error ? error.message : "Erreur"), variant: "destructive" });
    }
  };

  const handleCompteRendu = (reunion: Reunion) => {
    setSelectedReunion(reunion);
    setShowCompteRenduForm(true);
  };

  const handleViewCompteRendu = (reunion: Reunion) => {
    setSelectedReunion(reunion);
    setShowCompteRenduViewer(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReunion(null);
    loadReunions();
  };

  const handleCompteRenduSuccess = () => {
    setShowCompteRenduForm(false);
    setSelectedReunion(null);
    loadReunions();
  };

  const filteredReunions = reunions.filter(reunion =>
    reunion.ordre_du_jour?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reunion.lieu_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "primary" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
  }) => (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  const getStatutBadge = (statut: string, tauxPresence?: number) => {
    switch (statut) {
      case 'planifie':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Planifiée
          </Badge>
        );
      case 'en_cours':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Users className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      case 'terminee':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-success text-success-foreground font-semibold">
              <Lock className="w-3 h-3 mr-1" />
              Clôturée
            </Badge>
            {tauxPresence !== undefined && tauxPresence !== null && (
              <Badge 
                variant={tauxPresence >= 75 ? 'default' : tauxPresence >= 50 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {tauxPresence}%
              </Badge>
            )}
          </div>
        );
      case 'annulee':
        return (
          <Badge variant="destructive">
            Annulée
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Gestion des Réunions"
          subtitle="Planification et suivi des réunions"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const reunionsPlanifiees = reunions.filter(r => r.statut === 'planifie').length;
  const reunionsTerminees = reunions.filter(r => r.statut === 'terminee').length;
  const reunionsEnCours = reunions.filter(r => r.statut === 'en_cours').length;
  const reunionsMois = reunions.filter(r => {
    const date = new Date(r.date_reunion);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <LogoHeader 
            title="Gestion des Réunions"
            subtitle="Planification et suivi des réunions"
          />
        </div>
        {hasPermission('reunions', 'create') && (
          <Button 
            className="bg-gradient-to-r from-primary to-secondary"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle réunion
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Planifiées"
          value={reunionsPlanifiees}
          icon={Calendar}
          color="secondary"
        />
        <StatCard
          title="En Cours"
          value={reunionsEnCours}
          icon={Users}
          color="warning"
        />
        <StatCard
          title="Terminées"
          value={reunionsTerminees}
          icon={FileText}
          color="success"
        />
        <StatCard
          title="Ce Mois"
          value={reunionsMois}
          icon={Calendar}
          color="primary"
        />
      </div>

      {/* Tabs pour Réunions, Présences et Bénéficiaires */}
      <Tabs defaultValue="reunions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="reunions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Réunions
          </TabsTrigger>
          <TabsTrigger value="cotisations" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Cotisations
          </TabsTrigger>
          <TabsTrigger value="presences" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Présences
          </TabsTrigger>
          <TabsTrigger value="etat-absences" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            État Absences
          </TabsTrigger>
          <TabsTrigger value="recapitulatifs" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Récapitulatifs
          </TabsTrigger>
          <TabsTrigger value="historique" className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="sanctions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sanctions
          </TabsTrigger>
          <TabsTrigger value="beneficiaires" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Bénéficiaires
          </TabsTrigger>
          <TabsTrigger value="rappels" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Rappels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reunions">
          {/* Liste des réunions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendrier des Réunions
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Heure</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Membre hôte</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Ordre du jour</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Compte-rendu</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReunions.map((reunion) => (
                      <TableRow key={reunion.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">
                              {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(reunion.date_reunion).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatutBadge(reunion.statut, reunion.taux_presence)}
                        </TableCell>
                        
                        <TableCell>
                          {reunion.lieu_membre_id ? (
                            <span className="text-sm">
                              {getMemberName(reunion.lieu_membre_id) || 'Non défini'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non défini</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {reunion.beneficiaire_id ? (
                            <span className="text-sm">
                              {getMemberName(reunion.beneficiaire_id) || 'Non défini'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non défini</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <p className="text-sm">
                            {reunion.ordre_du_jour || "Non défini"}
                          </p>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <div>
                              {reunion.lieu_description && (
                                <p className="text-sm">{reunion.lieu_description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {reunion.compte_rendu_url ? (
                            reunion.compte_rendu_url === 'generated' ? (
                              <div className="flex gap-2">
                                <Badge className="bg-success text-success-foreground">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Disponible
                                </Badge>
                                <Button variant="outline" size="sm" onClick={() => handleViewCompteRendu(reunion)}>
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedReunion(reunion);
                                  setShowCompteRenduForm(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                 {reunion.statut === 'terminee' && reunion.compte_rendu_url === 'generated' && (
                    <CompteRenduActions 
                      reunion={reunion}
                      onSuccess={loadReunions}
                    />
                  )}
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewCompteRendu(reunion)}>
                                    <FileText className="w-4 h-4 mr-1" />
                                    Voir
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedReunion(reunion);
                                  setShowCompteRenduForm(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            )
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompteRendu(reunion)}
                              className="text-primary"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Ajouter
                            </Button>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {/* Éditer */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(reunion)}
                              disabled={reunion.statut === 'terminee'}
                              title={reunion.statut === 'terminee' ? 'Réunion clôturée - Modifications bloquées' : 'Modifier'}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            {/* Supprimer */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(reunion.id)}
                              className="text-destructive hover:bg-destructive/10"
                              disabled={reunion.statut === 'terminee'}
                              title={reunion.statut === 'terminee' ? 'Réunion clôturée - Suppression bloquée' : 'Supprimer'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            {/* Notifier sans clôturer (réunions non terminées) */}
                            {reunion.statut !== 'terminee' && hasPermission('reunions', 'update') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReunion(reunion);
                                  setShowNotifierModal(true);
                                }}
                                title="Notifier sans clôturer"
                                className="text-primary"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {/* Rouvrir (réunions terminées) */}
                            {reunion.statut === 'terminee' && hasPermission('reunions', 'update') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReunion(reunion);
                                  setShowReouvrirModal(true);
                                }}
                                title="Rouvrir la réunion"
                                className="text-warning hover:bg-warning/10"
                              >
                                <Unlock className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredReunions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucune réunion trouvée" : "Aucune réunion planifiée"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cotisations">
          <CotisationsTabContent 
            reunions={reunions}
            selectedReunion={selectedReunion}
            onSelectReunion={setSelectedReunion}
          />
        </TabsContent>

        <TabsContent value="presences">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold">Sélectionner une réunion</h3>
              </div>
              <div className="space-y-2">
                {reunions.slice(0, 10).map(reunion => (
                  <Button
                    key={reunion.id}
                    variant={selectedReunion?.id === reunion.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedReunion(reunion)}
                    className="w-full justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')} - {reunion.ordre_du_jour}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          {selectedReunion ? (
            <ReunionPresencesManager reunionId={selectedReunion.id} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Sélectionnez une réunion pour gérer les présences
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="etat-absences">
          <PresencesEtatAbsences />
        </TabsContent>

        <TabsContent value="recapitulatifs">
          <Tabs defaultValue="mensuel" className="space-y-6">
            <TabsList>
              <TabsTrigger value="mensuel">Vue Mensuelle</TabsTrigger>
              <TabsTrigger value="annuel">Bilan Annuel</TabsTrigger>
            </TabsList>
            <TabsContent value="mensuel">
              <PresencesRecapMensuel />
            </TabsContent>
            <TabsContent value="annuel">
              <PresencesRecapAnnuel />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Membres</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Cliquez sur un membre dans n'importe quelle vue pour afficher son historique complet.
              </p>
              <p className="text-sm text-muted-foreground">
                Astuce : Les fiches individuelles sont accessibles depuis l'État des Absences ou les Récapitulatifs en cliquant sur le nom d'un membre.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sanctions">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">Sélectionner une réunion pour gérer les sanctions</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {reunions.slice(0, 12).map(reunion => (
                  <Button
                    key={reunion.id}
                    variant={selectedReunion?.id === reunion.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedReunion(reunion)}
                    className="justify-start truncate"
                  >
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          {selectedReunion ? (
            <ReunionSanctionsManager reunionId={selectedReunion.id} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Sélectionnez une réunion ci-dessus pour gérer les sanctions
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beneficiaires" className="space-y-4">
          {/* Sélecteur de réunion pour les bénéficiaires */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Sélectionner une réunion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {reunions.slice(0, 8).map(reunion => (
                  <Button
                    key={reunion.id}
                    variant={selectedReunion?.id === reunion.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedReunion(reunion)}
                    className="justify-start h-auto py-2"
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium">
                        {new Date(reunion.date_reunion).toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: 'short',
                          year: '2-digit'
                        })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {reunion.statut === 'terminee' ? 'Clôturée' : 
                         reunion.statut === 'planifie' ? 'Planifiée' : 'En cours'}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Widget des bénéficiaires avec réunion sélectionnée */}
          {selectedReunion ? (
            <BeneficiairesReunionWidget
              reunionId={selectedReunion.id}
              reunionDate={selectedReunion.date_reunion}
              isReadOnly={selectedReunion.statut === 'terminee'}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sélectionnez une réunion pour gérer les bénéficiaires</p>
              </CardContent>
            </Card>
          )}

          {/* Calendrier complet des bénéficiaires */}
          <CalendrierBeneficiaires />
        </TabsContent>

        <TabsContent value="rappels">
          <RappelsTab />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <ReunionForm
            initialData={editingReunion}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

        <Dialog open={showCompteRenduForm} onOpenChange={setShowCompteRenduForm}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background pb-4 border-b">
              <h2 className="text-lg font-semibold">
                {selectedReunion ? `Compte-rendu - ${selectedReunion.ordre_du_jour}` : 'Compte-rendu'}
              </h2>
            </div>
            <div className="py-4">
              {selectedReunion && (
                <CompteRenduForm
                  reunionId={selectedReunion.id}
                  ordreJour={selectedReunion.ordre_du_jour}
                  onSuccess={handleCompteRenduSuccess}
                  onCancel={() => setShowCompteRenduForm(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

      <CompteRenduViewer
        open={showCompteRenduViewer}
        onOpenChange={setShowCompteRenduViewer}
        reunion={selectedReunion}
        onEdit={() => {
          setShowCompteRenduViewer(false);
          setSelectedReunion(selectedReunion);
          setShowCompteRenduForm(true);
        }}
      />

      {selectedReunion && (
        <ClotureReunionModal
          open={showClotureModal}
          onOpenChange={setShowClotureModal}
          reunionId={selectedReunion.id}
          reunionData={{
            sujet: selectedReunion.sujet || '',
            date_reunion: selectedReunion.date_reunion
          }}
          onSuccess={loadReunions}
        />
      )}

      {/* Modal Rouvrir Réunion */}
      {selectedReunion && (
        <ReouvrirReunionModal
          open={showReouvrirModal}
          onOpenChange={setShowReouvrirModal}
          reunionId={selectedReunion.id}
          reunionData={{
            sujet: selectedReunion.sujet || selectedReunion.ordre_du_jour,
            date_reunion: selectedReunion.date_reunion
          }}
          onSuccess={() => {
            // Recharger les réunions ET réinitialiser la sélection pour forcer le rechargement des données liées
            loadReunions();
            // Réinitialiser puis resélectionner après un délai pour forcer le rechargement des composants enfants
            const currentId = selectedReunion.id;
            setSelectedReunion(null);
            setTimeout(() => {
              loadReunions().then(() => {
                // La réunion sera resélectionnée via l'UI si nécessaire
              });
            }, 100);
          }}
        />
      )}

      {/* Modal Notifier sans clôturer */}
      {selectedReunion && (
        <NotifierReunionModal
          open={showNotifierModal}
          onOpenChange={setShowNotifierModal}
          reunionId={selectedReunion.id}
          reunionData={{
            sujet: selectedReunion.sujet,
            date_reunion: selectedReunion.date_reunion,
            ordre_du_jour: selectedReunion.ordre_du_jour,
            lieu_description: selectedReunion.lieu_description
          }}
        />
      )}

      {/* Modal Historique Membre */}
      {selectedMembreId && (
        <PresencesHistoriqueMembre
          membreId={selectedMembreId}
          membreNom={selectedMembreNom}
          open={showHistoriqueMembre}
          onClose={() => {
            setShowHistoriqueMembre(false);
            setSelectedMembreId(null);
            setSelectedMembreNom("");
          }}
        />
      )}
    </div>
  );
}
