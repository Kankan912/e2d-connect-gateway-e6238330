import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LAST_UPDATE, lots, phases, TrackingItem, TrackingStatus } from "@/data/programTracking";
import { TrackingSummary } from "./_components/tracking/TrackingSummary";
import { TrackingTable } from "./_components/tracking/TrackingTable";
import { PendingTable } from "./_components/tracking/PendingTable";

const ProgramTrackingAdmin = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TrackingStatus | "all">("all");
  const [tab, setTab] = useState<"all" | "phases" | "lots">("all");

  const filter = (items: TrackingItem[]) =>
    items.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        `${item.label} ${item.scope} ${item.detail}`.toLowerCase().includes(q);
      return matchQ && (status === "all" || item.status === status);
    });

  const filteredPhases = useMemo(() => filter(phases), [search, status]);
  const filteredLots = useMemo(() => filter(lots), [search, status]);

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Suivi du programme</h1>
        <p className="text-muted-foreground mt-2">
          État d'exécution phase par phase et lot par lot — mise à jour du {LAST_UPDATE}
        </p>
      </div>

      <TrackingSummary items={[...phases, ...lots]} />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="lots">Lots</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as TrackingStatus | "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="termine">Terminé</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="non_demarre">Non démarré</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tab !== "lots" && (
        <TrackingTable
          title="Phases plateforme"
          description="Phases 2.4 à 6"
          firstColumn="Phase"
          items={filteredPhases}
        />
      )}

      {tab !== "phases" && (
        <TrackingTable
          title="Lots d'audit et fonctionnels"
          description="Lots 1 à 5, A, A-bis, B, B-bis, C et lots transverses"
          firstColumn="Lot"
          items={filteredLots}
        />
      )}

      <PendingTable />
    </div>
  );
};

export default ProgramTrackingAdmin;
