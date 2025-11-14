import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Calendar, TrendingUp } from "lucide-react";
import LogoHeader from "@/components/LogoHeader";
import BackButton from "@/components/BackButton";
import BeneficiairesReunionManager from "@/components/BeneficiairesReunionManager";
import CalendrierBeneficiaires from "@/components/CalendrierBeneficiaires";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Beneficiaires() {
  const [selectedReunionId, setSelectedReunionId] = useState<string>("");

  const { data: reunions } = useQuery({
    queryKey: ['reunions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions')
        .select('*')
        .order('date_reunion', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['beneficiaires-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select('montant_benefice, statut');
      
      if (error) throw error;
      
      const total = data?.reduce((sum, b) => sum + b.montant_benefice, 0) || 0;
      const paye = data?.filter(b => b.statut === 'paye').reduce((sum, b) => sum + b.montant_benefice, 0) || 0;
      const enAttente = data?.filter(b => b.statut === 'en_attente').reduce((sum, b) => sum + b.montant_benefice, 0) || 0;
      
      return { total, paye, enAttente, count: data?.length || 0 };
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <LogoHeader 
          title="Gestion des Bénéficiaires"
          subtitle="Suivez et gérez les attributions de bénéfices tontine"
        />
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bénéficiaires</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montants Payés</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.paye.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.enAttente.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gestion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gestion">
            <Gift className="w-4 h-4 mr-2" />
            Gestion des Bénéficiaires
          </TabsTrigger>
          <TabsTrigger value="calendrier">
            <Calendar className="w-4 h-4 mr-2" />
            Calendrier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une Réunion</CardTitle>
              <CardDescription>Choisissez une réunion pour gérer son bénéficiaire</CardDescription>
            </CardHeader>
            <CardContent>
              <select 
                className="w-full p-2 border rounded"
                value={selectedReunionId}
                onChange={(e) => setSelectedReunionId(e.target.value)}
              >
                <option value="">-- Sélectionner une réunion --</option>
                {reunions?.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.sujet} - {new Date(r.date_reunion).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <BeneficiairesReunionManager reunionId={selectedReunionId} />
        </TabsContent>

        <TabsContent value="calendrier">
          <CalendrierBeneficiaires />
        </TabsContent>
      </Tabs>
    </div>
  );
}
