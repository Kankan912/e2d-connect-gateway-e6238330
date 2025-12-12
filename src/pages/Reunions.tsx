
import { useState, useEffect } from "react";
import CompteRenduActions from "@/components/CompteRenduActions";
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
  BarChart3,
  UserCog,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReunionForm from "@/components/forms/ReunionForm";
import CompteRenduForm from "@/components/forms/CompteRenduForm";
import CompteRenduViewer from "@/components/CompteRenduViewer";
import ClotureReunionModal from "@/components/ClotureReunionModal";
import CalendrierBeneficiaires from "@/components/CalendrierBeneficiaires";
import BeneficiairesReunionManager from "@/components/BeneficiairesReunionManager";
import ReunionSanctionsManager from "@/components/ReunionSanctionsManager";
import ReunionPresencesManager from "@/components/ReunionPresencesManager";
import PresencesEtatAbsences from "@/components/PresencesEtatAbsences";
import PresencesRecapMensuel from "@/components/PresencesRecapMensuel";
import PresencesRecapAnnuel from "@/components/PresencesRecapAnnuel";
import PresencesHistoriqueMembre from "@/components/PresencesHistoriqueMembre";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import BackButton from "@/components/BackButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";

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
    } catch (error: any) {
      console.error("Erreur envoi rappels:", error);
      setLastResult({ error: error.message });
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer les rappels",
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
}

export default function Reunions() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCompteRenduForm, setShowCompteRenduForm] = useState(false);
  const [showCompteRenduViewer, setShowCompteRenduViewer] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);
  const [editingReunion, setEditingReunion] = useState<Reunion | null>(null);
  const [selectedMembreId, setSelectedMembreId] = useState<string | null>(null);
  const [selectedMembreNom, setSelectedMembreNom] = useState<string>("");
  const [showHistoriqueMembre, setShowHistoriqueMembre] = useState(false);
  const { toast } = useToast();

  // Composant pour afficher le nom du bénéficiaire
  const BeneficiaireName = ({ beneficiaireId }: { beneficiaireId: string }) => {
    const { data: membre } = useQuery({
      queryKey: ['membre', beneficiaireId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('membres')
          .select('nom, prenom')
          .eq('id', beneficiaireId)
          .single();
        if (error) throw error;
        return data;
      },
      enabled: !!beneficiaireId
    });

    return (
      <span className="text-sm">
        {membre ? `${membre.prenom} ${membre.nom}` : 'Chargement...'}
      </span>
    );
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
      
      setReunions((data || []) as any);
    } catch (error: any) {
      console.error('Erreur lors du chargement des réunions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions: " + error.message,
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
    } catch (error: any) {
      toast({ title: "Erreur", description: "Impossible de supprimer la réunion: " + error.message, variant: "destructive" });
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

  const getStatutBadge = (statut: string) => {
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
          <Badge className="bg-success text-success-foreground">
            <FileText className="w-3 h-3 mr-1" />
            Terminée
          </Badge>
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
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle réunion
        </Button>
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="reunions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Réunions
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
                          {getStatutBadge(reunion.statut)}
                        </TableCell>
                        
                        <TableCell>
                          {reunion.lieu_membre_id ? (
                            <BeneficiaireName beneficiaireId={reunion.lieu_membre_id} />
                          ) : (
                            <span className="text-muted-foreground text-sm">Non défini</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {reunion.beneficiaire_id ? (
                            <BeneficiaireName beneficiaireId={reunion.beneficiaire_id} />
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
                                <Button variant="outline" size="sm" asChild>
                                  <a href={reunion.compte_rendu_url} target="_blank" rel="noopener noreferrer">
                                    <FileText className="w-4 h-4 mr-1" />
                                    Voir
                                  </a>
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(reunion)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(reunion.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

        <TabsContent value="beneficiaires">
          <CalendrierBeneficiaires />
          <BeneficiairesReunionManager />
        </TabsContent>

        <TabsContent value="rappels">
          <RappelsTab />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <ReunionForm
            initialData={editingReunion as any}
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
