import { useState, useEffect } from "react";
import { Gift, Calendar, TrendingUp, AlertCircle, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import BackButton from "@/components/BackButton";
import BeneficiairesReunionManager from "@/components/BeneficiairesReunionManager";
import CalendrierBeneficiaires from "@/components/CalendrierBeneficiaires";
import { calculateSoldeNetBeneficiaire } from "@/lib/beneficiairesCalculs";

interface Reunion {
  id: string;
  sujet: string;
  date_reunion: string;
  statut: string;
}

interface Beneficiaire {
  id: string;
  reunion_id: string;
  membre_id: string;
  montant_benefice: number;
  statut: string;
  date_benefice_prevue: string;
  membres?: {
    nom: string;
    prenom: string;
  };
  reunions?: {
    sujet: string;
    date_reunion: string;
  };
}

export default function Beneficiaires() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [selectedReunionId, setSelectedReunionId] = useState<string>("");
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    paye: 0,
    impaye: 0,
    montantTotal: 0,
    montantPaye: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReunions();
  }, []);

  useEffect(() => {
    if (selectedReunionId) {
      fetchBeneficiaires();
    }
  }, [selectedReunionId]);

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select('*')
        .order('date_reunion', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReunions(data || []);
    } catch (error) {
      console.error('Erreur chargement réunions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions",
        variant: "destructive"
      });
    }
  };

  const fetchBeneficiaires = async () => {
    if (!selectedReunionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membres:membre_id(nom, prenom),
          reunions:reunion_id(sujet, date_reunion)
        `)
        .eq('reunion_id', selectedReunionId);

      if (error) throw error;

      const beneficiairesData = data || [];
      setBeneficiaires(beneficiairesData);

      // Calculer les statistiques
      const stats = beneficiairesData.reduce((acc, b) => ({
        total: acc.total + 1,
        paye: acc.paye + (b.statut === 'paye' ? 1 : 0),
        impaye: acc.impaye + (b.statut === 'impaye' ? 1 : 0),
        montantTotal: acc.montantTotal + b.montant_benefice,
        montantPaye: acc.montantPaye + (b.statut === 'paye' ? b.montant_benefice : 0)
      }), {
        total: 0,
        paye: 0,
        impaye: 0,
        montantTotal: 0,
        montantPaye: 0
      });

      setStats(stats);
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les bénéficiaires",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarquerPaye = async (beneficiaireId: string, montantNet: number) => {
    try {
      // Mettre à jour le statut du bénéficiaire
      const { error: updateError } = await supabase
        .from('reunion_beneficiaires')
        .update({
          statut: 'paye'
        })
        .eq('id', beneficiaireId);

      if (updateError) throw updateError;

      // Créer l'opération dans fond_caisse_operations
      const { data: userData } = await supabase.auth.getUser();
      const { data: membreData } = await supabase
        .from('membres')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single();

      if (membreData) {
        const beneficiaire = beneficiaires.find(b => b.id === beneficiaireId);
        await supabase
          .from('fond_caisse_operations')
          .insert({
            type_operation: 'sortie',
            montant: montantNet,
            libelle: `Paiement bénéficiaire tontine`,
            operateur_id: membreData.id,
            beneficiaire_id: beneficiaire?.membre_id,
            date_operation: new Date().toISOString()
          });
      }

      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès"
      });

      fetchBeneficiaires();
    } catch (error) {
      console.error('Erreur marquage paiement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold mt-4">Gestion des Bénéficiaires</h1>
          <p className="text-muted-foreground mt-2">
            Gérer les bénéficiaires de la tontine et les paiements
          </p>
        </div>
      </div>

      <Tabs defaultValue="liste" className="space-y-6">
        <TabsList>
          <TabsTrigger value="liste">Liste des Bénéficiaires</TabsTrigger>
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
          <TabsTrigger value="gestion">Gestion Réunion</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Payés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.paye}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Impayés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.impaye}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.montantTotal.toLocaleString()} €</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Montant Payé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.montantPaye.toLocaleString()} €</div>
              </CardContent>
            </Card>
          </div>

          {/* Sélection réunion */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une Réunion</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReunionId} onValueChange={setSelectedReunionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une réunion" />
                </SelectTrigger>
                <SelectContent>
                  {reunions.map((reunion) => (
                    <SelectItem key={reunion.id} value={reunion.id}>
                      {format(new Date(reunion.date_reunion), 'dd MMMM yyyy', { locale: fr })} - {reunion.sujet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Liste des bénéficiaires */}
          {selectedReunionId && (
            <Card>
              <CardHeader>
                <CardTitle>Bénéficiaires de la Réunion</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : beneficiaires.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun bénéficiaire pour cette réunion
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {beneficiaires.map((beneficiaire) => (
                      <div
                        key={beneficiaire.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">
                            {beneficiaire.membres?.nom} {beneficiaire.membres?.prenom}
                          </p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Montant: {beneficiaire.montant_benefice.toLocaleString()} €</span>
                      <span>Date prévue: {format(new Date(beneficiaire.date_benefice_prevue), 'dd/MM/yyyy')}</span>
                    </div>
                        </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={beneficiaire.statut === 'paye' ? 'default' : 'secondary'}>
                      {beneficiaire.statut === 'paye' ? (
                        <><Check className="w-3 h-3 mr-1" /> Payé</>
                      ) : (
                        <><X className="w-3 h-3 mr-1" /> Impayé</>
                      )}
                    </Badge>
                    {beneficiaire.statut !== 'paye' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarquerPaye(beneficiaire.id, beneficiaire.montant_benefice)}
                      >
                        Marquer comme payé
                      </Button>
                    )}
                  </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendrier">
          <CalendrierBeneficiaires />
        </TabsContent>

        <TabsContent value="gestion">
          <BeneficiairesReunionManager reunionId={selectedReunionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
