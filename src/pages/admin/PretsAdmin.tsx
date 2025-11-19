import { DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

export default function PretsAdmin() {
  const { data: prets, isLoading } = useQuery({
    queryKey: ["prets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prets")
        .select("*, emprunteur:membres(nom, prenom)")
        .order("date_pret", { ascending: false});
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestion des Prêts</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prêt
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Prêts Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {prets?.filter((p) => p.statut === "en_cours").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Montant Total Prêté</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {prets
                ?.filter((p) => p.statut === "en_cours")
                .reduce((sum, p) => sum + p.montant, 0)
                .toFixed(2) || 0}{" "}
              €
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prêts Remboursés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {prets?.filter((p) => p.statut === "rembourse").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Prêts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Emprunteur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Taux (%)</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reste à payer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prets?.map((pret) => (
                  <TableRow key={pret.id}>
                    <TableCell>{new Date(pret.date_pret).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {pret.emprunteur?.nom} {pret.emprunteur?.prenom}
                    </TableCell>
                    <TableCell>{pret.montant} €</TableCell>
                    <TableCell>{pret.taux_interet}%</TableCell>
                    <TableCell>{new Date(pret.echeance).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pret.statut === "rembourse"
                            ? "default"
                            : pret.statut === "en_cours"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {pret.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>{(pret.montant - pret.montant_paye).toFixed(2)} €</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
