import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Power, PowerOff, Archive, Ban, Trash2, Eraser } from "lucide-react";
import { useAssociationLifecycle } from "@/hooks/useAssociationLifecycle";
import type { AssociationStatut } from "@/components/associations/AssociationStatusBadge";

interface Props {
  association: { id: string; nom: string; statut: string };
  canManage: boolean;
  canHardDelete: boolean;
  queryKey?: unknown[];
}

type ActionKey = "desactive" | "actif" | "suspendu" | "archive" | "supprime" | "hard";

const ACTIONS: Record<
  ActionKey,
  { title: string; description: string; confirmLabel: string; success: string; destructive: boolean }
> = {
  desactive: {
    title: "Désactiver l'association",
    description:
      "Confirmez-vous la désactivation de cette association ? Son site, son portail et ses accès seront temporairement indisponibles. Aucune donnée ne sera supprimée.",
    confirmLabel: "Désactiver",
    success: "Association désactivée avec succès",
    destructive: false,
  },
  actif: {
    title: "Réactiver l'association",
    description:
      "Confirmez-vous la réactivation de cette association ? Les accès au site, au portail et à l'administration seront de nouveau disponibles.",
    confirmLabel: "Réactiver",
    success: "Association réactivée avec succès",
    destructive: false,
  },
  suspendu: {
    title: "Suspendre l'association",
    description:
      "La suspension bloque immédiatement les accès au site, au portail et à l'administration. Les données sont conservées.",
    confirmLabel: "Suspendre",
    success: "Association suspendue avec succès",
    destructive: false,
  },
  archive: {
    title: "Archiver l'association",
    description:
      "L'association passe en lecture seule et n'est plus accessible depuis le site ni le portail. Les données et l'historique sont conservés.",
    confirmLabel: "Archiver",
    success: "Association archivée avec succès",
    destructive: false,
  },
  supprime: {
    title: "Supprimer l'association",
    description:
      "Confirmez-vous la suppression de cette association ? Cette action peut affecter ses utilisateurs, ses données et son site web. Il s'agit d'une suppression logique : l'historique est conservé et un super administrateur peut la restaurer.",
    confirmLabel: "Supprimer",
    success: "Association supprimée avec succès",
    destructive: true,
  },
  hard: {
    title: "Suppression définitive",
    description:
      "Cette action est irréversible et détruit l'association en base. Elle est refusée automatiquement si des données liées existent (membres, cotisations, réunions, prêts, sanctions, opérations de caisse, contenus du site, notifications).",
    confirmLabel: "Supprimer définitivement",
    success: "Association supprimée définitivement",
    destructive: true,
  },
};

export function AssociationStatusActions({ association, canManage, canHardDelete, queryKey }: Props) {
  const [action, setAction] = useState<ActionKey | null>(null);
  const [motif, setMotif] = useState("");
  const { setStatut, hardDelete } = useAssociationLifecycle(queryKey ?? ["platform-associations"]);

  if (!canManage) return null;

  const loading = setStatut.isPending || hardDelete.isPending;
  const statut = association.statut;
  const config = action ? ACTIONS[action] : null;

  const close = () => {
    setAction(null);
    setMotif("");
  };

  const confirm = () => {
    if (!action) return;
    if (action === "hard") {
      hardDelete.mutate(association.id, { onSettled: close });
      return;
    }
    setStatut.mutate(
      {
        id: association.id,
        statut: action as AssociationStatut,
        motif: motif.trim() || null,
        successMessage: ACTIONS[action].success,
      },
      { onSettled: close }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Actions sur l'association">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statut !== "actif" && (
            <DropdownMenuItem onSelect={() => setAction("actif")}>
              <Power className="mr-2 h-4 w-4" />
              Réactiver
            </DropdownMenuItem>
          )}
          {statut === "actif" && (
            <DropdownMenuItem onSelect={() => setAction("desactive")}>
              <PowerOff className="mr-2 h-4 w-4" />
              Désactiver
            </DropdownMenuItem>
          )}
          {statut !== "suspendu" && statut !== "supprime" && (
            <DropdownMenuItem onSelect={() => setAction("suspendu")}>
              <Ban className="mr-2 h-4 w-4" />
              Suspendre
            </DropdownMenuItem>
          )}
          {statut !== "archive" && statut !== "supprime" && (
            <DropdownMenuItem onSelect={() => setAction("archive")}>
              <Archive className="mr-2 h-4 w-4" />
              Archiver
            </DropdownMenuItem>
          )}
          {statut !== "supprime" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => setAction("supprime")}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </>
          )}
          {canHardDelete && statut === "supprime" && (
            <DropdownMenuItem className="text-destructive" onSelect={() => setAction("hard")}>
              <Eraser className="mr-2 h-4 w-4" />
              Supprimer définitivement
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => (!o ? close() : undefined)}
        title={config?.title ?? ""}
        confirmLabel={config?.confirmLabel}
        destructive={config?.destructive}
        loading={loading}
        onConfirm={confirm}
        description={
          <>
            <p>
              <strong>{association.nom}</strong>
            </p>
            <p>{config?.description}</p>
            {action && action !== "hard" && (
              <div className="pt-2 text-left">
                <Label htmlFor="motif-statut">Motif (facultatif, tracé dans le journal d'audit)</Label>
                <Textarea
                  id="motif-statut"
                  rows={2}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>
            )}
          </>
        }
      />
    </>
  );
}
