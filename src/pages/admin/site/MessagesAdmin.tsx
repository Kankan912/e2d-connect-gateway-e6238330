import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Phone, CheckCircle, Archive, Eye, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

type MessageStatus = "nouveau" | "lu" | "traite";

const MessagesAdmin = () => {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages_contact")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateMessage = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: MessageStatus }) => {
      const { error } = await supabase
        .from("messages_contact")
        .update({ statut })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast({ title: "Succès", description: "Statut mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const filteredMessages = messages?.filter((msg) => {
    if (statusFilter === "all") return true;
    return msg.statut === statusFilter;
  });

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge variant="destructive">Nouveau</Badge>;
      case "lu":
        return <Badge variant="secondary">Lu</Badge>;
      case "traite":
        return <Badge className="bg-green-500 hover:bg-green-600">Traité</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const messageCounts = {
    all: messages?.length || 0,
    nouveau: messages?.filter((m) => m.statut === "nouveau").length || 0,
    lu: messages?.filter((m) => m.statut === "lu").length || 0,
    traite: messages?.filter((m) => m.statut === "traite").length || 0,
  };

  const handleViewMessage = (message: any) => {
    setSelectedMessage(message);
    setNotes("");
    
    // Marquer comme lu si nouveau
    if (message.statut === "nouveau") {
      updateMessage.mutate({ id: message.id, statut: "lu" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages de Contact</h1>
          <p className="text-muted-foreground">Gérez les messages reçus via le formulaire de contact</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{messageCounts.all}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nouveaux</CardDescription>
            <CardTitle className="text-2xl text-destructive">{messageCounts.nouveau}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lus</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{messageCounts.lu}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Traités</CardDescription>
            <CardTitle className="text-2xl text-green-500">{messageCounts.traite}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages ({filteredMessages?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous ({messageCounts.all})</TabsTrigger>
              <TabsTrigger value="nouveau">Nouveaux ({messageCounts.nouveau})</TabsTrigger>
              <TabsTrigger value="lu">Lus ({messageCounts.lu})</TabsTrigger>
              <TabsTrigger value="traite">Traités ({messageCounts.traite})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages?.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(message.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">{message.nom}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{message.objet}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell>{getStatusBadge(message.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewMessage(message)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {message.statut !== "traite" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateMessage.mutate({ id: message.id, statut: "traite" })}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {(!filteredMessages || filteredMessages.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun message trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Message de {selectedMessage?.nom}
            </DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-primary hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.telephone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <a
                      href={`tel:${selectedMessage.telephone}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedMessage.telephone}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Objet</p>
                <p className="font-medium">{selectedMessage.objet}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMessage.statut)}
                  <span className="text-sm text-muted-foreground">
                    Reçu le {format(new Date(selectedMessage.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.objet}`
                    }
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Répondre
                  </Button>
                  {selectedMessage.statut !== "traite" && (
                    <Button
                      onClick={() => {
                        updateMessage.mutate({ id: selectedMessage.id, statut: "traite" });
                        setSelectedMessage(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer comme traité
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesAdmin;
