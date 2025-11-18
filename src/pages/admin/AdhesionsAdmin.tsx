import { useState } from "react";
import { UserPlus, Check, X, Clock, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdhesionsAdmin() {
  const { toast } = useToast();

  const { data: adhesions = [], isLoading } = useQuery({
    queryKey: ['adhesions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adhesions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const stats = {
    total: adhesions.length,
    completed: adhesions.filter(a => a.payment_status === 'completed').length,
    pending: adhesions.filter(a => a.payment_status === 'pending').length,
    failed: adhesions.filter(a => a.payment_status === 'failed').length,
    montantTotal: adhesions
      .filter(a => a.payment_status === 'completed')
      .reduce((sum, a) => sum + a.montant_paye, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" /> Complétée</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Échouée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Gestion des Adhésions
          </h1>
          <p className="text-muted-foreground mt-2">
            Suivre et gérer les adhésions à l'association
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Complétées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Échouées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montantTotal.toLocaleString()} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des adhésions */}
      <Card>
        <CardHeader>
          <CardTitle>Adhésions Récentes</CardTitle>
          <CardDescription>
            {adhesions.length} adhésion(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : adhesions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune adhésion enregistrée
            </p>
          ) : (
            <div className="space-y-3">
              {adhesions.map((adhesion) => (
                <div
                  key={adhesion.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {adhesion.nom} {adhesion.prenom}
                    </p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{adhesion.email}</span>
                      <span>{adhesion.telephone}</span>
                      <span>Type: {adhesion.type_adhesion}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span>Montant: {adhesion.montant_paye} €</span>
                      <span>Méthode: {adhesion.payment_method}</span>
                      <span>
                        Date: {format(new Date(adhesion.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(adhesion.payment_status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
