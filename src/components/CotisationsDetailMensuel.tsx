import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CalendarRange, Coins, Loader2, Search, FileDown, FileText, Users, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  exerciceId?: string;
}

type EquipeFiltre = "toutes" | "jaune" | "rouge";
type StatutFiltre = "tous" | "complet" | "a_jour" | "en_cours" | "en_retard";

interface MoisInfo {
  key: string; // YYYY-MM
  year: number;
  month: number; // 0-11
  label: string;
  isFuture: boolean;
  isCurrent: boolean;
}

export default function CotisationsDetailMensuel({ exerciceId }: Props) {
  const [search, setSearch] = useState("");
  const [filtreEquipe, setFiltreEquipe] = useState<EquipeFiltre>("toutes");
  const [filtreStatut, setFiltreStatut] = useState<StatutFiltre>("tous");

  const { data: exercice, isLoading: loadingExercice, error: errorExercice } = useQuery({
    queryKey: ["exercice-detail-mensuel", exerciceId],
    queryFn: async () => {
      if (exerciceId) {
        const { data, error } = await supabase
          .from("exercices")
          .select("id, nom, date_debut, date_fin, statut")
          .eq("id", exerciceId)
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("exercices")
        .select("id, nom, date_debut, date_fin, statut")
        .eq("statut", "actif")
        .order("date_debut", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: membres } = useQuery({
    queryKey: ["membres-e2d-detail-mensuel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membres")
        .select("id, nom, prenom, equipe_jaune_rouge")
        .eq("statut", "actif")
        .eq("est_membre_e2d", true)
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: typeMensuel } = useQuery({
    queryKey: ["type-cotisation-mensuelle", exercice?.id],
    queryFn: async () => {
      if (!exercice?.id) return null;
      const { data, error } = await supabase
        .from("exercices_cotisations_types")
        .select("cotisations_types(id, nom, montant_defaut)")
        .eq("exercice_id", exercice.id)
        .eq("actif", true);
      if (error) throw error;
      const types = (data || []).map((d: any) => d.cotisations_types).filter(Boolean);
      return types.find((t: any) => t.nom?.toLowerCase().includes("cotisation mensuelle")) ?? null;
    },
    enabled: !!exercice?.id,
  });

  const { data: cotisationsMensuelles } = useQuery({
    queryKey: ["cme-detail-mensuel", exercice?.id],
    queryFn: async () => {
      if (!exercice?.id) return [];
      const { data, error } = await supabase
        .from("cotisations_mensuelles_exercice")
        .select("membre_id, montant")
        .eq("exercice_id", exercice.id)
        .eq("actif", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!exercice?.id,
  });

  const { data: cotisations } = useQuery({
    queryKey: ["cotisations-detail-mensuel", exercice?.id, typeMensuel?.id],
    queryFn: async () => {
      if (!exercice?.id || !typeMensuel?.id) return [];
      const { data, error } = await supabase
        .from("cotisations")
        .select("id, membre_id, montant, statut, date_paiement, type_cotisation_id")
        .eq("exercice_id", exercice.id)
        .eq("type_cotisation_id", typeMensuel.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!exercice?.id && !!typeMensuel?.id,
  });

  const mois = useMemo<MoisInfo[]>(() => {
    if (!exercice) return [];
    const debut = new Date(exercice.date_debut);
    const fin = new Date(exercice.date_fin);
    const now = new Date();
    const result: MoisInfo[] = [];
    let y = debut.getFullYear();
    let m = debut.getMonth();
    const lastY = fin.getFullYear();
    const lastM = fin.getMonth();
    while (y < lastY || (y === lastY && m <= lastM)) {
      const d = new Date(y, m, 1);
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      result.push({
        key,
        year: y,
        month: m,
        label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        isFuture: y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth()),
        isCurrent: y === now.getFullYear() && m === now.getMonth(),
      });
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      if (result.length > 24) break;
    }
    return result;
  }, [exercice]);

  const getMontantAttendu = (membreId: string) => {
    const cm = cotisationsMensuelles?.find((c) => c.membre_id === membreId);
    return cm?.montant ?? typeMensuel?.montant_defaut ?? 0;
  };

  const paiementsParMembreMois = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    (cotisations ?? []).forEach((c: any) => {
      if (c.statut !== "paye") return;
      if (!c.date_paiement) return;
      const d = new Date(c.date_paiement);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(c.membre_id)) map.set(c.membre_id, new Map());
      const inner = map.get(c.membre_id)!;
      inner.set(key, (inner.get(key) ?? 0) + (c.montant || 0));
    });
    return map;
  }, [cotisations]);

  const membresStats = useMemo(() => {
    if (!membres) return [];
    return membres.map((m) => {
      const attenduMois = getMontantAttendu(m.id);
      const nbMois = mois.filter((mo) => !mo.isFuture).length;
      const attenduTotal = attenduMois * mois.length;
      const paiementsMois = paiementsParMembreMois.get(m.id) ?? new Map();
      let payeTotal = 0;
      paiementsMois.forEach((v) => { payeTotal += v; });
      const attenduDu = attenduMois * nbMois;
      const progression = attenduTotal > 0 ? Math.min(100, (payeTotal / attenduTotal) * 100) : 0;
      const progressionDue = attenduDu > 0 ? (payeTotal / attenduDu) * 100 : 0;
      return { ...m, attenduMois, attenduTotal, payeTotal, progression, progressionDue, paiementsMois };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membres, mois, paiementsParMembreMois, cotisationsMensuelles, typeMensuel]);

  const filteredStats = useMemo(() => {
    const term = search.trim().toLowerCase();
    return membresStats
      .filter((m) => {
        if (term) {
          const full = `${m.prenom ?? ""} ${m.nom ?? ""}`.toLowerCase();
          if (!full.includes(term)) return false;
        }
        if (filtreEquipe !== "toutes" && (m as any).equipe_jaune_rouge !== filtreEquipe) return false;
        if (filtreStatut !== "tous") {
          const p = m.progressionDue;
          if (filtreStatut === "complet" && p < 100) return false;
          if (filtreStatut === "a_jour" && (p < 80 || p >= 100)) return false;
          if (filtreStatut === "en_cours" && (p < 50 || p >= 80)) return false;
          if (filtreStatut === "en_retard" && p >= 50) return false;
        }
        return true;
      })
      .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
  }, [membresStats, search, filtreEquipe, filtreStatut]);

  const totalAttenduAnnuel = filteredStats.reduce((s, m) => s + m.attenduTotal, 0);
  const totalPaye = filteredStats.reduce((s, m) => s + m.payeTotal, 0);
  const progressionGlobale = totalAttenduAnnuel > 0 ? (totalPaye / totalAttenduAnnuel) * 100 : 0;

  const cellColor = (paye: number, attendu: number, mo: MoisInfo) => {
    if (mo.isFuture) return "bg-muted/30 text-muted-foreground";
    if (attendu === 0) return "";
    if (paye >= attendu) return "bg-green-500/15 text-green-700 dark:text-green-400";
    if (paye > 0) return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  const equipeBadge = (eq?: string | null) => {
    if (eq === "jaune") return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-0">Jaune</Badge>;
    if (eq === "rouge") return <Badge className="bg-red-500/20 text-red-700 hover:bg-red-500/30 border-0">Rouge</Badge>;
    return <span className="text-muted-foreground text-sm">—</span>;
  };

  const fileBase = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nom = (exercice?.nom ?? "exercice").replace(/\s+/g, "_");
    return `cotisations_detail_mensuel_${nom}_${today}`;
  };

  const exportCSV = () => {
    const header = ["Membre", "Équipe", ...mois.map((m) => m.label), "Attendu annuel", "Payé", "Progression %"];
    const lines = filteredStats.map((m) => [
      `${m.prenom ?? ""} ${m.nom ?? ""}`.trim(),
      (m as any).equipe_jaune_rouge ?? "",
      ...mois.map((mo) => String(Math.round(m.paiementsMois.get(mo.key) ?? 0))),
      String(Math.round(m.attenduTotal)),
      String(Math.round(m.payeTotal)),
      m.progression.toFixed(1),
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...lines].map((r) => r.map(escape).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${fileBase()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("Cotisations - Détail mensuel", 14, 16);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Exercice : ${exercice?.nom ?? "—"}`, 14, 23);
    doc.text(`Édité le : ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 14, 23, { align: "right" });
    autoTable(doc, {
      startY: 30,
      head: [["Membre", ...mois.map((m) => m.label), "Total payé", "%"]],
      body: filteredStats.map((m) => [
        `${m.prenom ?? ""} ${m.nom ?? ""}`.trim(),
        ...mois.map((mo) => {
          const p = m.paiementsMois.get(mo.key) ?? 0;
          return p ? Math.round(p).toLocaleString("fr-FR") : "—";
        }),
        Math.round(m.payeTotal).toLocaleString("fr-FR"),
        `${m.progression.toFixed(0)}%`,
      ]),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`${fileBase()}.pdf`);
  };

  if (loadingExercice) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Chargement de l'exercice...
      </CardContent></Card>
    );
  }
  if (errorExercice) {
    return <Card><CardContent className="py-8 text-center text-destructive">Erreur de chargement.</CardContent></Card>;
  }
  if (!exercice) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun exercice actif.</CardContent></Card>;
  }
  if (!typeMensuel) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">
        Aucun type « Cotisation mensuelle » actif n'est associé à cet exercice.
      </CardContent></Card>
    );
  }

  const noData = filteredStats.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5"><CardContent className="p-4">
          <div className="flex items-center gap-3"><Coins className="h-8 w-8 text-primary" />
            <div><p className="text-sm text-muted-foreground">Attendu annuel</p>
            <p className="text-xl font-bold">{totalAttenduAnnuel.toLocaleString("fr-FR")} FCFA</p></div>
          </div></CardContent></Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5"><CardContent className="p-4">
          <div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-500" />
            <div><p className="text-sm text-muted-foreground">Total payé</p>
            <p className="text-xl font-bold text-green-600">{totalPaye.toLocaleString("fr-FR")} FCFA</p></div>
          </div></CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-sm text-muted-foreground">Membres</p>
            <p className="text-xl font-bold">{filteredStats.length}<span className="text-sm font-normal text-muted-foreground"> / {membresStats.length}</span></p></div>
          </div></CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Progression globale</p>
          <div className="flex items-center gap-3"><Progress value={progressionGlobale} className="h-3 flex-1" />
            <span className="font-bold">{progressionGlobale.toFixed(1)}%</span></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un membre" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <Select value={filtreEquipe} onValueChange={(v) => setFiltreEquipe(v as EquipeFiltre)}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes équipes</SelectItem>
                <SelectItem value="jaune">Jaune</SelectItem>
                <SelectItem value="rouge">Rouge</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtreStatut} onValueChange={(v) => setFiltreStatut(v as StatutFiltre)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="complet">Complet</SelectItem>
                <SelectItem value="a_jour">À jour (80-99%)</SelectItem>
                <SelectItem value="en_cours">En cours (50-79%)</SelectItem>
                <SelectItem value="en_retard">En retard (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={noData}><FileDown className="h-4 w-4 mr-2" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={noData}><FileText className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Détail mensuel - {exercice.nom}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Membre</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead className="text-right">Mensuel</TableHead>
                  {mois.map((mo) => (
                    <TableHead key={mo.key} className={`text-center text-xs whitespace-nowrap ${mo.isCurrent ? "font-bold text-primary" : ""}`}>
                      {mo.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total payé</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="sticky left-0 bg-background font-medium z-10">
                      {m.prenom} {m.nom}
                    </TableCell>
                    <TableCell>{equipeBadge((m as any).equipe_jaune_rouge)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {m.attenduMois.toLocaleString("fr-FR")}
                    </TableCell>
                    {mois.map((mo) => {
                      const paye = m.paiementsMois.get(mo.key) ?? 0;
                      return (
                        <TableCell key={mo.key} className={`text-center text-xs ${cellColor(paye, m.attenduMois, mo)}`}>
                          {paye > 0 ? Math.round(paye).toLocaleString("fr-FR") : (mo.isFuture ? "—" : "0")}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-medium text-green-600">
                      {Math.round(m.payeTotal).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={m.progression >= 80 ? "default" : m.progression >= 50 ? "secondary" : "destructive"}>
                        {m.progression.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {noData && (
                  <TableRow>
                    <TableCell colSpan={mois.length + 5} className="text-center py-8 text-muted-foreground">
                      Aucun membre ne correspond aux filtres
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-green-500/40" /> Payé complet</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-500/40" /> Partiel</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-500/30" /> Non payé</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-muted" /> Mois futur</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
