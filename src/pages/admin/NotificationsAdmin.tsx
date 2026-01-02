import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import NotificationCampagneForm from "@/components/forms/NotificationCampagneForm";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationsAdminProps {
  embedded?: boolean;
}

export default function NotificationsAdmin({ embedded = false }: NotificationsAdminProps) {
  const [formOpen, setFormOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentMembre } = useQuery({
    queryKey: ['current-membre', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('membres')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: campagnes, isLoading } = useQuery({
    queryKey: ["notifications-campagnes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications_campagnes")
        .select(`
          *,
          createur:membres!notifications_campagnes_created_by_fkey(nom, prenom)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCampagne = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('notifications_campagnes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-campagnes'] });
      setFormOpen(false);
    }
  });

  return (
    <div className={embedded ? "space-y-6" : "container mx-auto p-6 space-y-6"}>
      {!embedded && <BackButton />}
      <div className="flex items-center justify-between">
        {!embedded && (
          <div className="flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Notifications & Campagnes</h1>
          </div>
        )}
        <Button onClick={() => setFormOpen(true)} className={embedded ? "ml-auto" : ""}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Campagne
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Campagnes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{campagnes?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {campagnes?.filter((c) => c.statut === "en_cours").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Envoyées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {campagnes?.filter((c) => c.statut === "envoyee").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Taux d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">---%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campagnes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Envoyés</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'envoi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campagnes?.map((campagne) => (
                  <TableRow key={campagne.id}>
                    <TableCell className="font-medium">{campagne.nom}</TableCell>
                    <TableCell>{campagne.type_campagne}</TableCell>
                    <TableCell>{campagne.nb_destinataires || 0}</TableCell>
                    <TableCell>{campagne.nb_envoyes || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campagne.statut === "envoyee"
                            ? "default"
                            : campagne.statut === "en_cours"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {campagne.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campagne.date_envoi_reelle
                        ? new Date(campagne.date_envoi_reelle).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {currentMembre && (
        <NotificationCampagneForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={(data) => createCampagne.mutate(data)}
          createdBy={currentMembre.id}
        />
      )}
    </div>
  );
}
