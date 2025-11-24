import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Euro, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import BackButton from "@/components/BackButton";

export default function StatsAdmin() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({
    membres: 0,
    donations: 0,
    cotisations: 0,
    epargnes: 0,
    adhesions: 0
  });

  useEffect(() => {
    fetchStats();
  }, [selectedYear]);

  const fetchStats = async () => {
    try {
      // Membres actifs
      const { count: membresCount } = await supabase
        .from('membres')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'actif');

      // Donations de l'année
      const { data: donationsData } = await supabase
        .from('donations')
        .select('amount')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`)
        .eq('payment_status', 'completed');

      const totalDonations = donationsData?.reduce((sum, d) => sum + d.amount, 0) || 0;

      // Cotisations de l'année
      const { data: cotisationsData } = await supabase
        .from('cotisations')
        .select('montant')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`)
        .eq('statut', 'paye');

      const totalCotisations = cotisationsData?.reduce((sum, c) => sum + c.montant, 0) || 0;

      // Épargnes de l'année
      const { data: epargnessData } = await supabase
        .from('epargnes')
        .select('montant')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      const totalEpargnes = epargnessData?.reduce((sum, e) => sum + e.montant, 0) || 0;

      // Adhésions de l'année
      const { count: adhesionsCount } = await supabase
        .from('adhesions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`)
        .eq('payment_status', 'completed');

      setStats({
        membres: membresCount || 0,
        donations: totalDonations,
        cotisations: totalCotisations,
        epargnes: totalEpargnes,
        adhesions: adhesionsCount || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Statistiques
          </h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble des données de l'association
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="finance">Finances</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="sport">Sport</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.membres}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de membres actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Donations {selectedYear}</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.donations.toLocaleString()} €</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total collecté cette année
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Adhésions {selectedYear}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adhesions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nouvelles adhésions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Finances {selectedYear}</CardTitle>
              <CardDescription>
                Récapitulatif financier de l'année
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Cotisations</span>
                  <span className="text-lg font-bold">{stats.cotisations.toLocaleString()} €</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Épargnes</span>
                  <span className="text-lg font-bold">{stats.epargnes.toLocaleString()} €</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Donations</span>
                  <span className="text-lg font-bold">{stats.donations.toLocaleString()} €</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded bg-primary/10">
                  <span className="font-bold">TOTAL</span>
                  <span className="text-xl font-bold">
                    {(stats.cotisations + stats.epargnes + stats.donations).toLocaleString()} €
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Évolution Mensuelle</CardTitle>
                <CardDescription>Cotisations et épargnes par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <p className="text-muted-foreground">Graphique d'évolution mensuelle (Recharts)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <p className="text-muted-foreground">Graphique en secteurs (Recharts)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Adhésions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center border rounded">
                  <p className="text-muted-foreground">Graphique courbe (Recharts)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Membres actifs</span>
                    <Badge>{stats.membres}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Adhésions {selectedYear}</span>
                    <Badge variant="secondary">{stats.adhesions}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sport">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Sportive</CardTitle>
                <CardDescription>Matchs et résultats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <p className="text-muted-foreground">Graphique performance (Recharts)</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Matchs Joués</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">-</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Victoires</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">-</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Buts Marqués</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">-</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
