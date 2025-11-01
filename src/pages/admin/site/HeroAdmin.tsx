import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useSiteHero, useUpdateHero } from "@/hooks/useSiteContent";
import MediaUploader from "@/components/admin/MediaUploader";

export default function HeroAdmin() {
  const { data: hero, isLoading } = useSiteHero();
  const updateHero = useUpdateHero();
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = (data: any) => {
    if (hero) {
      updateHero.mutate({ ...data, id: hero.id });
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
      <div>
        <h1 className="text-3xl font-bold">Gestion du Hero</h1>
        <p className="text-muted-foreground">
          Gérez la section principale de la page d'accueil
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenu du Hero</CardTitle>
          <CardDescription>
            Modifiez les textes et images de la section hero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="badge_text">Badge</Label>
              <Input
                id="badge_text"
                defaultValue={hero?.badge_text}
                {...register("badge_text")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titre">Titre principal</Label>
              <Input
                id="titre"
                defaultValue={hero?.titre}
                {...register("titre", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sous_titre">Sous-titre</Label>
              <Textarea
                id="sous_titre"
                defaultValue={hero?.sous_titre}
                {...register("sous_titre", { required: true })}
                rows={3}
              />
            </div>

            <MediaUploader
              bucket="site-hero"
              accept="image/*"
              currentUrl={hero?.image_url}
              onUrlChange={(url, source) => {
                setValue("image_url", url);
                setValue("media_source", source);
              }}
              label="Image de fond du Hero"
              maxSizeMB={10}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bouton_1_texte">Bouton 1 - Texte</Label>
                <Input
                  id="bouton_1_texte"
                  defaultValue={hero?.bouton_1_texte}
                  {...register("bouton_1_texte")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bouton_1_lien">Bouton 1 - Lien</Label>
                <Input
                  id="bouton_1_lien"
                  defaultValue={hero?.bouton_1_lien}
                  {...register("bouton_1_lien")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bouton_2_texte">Bouton 2 - Texte</Label>
                <Input
                  id="bouton_2_texte"
                  defaultValue={hero?.bouton_2_texte}
                  {...register("bouton_2_texte")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bouton_2_lien">Bouton 2 - Lien</Label>
                <Input
                  id="bouton_2_lien"
                  defaultValue={hero?.bouton_2_lien}
                  {...register("bouton_2_lien")}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_1_nombre">Stat 1 - Nombre</Label>
                  <Input
                    id="stat_1_nombre"
                    type="number"
                    defaultValue={hero?.stat_1_nombre}
                    {...register("stat_1_nombre")}
                  />
                  <Input
                    placeholder="Label"
                    defaultValue={hero?.stat_1_label}
                    {...register("stat_1_label")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_2_nombre">Stat 2 - Nombre</Label>
                  <Input
                    id="stat_2_nombre"
                    type="number"
                    defaultValue={hero?.stat_2_nombre}
                    {...register("stat_2_nombre")}
                  />
                  <Input
                    placeholder="Label"
                    defaultValue={hero?.stat_2_label}
                    {...register("stat_2_label")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_3_nombre">Stat 3 - Nombre</Label>
                  <Input
                    id="stat_3_nombre"
                    type="number"
                    defaultValue={hero?.stat_3_nombre}
                    {...register("stat_3_nombre")}
                  />
                  <Input
                    placeholder="Label"
                    defaultValue={hero?.stat_3_label}
                    {...register("stat_3_label")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updateHero.isPending}>
                {updateHero.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
