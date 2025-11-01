import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Calendar, Clock, MapPin } from "lucide-react";
import { useSiteEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useSiteContent";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import MediaUploader from "@/components/admin/MediaUploader";

export default function EventsAdmin() {
  const { data: events, isLoading } = useSiteEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = (data: any) => {
    if (editingEvent) {
      updateEvent.mutate({ ...data, id: editingEvent.id });
    } else {
      createEvent.mutate(data);
    }
    setOpen(false);
    reset();
    setEditingEvent(null);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    Object.keys(event).forEach(key => {
      setValue(key, event[key]);
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      deleteEvent.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Événements</h1>
          <p className="text-muted-foreground">
            Gérez les événements à venir de l'association
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { reset(); setEditingEvent(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Événement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Modifier" : "Créer"} un événement
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input id="titre" {...register("titre", { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" placeholder="Match, Tournoi, Entraînement" {...register("type", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordre">Ordre d'affichage</Label>
                  <Input id="ordre" type="number" defaultValue={0} {...register("ordre")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heure">Heure</Label>
                  <Input id="heure" type="time" {...register("heure")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lieu">Lieu</Label>
                <Input id="lieu" {...register("lieu", { required: true })} />
              </div>
              <MediaUploader
                bucket="site-events"
                accept="image/*"
                currentUrl={editingEvent?.image_url}
                onUrlChange={(url, source) => {
                  setValue("image_url", url);
                  setValue("media_source", source);
                }}
                label="Image de l'événement"
                maxSizeMB={5}
              />
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                  {(createEvent.isPending || updateEvent.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingEvent ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des événements</CardTitle>
          <CardDescription>
            {events?.length || 0} événement(s) actif(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Événement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-medium">{event.titre}</div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {event.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge>{event.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.date), "dd MMM yyyy", { locale: fr })}
                      </div>
                      {event.heure && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {event.heure}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      {event.lieu}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
