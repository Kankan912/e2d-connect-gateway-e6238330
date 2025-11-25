import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { DonationsTable } from "@/components/admin/DonationsTable";
import { useDonations, useDonationStats } from "@/hooks/useDonations";
import { DollarSign, TrendingUp, Users, BarChart3, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors, tooltipStyles } from "@/lib/rechartsConfig";

export default function DonationsAdmin() {
  const [filters, setFilters] = useState({
    paymentMethod: "",
    paymentStatus: "",
  });

  const { data: donations, isLoading: donationsLoading } = useDonations(filters);
  const { data: stats, isLoading: statsLoading } = useDonationStats("month");

  const getDonationsChartData = () => {
    if (!donations) return [];
    
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    
    return mois.map((m, i) => {
      const monthStart = new Date(now.getFullYear(), i, 1);
      const monthEnd = new Date(now.getFullYear(), i + 1, 0);
      
      const montantMois = donations
        .filter(d => {
          const date = new Date(d.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

      return {
        mois: m,
        montant: montantMois
      };
    });
  };

  if (donationsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion des Dons</h1>
        <p className="text-muted-foreground mt-1">
          Administration et suivi de tous les dons reçus
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="donations">Liste des dons</TabsTrigger>
          <TabsTrigger value="recurring">Abonnements récurrents</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total du mois"
              value={`${stats?.currentMonth?.total || 0} €`}
              icon={DollarSign}
              trend={stats?.currentMonth?.trend || 0}
              trendLabel="vs mois dernier"
            />
            <StatCard
              title="Total de l'année"
              value={`${stats?.currentYear?.total || 0} €`}
              icon={TrendingUp}
              trend={stats?.currentYear?.trend || 0}
              trendLabel="vs année dernière"
            />
            <StatCard
              title="Nombre de donateurs"
              value={stats?.currentMonth?.donors || 0}
              icon={Users}
              description={`${stats?.currentMonth?.newDonors || 0} nouveaux ce mois`}
            />
            <StatCard
              title="Montant moyen"
              value={`${stats?.currentMonth?.average || 0} €`}
              icon={BarChart3}
              trend={stats?.currentMonth?.averageTrend || 0}
              trendLabel="vs mois dernier"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Évolution des dons</CardTitle>
              <CardDescription>Montants reçus sur 12 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={getDonationsChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip {...tooltipStyles} />
                  <Area 
                    type="monotone" 
                    dataKey="montant" 
                    stroke={chartColors.blue} 
                    fill={chartColors.blue} 
                    fillOpacity={0.3}
                    name="Montant (€)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Filtrer et rechercher dans les dons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Input placeholder="Rechercher..." />
                <Select
                  value={filters.paymentMethod}
                  onValueChange={(value) =>
                    setFilters({ ...filters, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Méthode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Virement</SelectItem>
                    <SelectItem value="helloasso">HelloAsso</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) =>
                    setFilters({ ...filters, paymentStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                    <SelectItem value="refunded">Remboursé</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ paymentMethod: "", paymentStatus: "" })}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liste des dons</CardTitle>
              <CardDescription>
                {donations?.length || 0} don(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DonationsTable donations={donations || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements récurrents</CardTitle>
              <CardDescription>Gestion des dons récurrents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Section à venir...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des paiements</CardTitle>
              <CardDescription>Gérer les méthodes de paiement actives</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Section à venir...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
