import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, ChevronUp, ChevronDown, ImagePlus } from "lucide-react";
import { useSiteHero, useUpdateHero, useSiteHeroImages, useCreateHeroImage, useDeleteHeroImage, useUpdateHeroImage } from "@/hooks/useSiteContent";
import MediaUploader from "@/components/admin/MediaUploader";
import { toast } from "sonner";

export default function HeroAdmin() {
  const { data: hero, isLoading } = useSiteHero();
  const { data: heroImages, isLoading: imagesLoading } = useSiteHeroImages(hero?.id);
  const updateHero = useUpdateHero();
  const createHeroImage = useCreateHeroImage();
  const deleteHeroImage = useDeleteHeroImage();
  const updateHeroImage = useUpdateHeroImage();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [carouselAutoPlay, setCarouselAutoPlay] = useState(true);
  const [carouselInterval, setCarouselInterval] = useState(5000);

  useEffect(() => {
    if (hero) {
      setCarouselAutoPlay(hero.carousel_auto_play ?? true);
      setCarouselInterval(hero.carousel_interval ?? 5000);
    }
  }, [hero]);

  const onSubmit = (data: any) => {
    if (hero) {
      updateHero.mutate({ 
        ...data, 
        id: hero.id,
        carousel_auto_play: carouselAutoPlay,
        carousel_interval: carouselInterval
      });
    }
  };

  const handleAddImage = (url: string) => {
    if (hero) {
      createHeroImage.mutate({
        hero_id: hero.id,
        image_url: url,
        ordre: (heroImages?.length || 0) + 1
      }, {
        onSuccess: () => toast.success("Image ajoutée au carousel")
      });
    }
  };

  const handleDeleteImage = (id: string) => {
    if (confirm("Supprimer cette image du carousel ?")) {
      deleteHeroImage.mutate(id, {
        onSuccess: () => toast.success("Image supprimée")
      });
    }
  };

  const handleMoveImage = (id: string, direction: 'up' | 'down') => {
    if (!heroImages) return;
    
    const currentIndex = heroImages.findIndex(img => img.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= heroImages.length) return;

    const currentImage = heroImages[currentIndex];
    const swapImage = heroImages[newIndex];

    // Swap orders
    updateHeroImage.mutate({ id: currentImage.id, ordre: swapImage.ordre });
    updateHeroImage.mutate({ id: swapImage.id, ordre: currentImage.ordre });
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
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion du Hero</h1>
        <p className="text-muted-foreground">
          Gérez la section principale de la page d'accueil
        </p>
      </div>

      {/* Carousel Images Section */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel d'Images</CardTitle>
          <CardDescription>
            Gérez les images de fond du Hero avec défilement automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carousel Settings */}
          <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Switch 
                id="carousel-autoplay"
                checked={carouselAutoPlay} 
                onCheckedChange={(checked) => {
                  setCarouselAutoPlay(checked);
                  if (hero) {
                    updateHero.mutate({ id: hero.id, carousel_auto_play: checked });
                  }
                }}
              />
              <Label htmlFor="carousel-autoplay">Défilement automatique</Label>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="carousel-interval">Intervalle (ms)</Label>
              <Input 
                id="carousel-interval"
                type="number" 
                min={2000}
                max={10000}
                step={500}
                className="w-24"
                value={carouselInterval}
                onChange={(e) => setCarouselInterval(Number(e.target.value))}
                onBlur={() => {
                  if (hero) {
                    updateHero.mutate({ id: hero.id, carousel_interval: carouselInterval });
                  }
                }}
              />
            </div>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagesLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                {heroImages?.map((img, index) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                      <img 
                        src={img.image_url} 
                        alt={`Image carousel ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8"
                        disabled={index === 0}
                        onClick={() => handleMoveImage(img.id, 'up')}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary"
                        className="h-8 w-8"
                        disabled={index === (heroImages?.length || 0) - 1}
                        onClick={() => handleMoveImage(img.id, 'down')}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-center text-muted-foreground">
                      Position {index + 1}
                    </p>
                  </div>
                ))}
                
                {/* Add New Image */}
                <div className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors">
                  <MediaUploader
                    bucket="site-hero"
                    accept="image/*"
                    onUrlChange={(url) => handleAddImage(url)}
                    label=""
                    maxSizeMB={10}
                  />
                </div>
              </>
            )}
          </div>
          
          {heroImages && heroImages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune image dans le carousel. L'image principale sera utilisée.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Content Form */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu du Hero</CardTitle>
          <CardDescription>
            Modifiez les textes et l'image principale de la section hero
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
              label="Image de fond principale (utilisée si pas de carousel)"
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
