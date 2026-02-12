import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useSiteActivities, useCreateActivity, useUpdateActivity, useDeleteActivity } from "@/hooks/useSiteContent";
import { useForm } from "react-hook-form";

export default function ActivitiesAdmin() {
  const { data: activities, isLoading } = useSiteActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const [open, setOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = (data: any) => {
    const features = data.features.split(",").map((f: string) => f.trim());
    const activityData = { ...data, features };

    if (editingActivity) {
      updateActivity.mutate({ ...activityData, id: editingActivity.id });
    } else {
      createActivity.mutate(activityData);
    }
    setOpen(false);
    reset();
    setEditingActivity(null);
  };

  const handleEdit = (activity: any) => {
    setEditingActivity(activity);
    setValue("titre", activity.titre);
    setValue("description", activity.description);
    setValue("icon", activity.icon);
    setValue("features", activity.features.join(", "));
    setValue("ordre", activity.ordre);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette activité ?")) {
      deleteActivity.mutate(id);
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
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Activités</h1>
          <p className="text-muted-foreground">
            Gérez les activités proposées par l'association
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { reset(); setEditingActivity(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Activité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? "Modifier" : "Créer"} une activité
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input id="titre" {...register("titre", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description", { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icône (lucide-react)</Label>
                  <Input id="icon" placeholder="Trophy" {...register("icon", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordre">Ordre d'affichage</Label>
                  <Input id="ordre" type="number" defaultValue={0} {...register("ordre")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">Caractéristiques (séparées par des virgules)</Label>
                <Textarea
                  id="features"
                  placeholder="Feature 1, Feature 2, Feature 3"
                  {...register("features", { required: true })}
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createActivity.isPending || updateActivity.isPending}>
                  {(createActivity.isPending || updateActivity.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingActivity ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des activités</CardTitle>
          <CardDescription>
            {activities?.length || 0} activité(s) active(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Icône</TableHead>
                <TableHead>Caractéristiques</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities?.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.ordre}</TableCell>
                  <TableCell className="font-medium">{activity.titre}</TableCell>
                  <TableCell className="max-w-xs truncate">{activity.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{activity.icon}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(activity.features as string[]).slice(0, 2).map((f: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                      {(activity.features as string[]).length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(activity.features as string[]).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(activity)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(activity.id)}
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
