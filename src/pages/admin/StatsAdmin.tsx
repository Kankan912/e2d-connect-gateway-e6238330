import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Coins, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import BackButton from "@/components/BackButton";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartColors, tooltipStyles } from "@/lib/rechartsConfig";
import { formatFCFA } from "@/lib/utils";
export default function StatsAdmin() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState<any>({
    membres: 0,
    donations: 0,
    cotisations: [],
    epargnes: [],
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
        .select('montant, date_paiement')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`)
        .eq('statut', 'paye');

      // Épargnes de l'année
      const { data: epargnessData } = await supabase
        .from('epargnes')
        .select('montant, date_depot')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      // Adhésions de l'année avec date_inscription
      const { data: adhesionsData } = await supabase
        .from('membres')
        .select('date_inscription')
        .gte('date_inscription', `${selectedYear}-01-01`)
        .lte('date_inscription', `${selectedYear}-12-31`);

      setStats({
        membres: membresCount || 0,
        donations: totalDonations,
        cotisations: cotisationsData || [],
        epargnes: epargnessData || [],
        adhesions: adhesionsData?.length || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Données pour les graphiques
  const getMoisData = () => {
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return mois.map((m, i) => {
      const cotisationsMois = stats.cotisations?.filter((c: any) => 
        new Date(c.date_paiement).getMonth() === i
      ).reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0) || 0;
      
      const epargnesMois = stats.epargnes?.filter((e: any) => 
        new Date(e.date_depot).getMonth() === i
      ).reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0) || 0;

      return {
        mois: m,
        cotisations: cotisationsMois,
        epargnes: epargnesMois,
      };
    });
  };

  const getRevenusData = () => {
    const totalCotisations = stats.cotisations?.reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0) || 0;
    const totalEpargnes = stats.epargnes?.reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0) || 0;

    return [
      { nom: 'Cotisations', valeur: totalCotisations },
      { nom: 'Épargnes', valeur: totalEpargnes },
      { nom: 'Donations', valeur: stats.donations },
    ].filter(item => item.valeur > 0);
  };

  const getSportData = () => {
    return [
      { categorie: 'Phoenix', victoires: 12, nuls: 5, defaites: 3 },
      { categorie: 'E2D', victoires: 8, nuls: 4, defaites: 6 },
    ];
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl sm:text-3xl font-bold mt-4 flex items-center gap-2">
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
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFCFA(stats.donations)}</div>
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
                  <span className="text-lg font-bold">{formatFCFA(stats.cotisations?.reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0) || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Épargnes</span>
                  <span className="text-lg font-bold">{formatFCFA(stats.epargnes?.reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0) || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Donations</span>
                  <span className="text-lg font-bold">{formatFCFA(stats.donations)}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded bg-primary/10">
                  <span className="font-bold">TOTAL</span>
                  <span className="text-xl font-bold">
                    {formatFCFA((stats.cotisations?.reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0) || 0) + (stats.epargnes?.reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0) || 0) + stats.donations)}
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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getMoisData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip {...tooltipStyles} />
                    <Legend />
                    <Line type="monotone" dataKey="cotisations" stroke={chartColors.blue} name="Cotisations" />
                    <Line type="monotone" dataKey="epargnes" stroke={chartColors.green} name="Épargnes" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getRevenusData()}
                      dataKey="valeur"
                      nameKey="nom"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {getRevenusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getSportData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categorie" />
                    <YAxis />
                    <Tooltip {...tooltipStyles} />
                    <Legend />
                    <Bar dataKey="victoires" fill={chartColors.success} name="Victoires" />
                    <Bar dataKey="nuls" fill={chartColors.warning} name="Nuls" />
                    <Bar dataKey="defaites" fill={chartColors.danger} name="Défaites" />
                  </BarChart>
                </ResponsiveContainer>
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
