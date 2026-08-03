import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AssociationStatut = "actif" | "desactive" | "suspendu" | "archive" | "supprime";

export const ASSOCIATION_STATUTS: { value: AssociationStatut; label: string }[] = [
  { value: "actif", label: "Active" },
  { value: "desactive", label: "Désactivée" },
  { value: "suspendu", label: "Suspendue" },
  { value: "archive", label: "Archivée" },
  { value: "supprime", label: "Supprimée" },
];

const STYLES: Record<AssociationStatut, string> = {
  actif: "bg-primary/15 text-primary border-primary/30",
  desactive: "bg-muted text-muted-foreground border-border",
  suspendu: "bg-destructive/15 text-destructive border-destructive/30",
  archive: "bg-secondary/20 text-secondary-foreground border-secondary/40",
  supprime: "bg-destructive/25 text-destructive border-destructive/50 line-through",
};

export function associationStatutLabel(statut: string) {
  return ASSOCIATION_STATUTS.find((s) => s.value === statut)?.label ?? statut;
}

export function AssociationStatusBadge({ statut }: { statut: string }) {
  const key = (ASSOCIATION_STATUTS.some((s) => s.value === statut)
    ? statut
    : "desactive") as AssociationStatut;
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[key])}>
      {associationStatutLabel(statut)}
    </Badge>
  );
}
