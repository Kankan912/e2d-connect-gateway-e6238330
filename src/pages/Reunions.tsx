
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
          {selectedReunion ? (
            <ReunionSanctionsManager reunionId={selectedReunion.id} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Sélectionnez une réunion pour gérer les sanctions
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beneficiaires">
          <CalendrierBeneficiaires />
          <BeneficiairesReunionManager />
        </TabsContent>

        <TabsContent value="rappels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Rappels Automatiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Cette fonctionnalité permet d'envoyer automatiquement des rappels par email aux membres dont le taux de présence est en dessous d'un seuil configurable.
                </p>
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    ⚠️ Configuration requise
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Pour activer les rappels automatiques par email, vous devez configurer la clé API Resend. 
                    Veuillez contacter l'administrateur système pour finaliser cette configuration.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Fonctionnalités à venir :</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Configuration du seuil de présence minimum</li>
                    <li>Aperçu des membres concernés</li>
                    <li>Envoi manuel de rappels</li>
                    <li>Historique des rappels envoyés</li>
                    <li>Personnalisation des templates d'email</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
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
