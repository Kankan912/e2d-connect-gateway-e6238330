import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, Image as ImageIcon, Video } from "lucide-react";
import { useSiteGallery, useCreateGalleryItem, useUpdateGalleryItem, useDeleteGalleryItem } from "@/hooks/useSiteContent";
import { useForm } from "react-hook-form";
import MediaUploader from "@/components/admin/MediaUploader";

export default function GalleryAdmin() {
  const { data: gallery, isLoading } = useSiteGallery();
  const createItem = useCreateGalleryItem();
  const updateItem = useUpdateGalleryItem();
  const deleteItem = useDeleteGalleryItem();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const watchCategorie = watch("categorie", "Photo");

  const photos = gallery?.filter(item => item.categorie === "Photo") || [];
  const videos = gallery?.filter(item => item.categorie === "Vidéo") || [];

  const onSubmit = (data: any) => {
    if (editingItem) {
      updateItem.mutate({ ...data, id: editingItem.id });
    } else {
      createItem.mutate(data);
    }
    setOpen(false);
    reset();
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    Object.keys(item).forEach(key => {
      setValue(key, item[key]);
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      deleteItem.mutate(id);
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
          <h1 className="text-3xl font-bold">Gestion de la Galerie</h1>
          <p className="text-muted-foreground">
            Gérez les photos et vidéos de l'association
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { reset(); setEditingItem(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un média
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Modifier" : "Ajouter"} un média
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input id="titre" {...register("titre", { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <select
                    id="categorie"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    {...register("categorie", { required: true })}
                  >
                    <option value="Photo">Photo</option>
                    <option value="Vidéo">Vidéo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordre">Ordre d'affichage</Label>
                  <Input id="ordre" type="number" defaultValue={0} {...register("ordre")} />
                </div>
              </div>
              <MediaUploader
                bucket="site-gallery"
                accept={watchCategorie === "Photo" ? "image/*" : "video/*"}
                currentUrl={watchCategorie === "Photo" ? editingItem?.image_url : editingItem?.video_url}
                onUrlChange={(url, source) => {
                  if (watchCategorie === "Photo") {
                    setValue("image_url", url);
                    setValue("video_url", null);
                  } else {
                    setValue("video_url", url);
                    setValue("image_url", null);
                  }
                  setValue("media_source", source);
                }}
                label={watchCategorie === "Photo" ? "Image" : "Vidéo"}
                maxSizeMB={watchCategorie === "Photo" ? 5 : 20}
              />
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                  {(createItem.isPending || updateItem.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="photos">
        <TabsList>
          <TabsTrigger value="photos">
            <ImageIcon className="w-4 h-4 mr-2" />
            Photos ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="w-4 h-4 mr-2" />
            Vidéos ({videos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>{photos.length} photo(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {photos.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.titre}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm font-medium text-center">{item.titre}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>Vidéos</CardTitle>
              <CardDescription>{videos.length} vidéo(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {videos.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                      <Video className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm font-medium">{item.titre}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
