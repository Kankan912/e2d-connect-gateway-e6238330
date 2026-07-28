/**
 * Ma Situation — Vue consolidée du membre pour l'exercice actif.
 * Lot C : agrège cotisations, prêts, aides, épargnes, sanctions et
 * paiements bénéficiaires via la RPC `get_membre_situation`, avec export PDF.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Wallet, PiggyBank, HandCoins, TrendingDown, HeartHandshake } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { useUserMemberId } from "@/hooks/usePersonalData";
import { useMembreSituation } from "@/hooks/useMembreSituation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MaSituation = () => {
  const { data: membre, isLoading: membreLoading } = useUserMemberId();
  const [exerciceId, setExerciceId] = useState<string>("");

  const { data: exercices } = useQuery({
    queryKey: ["ma-situation-exercices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices")
        .select("id, nom, statut, date_debut")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Auto-sélection de l'exercice actif
  const effectiveExerciceId = useMemo(() => {
    if (exerciceId) return exerciceId;
    const actif = exercices?.find((e) => e.statut === "actif");
    return actif?.id ?? "";
  }, [exerciceId, exercices]);

  const { data: situation, isLoading } = useMembreSituation(
    membre?.id ?? null,
    effectiveExerciceId || null,
  );

  const exportPDF = () => {
    if (!situation) return;
    const doc = new jsPDF();
    const nomExercice = exercices?.find((e) => e.id === effectiveExerciceId)?.nom ?? "Tous exercices";
    doc.setFontSize(16);
    doc.text("Ma situation", 14, 20);
    doc.setFontSize(11);
    doc.text(`${situation.membre.prenom} ${situation.membre.nom}`, 14, 28);
    doc.text(`Exercice : ${nomExercice}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [["Indicateur", "Montant"]],
      body: [
        ["Cotisations payées", formatFCFA(situation.totaux.cotisations_payees)],
        ["Prêts en cours (restant)", formatFCFA(situation.totaux.prets_en_cours)],
        ["Aides reçues", formatFCFA(situation.totaux.aides_recues)],
        ["Épargnes totales", formatFCFA(situation.totaux.epargnes_totales)],
        ["Sanctions dues", formatFCFA(situation.totaux.sanctions_dues)],
      ],
    });

    doc.save(`situation-${situation.membre.nom}-${nomExercice}.pdf`);
  };

  if (membreLoading || isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!membre) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun profil membre associé à votre compte.
        </CardContent>
      </Card>
    );
  }

  const totaux = situation?.totaux;

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ma situation</h1>
          <p className="text-muted-foreground">Vue consolidée de vos engagements financiers.</p>
        </div>
        <div className="flex gap-2">
          <Select value={effectiveExerciceId} onValueChange={setExerciceId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Exercice" /></SelectTrigger>
            <SelectContent>
              {exercices?.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nom} {e.statut === "actif" ? "(actif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportPDF} disabled={!situation}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Wallet />} label="Cotisations" value={totaux?.cotisations_payees ?? 0} />
        <StatCard icon={<HandCoins />} label="Prêts restants" value={totaux?.prets_en_cours ?? 0} />
        <StatCard icon={<HeartHandshake />} label="Aides reçues" value={totaux?.aides_recues ?? 0} />
        <StatCard icon={<PiggyBank />} label="Épargnes" value={totaux?.epargnes_totales ?? 0} />
        <StatCard icon={<TrendingDown />} label="Sanctions dues" value={totaux?.sanctions_dues ?? 0} />
      </div>

      <Tabs defaultValue="cotisations">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="prets">Prêts</TabsTrigger>
          <TabsTrigger value="aides">Aides</TabsTrigger>
          <TabsTrigger value="epargnes">Épargnes</TabsTrigger>
          <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
          <TabsTrigger value="beneficiaires">Bénéficiaire</TabsTrigger>
        </TabsList>
        <TabsContent value="cotisations">
          <SimpleTable
            columns={["Type", "Montant", "Statut", "Date paiement"]}
            rows={(situation?.cotisations ?? []).map((c: any) => [
              c.type_nom ?? "—", formatFCFA(c.montant), <StatutBadge key="s" value={c.statut} />,
              c.date_paiement ? new Date(c.date_paiement).toLocaleDateString("fr-FR") : "—",
            ])}
          />
        </TabsContent>

        <TabsContent value="prets">
          <SimpleTable
            columns={["Date", "Montant", "Payé", "Statut", "Échéance"]}
            rows={(situation?.prets ?? []).map((p: any) => [
              new Date(p.date_pret).toLocaleDateString("fr-FR"),
              formatFCFA(p.montant),
              formatFCFA(p.montant_paye ?? 0),
              <StatutBadge key="s" value={p.statut} />,
              p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR") : "—",
            ])}
          />
        </TabsContent>
        <TabsContent value="aides">
          <SimpleTable
            columns={["Date", "Type", "Contexte", "Montant", "Statut", "Justificatif"]}
            rows={(situation?.aides ?? []).map((a: any) => [
              new Date(a.date_allocation).toLocaleDateString("fr-FR"),
              a.type_nom ?? "—",
              a.contexte_aide,
              formatFCFA(a.montant),
              <StatutBadge key="s" value={a.statut} />,
              a.justificatif_url ? (
                <a key="j" href={a.justificatif_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Voir</a>
              ) : "—",
            ])}
          />
        </TabsContent>
        <TabsContent value="epargnes">
          <SimpleTable
            columns={["Date", "Montant", "Statut"]}
            rows={(situation?.epargnes ?? []).map((e: any) => [
              new Date(e.date_operation).toLocaleDateString("fr-FR"),
              formatFCFA(e.montant),
              <StatutBadge key="s" value={e.statut} />,
            ])}
          />
        </TabsContent>
        <TabsContent value="sanctions">
          <SimpleTable
            columns={["Date", "Motif", "Montant", "Statut"]}
            rows={(situation?.sanctions ?? []).map((s: any) => [
              new Date(s.date_sanction).toLocaleDateString("fr-FR"),
              s.motif ?? "—",
              formatFCFA(s.montant),
              <StatutBadge key="s" value={s.statut} />,
            ])}
          />
        </TabsContent>
        <TabsContent value="beneficiaires">
          <SimpleTable
            columns={["Créé le", "Prévu", "Payé", "Statut", "Date paiement", "Mode"]}
            rows={(situation?.beneficiaires_paiements ?? []).map((b: any) => [
              new Date(b.created_at).toLocaleDateString("fr-FR"),
              formatFCFA(b.montant_prevu ?? 0),
              formatFCFA(b.montant_paye ?? 0),
              <StatutBadge key="s" value={b.statut} />,
              b.date_paiement ? new Date(b.date_paiement).toLocaleDateString("fr-FR") : "—",
              b.mode_paiement ?? "—",
            ])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription className="flex items-center gap-2">{icon}{label}</CardDescription>
    </CardHeader>
    <CardContent><div className="text-lg font-bold">{formatFCFA(value)}</div></CardContent>
  </Card>
);

const StatutBadge = ({ value }: { value: string | null | undefined }) => {
  if (!value) return <>—</>;
  const variant: "default" | "secondary" | "destructive" | "outline" =
    ["paye", "rembourse", "payee", "allouee", "alloue"].includes(value) ? "default"
    : ["en_retard", "impayee", "rejetee", "refusee"].includes(value) ? "destructive"
    : "secondary";
  return <Badge variant={variant}>{value}</Badge>;
};

const SimpleTable = ({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) => {
  if (rows.length === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune donnée pour cet exercice.</CardContent></Card>;
  }
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>{columns.map((c) => <TableHead key={c}>{c}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MaSituation;
