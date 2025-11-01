import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Download, Mail, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Donation {
  id: string;
  created_at: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  is_recurring: boolean;
  recurring_frequency?: string;
}

interface DonationsTableProps {
  donations: Donation[];
  onView?: (donation: Donation) => void;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    completed: { variant: "default", label: "Complété" },
    pending: { variant: "secondary", label: "En attente" },
    failed: { variant: "destructive", label: "Échoué" },
    refunded: { variant: "outline", label: "Remboursé" },
  };

  const config = variants[status] || { variant: "outline" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPaymentMethodBadge = (method: string) => {
  const colors: Record<string, string> = {
    stripe: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    paypal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    bank_transfer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    helloasso: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  return (
    <Badge variant="outline" className={cn("capitalize", colors[method])}>
      {method === "bank_transfer" ? "Virement" : method}
    </Badge>
  );
};

export const DonationsTable = ({ donations, onView }: DonationsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Donateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Aucun don trouvé
              </TableCell>
            </TableRow>
          ) : (
            donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell className="font-medium">
                  {format(new Date(donation.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                </TableCell>
                <TableCell>{donation.donor_name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{donation.donor_email}</TableCell>
                <TableCell className="text-right font-semibold">
                  {donation.amount.toFixed(2)} {donation.currency}
                </TableCell>
                <TableCell>{getPaymentMethodBadge(donation.payment_method)}</TableCell>
                <TableCell>
                  {donation.is_recurring ? (
                    <Badge variant="secondary">
                      Récurrent ({donation.recurring_frequency})
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unique</Badge>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(donation.payment_status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(donation)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger reçu
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Renvoyer email
                      </DropdownMenuItem>
                      {donation.payment_status === "completed" && (
                        <DropdownMenuItem className="text-destructive">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Rembourser
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
