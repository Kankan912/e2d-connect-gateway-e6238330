import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { 
  FileSpreadsheet, FileText, Download, TrendingUp, TrendingDown, 
  DollarSign, HandCoins, AlertTriangle, PiggyBank, Wallet, Calendar
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { addE2DHeader, addE2DFooter } from "@/lib/pdf-utils";
import type { CotisationWithJoins, PretWithJoins, SanctionWithJoins, EpargneWithJoins } from "@/types/supabase-joins";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const RapportsAdmin = () => {
  const [selectedExercice, setSelectedExercice] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");

  // Fetch exercices
  const { data: exercices } = useQuery({
    queryKey: ["exercices-rapports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices")
        .select("*")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch cotisations
  const { data: cotisations, isLoading: loadingCotisations } = useQuery({
    queryKey: ["rapports-cotisations", selectedExercice, dateDebut, dateFin],
    queryFn: async () => {
      let query = supabase
        .from("cotisations")
        .select(`
          id, montant, statut, date_paiement, created_at,
          membres(id, nom, prenom),
          cotisations_types(id, nom),
          exercice_id,
          reunion_id,
          reunions(date_reunion)
        `)
        .order("created_at", { ascending: false });

      if (selectedExercice !== "all") {
        query = query.eq("exercice_id", selectedExercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const typed = (data || []) as unknown as CotisationWithJoins[];
      
      // Filtrage par date
      if (dateDebut || dateFin) {
        return typed.filter(c => {
          const date = c.date_paiement || c.created_at;
          if (!date) return true;
          const d = parseISO(date);
          if (dateDebut && dateFin) {
            return isWithinInterval(d, { start: parseISO(dateDebut), end: parseISO(dateFin) });
          } else if (dateDebut) {
            return d >= parseISO(dateDebut);
          } else if (dateFin) {
            return d <= parseISO(dateFin);
          }
          return true;
        });
      }
      return typed;
    },
  });

  // Fetch prêts
  const { data: prets, isLoading: loadingPrets } = useQuery({
    queryKey: ["rapports-prets", selectedExercice, dateDebut, dateFin],
    queryFn: async () => {
      let query = supabase
        .from("prets")
        .select(`
          id, montant, montant_paye, montant_total_du, statut, date_pret, echeance,
          taux_interet, interet_paye, capital_paye, reconductions,
          membres(id, nom, prenom)
        `)
        .order("date_pret", { ascending: false });

      if (selectedExercice !== "all") {
        query = query.eq("exercice_id", selectedExercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const typed = (data || []) as unknown as PretWithJoins[];
      
      if (dateDebut || dateFin) {
        return typed.filter(p => {
          const d = parseISO(p.date_pret);
          if (dateDebut && dateFin) {
            return isWithinInterval(d, { start: parseISO(dateDebut), end: parseISO(dateFin) });
          } else if (dateDebut) {
            return d >= parseISO(dateDebut);
          } else if (dateFin) {
            return d <= parseISO(dateFin);
          }
          return true;
        });
      }
      return typed;
    },
  });

  // Fetch sanctions
  const { data: sanctions, isLoading: loadingSanctions } = useQuery({
    queryKey: ["rapports-sanctions", selectedExercice, dateDebut, dateFin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reunions_sanctions")
        .select(`
          id,
          montant_amende,
          statut,
          motif,
          created_at,
          membre_id,
          membres(id, nom, prenom)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const typed = (data || []) as unknown as SanctionWithJoins[];
      
      if (dateDebut || dateFin) {
        return typed.filter(s => {
          const d = parseISO(s.created_at);
          if (dateDebut && dateFin) {
            return isWithinInterval(d, { start: parseISO(dateDebut), end: parseISO(dateFin) });
          } else if (dateDebut) {
            return d >= parseISO(dateDebut);
          } else if (dateFin) {
            return d <= parseISO(dateFin);
          }
          return true;
        });
      }
      return typed;
    },
  });

  // Fetch épargnes
  const { data: epargnes, isLoading: loadingEpargnes } = useQuery({
    queryKey: ["rapports-epargnes", selectedExercice, dateDebut, dateFin],
    queryFn: async () => {
      let query = supabase
        .from("epargnes")
        .select(`
          id, montant, date_depot, statut,
          membres(id, nom, prenom)
        `)
        .order("date_depot", { ascending: false });

      if (selectedExercice !== "all") {
        query = query.eq("exercice_id", selectedExercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const typed = (data || []) as unknown as EpargneWithJoins[];
      
      if (dateDebut || dateFin) {
        return typed.filter(e => {
          const d = parseISO(e.date_depot);
          if (dateDebut && dateFin) {
            return isWithinInterval(d, { start: parseISO(dateDebut), end: parseISO(dateFin) });
          } else if (dateDebut) {
            return d >= parseISO(dateDebut);
          } else if (dateFin) {
            return d <= parseISO(dateFin);
          }
          return true;
        });
      }
      return typed;
    },
  });

  // Fetch caisse operations
  const { data: caisseOps, isLoading: loadingCaisse } = useQuery({
    queryKey: ["rapports-caisse", selectedExercice, dateDebut, dateFin],
    queryFn: async () => {
      let query = supabase
        .from("fond_caisse_operations")
        .select(`
          id, montant, type_operation, categorie, libelle, date_operation
        `)
        .order("date_operation", { ascending: false });

      if (selectedExercice !== "all") {
        query = query.eq("exercice_id", selectedExercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (dateDebut || dateFin) {
        return data?.filter(op => {
          const d = parseISO(op.date_operation);
          if (dateDebut && dateFin) {
            return isWithinInterval(d, { start: parseISO(dateDebut), end: parseISO(dateFin) });
          } else if (dateDebut) {
            return d >= parseISO(dateDebut);
          } else if (dateFin) {
            return d <= parseISO(dateFin);
          }
          return true;
        });
      }
      return data;
    },
  });

  // Calculs agrégés pour cotisations
  const cotisationsStats = useMemo(() => {
    if (!cotisations) return null;
    
    const total = cotisations.reduce((sum, c) => sum + (c.montant || 0), 0);
    const paye = cotisations.filter(c => c.statut === "paye").reduce((sum, c) => sum + (c.montant || 0), 0);
    const partiel = cotisations.filter(c => c.statut === "partiel").reduce((sum, c) => sum + (c.montant || 0), 0);
    const impaye = cotisations.filter(c => c.statut === "impaye").reduce((sum, c) => sum + (c.montant || 0), 0);
    
    const parType = cotisations.reduce((acc: Record<string, number>, c) => {
      const type = c.cotisations_types?.nom || "Autre";
      acc[type] = (acc[type] || 0) + (c.montant || 0);
      return acc;
    }, {});

    const chartData = Object.entries(parType).map(([name, value]) => ({ name, value }));
    
    return { total, paye, partiel, impaye, tauxRecouvrement: total > 0 ? (paye / total * 100) : 0, chartData };
  }, [cotisations]);

  // Calculs agrégés pour prêts
  const pretsStats = useMemo(() => {
    if (!prets) return null;
    
    const encours = prets.filter(p => p.statut !== "rembourse");
    const rembourses = prets.filter(p => p.statut === "rembourse");
    const enRetard = prets.filter(p => p.statut !== "rembourse" && new Date(p.echeance) < new Date());
    
    const totalEncours = encours.reduce((sum, p) => sum + ((p.montant_total_du || p.montant) - (p.montant_paye || 0)), 0);
    const totalRembourse = rembourses.reduce((sum, p) => sum + (p.montant_paye || 0), 0);
    const interetsPercus = prets.reduce((sum, p) => sum + (p.interet_paye || 0), 0);
    
    return { 
      encours: encours.length, 
      rembourses: rembourses.length, 
      enRetard: enRetard.length,
      totalEncours,
      totalRembourse,
      interetsPercus
    };
  }, [prets]);

  // Calculs agrégés pour sanctions
  const sanctionsStats = useMemo(() => {
    if (!sanctions) return null;
    
    const total = sanctions.reduce((sum, s) => sum + (s.montant_amende || 0), 0);
    const paye = sanctions.filter(s => s.statut === "paye").reduce((sum, s) => sum + (s.montant_amende || 0), 0);
    const impaye = sanctions.filter(s => s.statut !== "paye").reduce((sum, s) => sum + (s.montant_amende || 0), 0);
    
    return { total, paye, impaye, count: sanctions.length };
  }, [sanctions]);

  // Calculs agrégés pour épargnes
  const epargnesStats = useMemo(() => {
    if (!epargnes) return null;
    
    const total = epargnes.reduce((sum, e) => sum + (e.montant || 0), 0);
    
    const parMembre = epargnes.reduce((acc: Record<string, number>, e) => {
      const key = e.membres ? `${e.membres.prenom} ${e.membres.nom}` : "Inconnu";
      acc[key] = (acc[key] || 0) + (e.montant || 0);
      return acc;
    }, {});
    
    const chartData = Object.entries(parMembre)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
    
    return { total, count: epargnes.length, chartData };
  }, [epargnes]);

  // Calculs agrégés pour caisse
  const caisseStats = useMemo(() => {
    if (!caisseOps) return null;
    
    const entrees = caisseOps.filter(op => op.type_operation === "entree").reduce((sum, op) => sum + (op.montant || 0), 0);
    const sorties = caisseOps.filter(op => op.type_operation === "sortie").reduce((sum, op) => sum + (op.montant || 0), 0);
    
    const parCategorie = caisseOps.reduce((acc: Record<string, { entrees: number, sorties: number }>, op) => {
      const cat = op.categorie || "autre";
      if (!acc[cat]) acc[cat] = { entrees: 0, sorties: 0 };
      if (op.type_operation === "entree") {
        acc[cat].entrees += op.montant || 0;
      } else {
        acc[cat].sorties += op.montant || 0;
      }
      return acc;
    }, {});

    const chartData = Object.entries(parCategorie).map(([name, data]) => ({
      name,
      entrees: data.entrees,
      sorties: data.sorties
    }));
    
    return { entrees, sorties, solde: entrees - sorties, chartData };
  }, [caisseOps]);

  // Helper to format membre name from join
  const formatMembre = (membres: { prenom: string; nom: string } | null): string => {
    return membres ? `${membres.prenom} ${membres.nom}` : "-";
  };

  // Export PDF
  const exportPDF = async (type: string) => {
    const doc = new jsPDF();
    const title = `Rapport ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const periode = selectedExercice !== "all" 
      ? exercices?.find(e => e.id === selectedExercice)?.nom 
      : dateDebut && dateFin 
        ? `${dateDebut} au ${dateFin}`
        : "Toutes périodes";
    
    // Ajouter l'en-tête E2D avec logo
    const startY = await addE2DHeader(doc, title, `Période : ${periode}`);

    let tableData: (string | number)[][] = [];
    let columns: string[] = [];

    if (type === "cotisations" && cotisations) {
      columns = ["Membre", "Type", "Montant", "Statut", "Date"];
      tableData = cotisations.map(c => [
        formatMembre(c.membres),
        c.cotisations_types?.nom || "-",
        `${(c.montant || 0).toLocaleString("fr-FR")} FCFA`,
        c.statut || "-",
        c.date_paiement ? format(parseISO(c.date_paiement), "dd/MM/yyyy") : "-"
      ]);
    } else if (type === "prets" && prets) {
      columns = ["Membre", "Montant", "Payé", "Reste", "Statut", "Échéance"];
      tableData = prets.map(p => [
        formatMembre(p.membres),
        `${(p.montant || 0).toLocaleString("fr-FR")} FCFA`,
        `${(p.montant_paye || 0).toLocaleString("fr-FR")} FCFA`,
        `${((p.montant_total_du || p.montant) - (p.montant_paye || 0)).toLocaleString("fr-FR")} FCFA`,
        p.statut,
        format(parseISO(p.echeance), "dd/MM/yyyy")
      ]);
    } else if (type === "sanctions" && sanctions) {
      columns = ["Membre", "Motif", "Montant", "Statut"];
      tableData = sanctions.map(s => [
        formatMembre(s.membres),
        s.motif || "-",
        `${(s.montant_amende || 0).toLocaleString("fr-FR")} FCFA`,
        s.statut
      ]);
    } else if (type === "epargnes" && epargnes) {
      columns = ["Membre", "Montant", "Date", "Statut"];
      tableData = epargnes.map(e => [
        formatMembre(e.membres),
        `${(e.montant || 0).toLocaleString("fr-FR")} FCFA`,
        format(parseISO(e.date_depot), "dd/MM/yyyy"),
        e.statut
      ]);
    }

    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: startY,
      headStyles: { fillColor: [30, 64, 175] },
    });

    // Ajouter le pied de page E2D
    addE2DFooter(doc);

    doc.save(`rapport-${type}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  // Export Excel
  const exportExcel = (type: string) => {
    let data: Record<string, string | number>[] = [];

    if (type === "cotisations" && cotisations) {
      data = cotisations.map(c => ({
        Membre: formatMembre(c.membres),
        Type: c.cotisations_types?.nom || "-",
        Montant: c.montant || 0,
        Statut: c.statut || "-",
        Date: c.date_paiement || ""
      }));
    } else if (type === "prets" && prets) {
      data = prets.map(p => ({
        Membre: formatMembre(p.membres),
        Montant: p.montant || 0,
        "Montant Total Dû": p.montant_total_du || p.montant,
        "Montant Payé": p.montant_paye || 0,
        Reste: (p.montant_total_du || p.montant) - (p.montant_paye || 0),
        Statut: p.statut,
        "Date Prêt": p.date_pret,
        Échéance: p.echeance
      }));
    } else if (type === "sanctions" && sanctions) {
      data = sanctions.map(s => ({
        Membre: formatMembre(s.membres),
        Motif: s.motif || "-",
        Montant: s.montant_amende || 0,
        Statut: s.statut,
        Date: s.created_at
      }));
    } else if (type === "epargnes" && epargnes) {
      data = epargnes.map(e => ({
        Membre: formatMembre(e.membres),
        Montant: e.montant || 0,
        "Date Dépôt": e.date_depot,
        Statut: e.statut
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `rapport-${type}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const isLoading = loadingCotisations || loadingPrets || loadingSanctions || loadingEpargnes || loadingCaisse;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports Financiers</h1>
          <p className="text-muted-foreground">Synthèse et export des données financières</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtres de période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Exercice</Label>
              <Select value={selectedExercice} onValueChange={setSelectedExercice}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les exercices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les exercices</SelectItem>
                  {exercices?.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date de début</Label>
              <Input 
                type="date" 
                value={dateDebut} 
                onChange={(e) => setDateDebut(e.target.value)} 
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input 
                type="date" 
                value={dateFin} 
                onChange={(e) => setDateFin(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="cotisations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cotisations" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cotisations
            </TabsTrigger>
            <TabsTrigger value="prets" className="flex items-center gap-2">
              <HandCoins className="h-4 w-4" />
              Prêts
            </TabsTrigger>
            <TabsTrigger value="sanctions" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Sanctions
            </TabsTrigger>
            <TabsTrigger value="epargnes" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Épargnes
            </TabsTrigger>
            <TabsTrigger value="caisse" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Caisse
            </TabsTrigger>
          </TabsList>

          {/* Tab Cotisations */}
          <TabsContent value="cotisations" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => exportPDF("cotisations")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportExcel("cotisations")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>

            {cotisationsStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total attendu</CardDescription>
                      <CardTitle className="text-2xl">{cotisationsStats.total.toLocaleString("fr-FR")} FCFA</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Payé</CardDescription>
                      <CardTitle className="text-2xl text-green-600">{cotisationsStats.paye.toLocaleString("fr-FR")} FCFA</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Impayé</CardDescription>
                      <CardTitle className="text-2xl text-red-600">{cotisationsStats.impaye.toLocaleString("fr-FR")} FCFA</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Taux de recouvrement</CardDescription>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {cotisationsStats.tauxRecouvrement.toFixed(1)}%
                        {cotisationsStats.tauxRecouvrement >= 80 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {cotisationsStats.chartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cotisationsStats.chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {cotisationsStats.chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value.toLocaleString("fr-FR")} FCFA`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab Prêts */}
          <TabsContent value="prets" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => exportPDF("prets")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportExcel("prets")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>

            {pretsStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Prêts en cours</CardDescription>
                    <CardTitle className="text-2xl">
                      {pretsStats.encours}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({pretsStats.totalEncours.toLocaleString("fr-FR")} FCFA)
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Prêts en retard</CardDescription>
                    <CardTitle className="text-2xl text-red-600">{pretsStats.enRetard}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Intérêts perçus</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {pretsStats.interetsPercus.toLocaleString("fr-FR")} FCFA
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            {prets && prets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Détail des prêts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membre</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Reste</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prets.slice(0, 10).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            {formatMembre(p.membres)}
                          </TableCell>
                          <TableCell>{(p.montant || 0).toLocaleString("fr-FR")} FCFA</TableCell>
                          <TableCell>
                            {((p.montant_total_du || p.montant) - (p.montant_paye || 0)).toLocaleString("fr-FR")} FCFA
                          </TableCell>
                          <TableCell>{format(parseISO(p.echeance), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={p.statut === "rembourse" ? "default" : p.statut === "en_cours" ? "secondary" : "destructive"}>
                              {p.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Sanctions */}
          <TabsContent value="sanctions" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => exportPDF("sanctions")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportExcel("sanctions")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>

            {sanctionsStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total sanctions</CardDescription>
                    <CardTitle className="text-2xl">{sanctionsStats.count}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Montant total</CardDescription>
                    <CardTitle className="text-2xl">{sanctionsStats.total.toLocaleString("fr-FR")} FCFA</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Payé</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{sanctionsStats.paye.toLocaleString("fr-FR")} FCFA</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Impayé</CardDescription>
                    <CardTitle className="text-2xl text-red-600">{sanctionsStats.impaye.toLocaleString("fr-FR")} FCFA</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab Épargnes */}
          <TabsContent value="epargnes" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => exportPDF("epargnes")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportExcel("epargnes")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>

            {epargnesStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total épargné</CardDescription>
                      <CardTitle className="text-2xl text-green-600">
                        {epargnesStats.total.toLocaleString("fr-FR")} FCFA
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Nombre de dépôts</CardDescription>
                      <CardTitle className="text-2xl">{epargnesStats.count}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {epargnesStats.chartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 épargnants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={epargnesStats.chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <YAxis dataKey="name" type="category" width={120} />
                            <Tooltip formatter={(value: number) => `${value.toLocaleString("fr-FR")} FCFA`} />
                            <Bar dataKey="value" fill="#22c55e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab Caisse */}
          <TabsContent value="caisse" className="space-y-4">
            {caisseStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total entrées</CardDescription>
                      <CardTitle className="text-2xl text-green-600">
                        +{caisseStats.entrees.toLocaleString("fr-FR")} FCFA
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total sorties</CardDescription>
                      <CardTitle className="text-2xl text-red-600">
                        -{caisseStats.sorties.toLocaleString("fr-FR")} FCFA
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Solde période</CardDescription>
                      <CardTitle className={`text-2xl ${caisseStats.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {caisseStats.solde >= 0 ? "+" : ""}{caisseStats.solde.toLocaleString("fr-FR")} FCFA
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {caisseStats.chartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mouvements par catégorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={caisseStats.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => `${value.toLocaleString("fr-FR")} FCFA`} />
                            <Legend />
                            <Bar dataKey="entrees" fill="#22c55e" name="Entrées" />
                            <Bar dataKey="sorties" fill="#ef4444" name="Sorties" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default RapportsAdmin;
