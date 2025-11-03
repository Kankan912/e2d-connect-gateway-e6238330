import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Hook pour Hero
export const useSiteHero = () => {
  return useQuery({
    queryKey: ["site-hero"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_hero")
        .select("*")
        .eq("actif", true)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateHero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_hero")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-hero"] });
      toast.success("Section Hero mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Hook pour About
export const useSiteAbout = () => {
  return useQuery({
    queryKey: ["site-about"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_about")
        .select("*")
        .eq("actif", true)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateAbout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_about")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-about"] });
      toast.success("Section À Propos mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Hook pour Activities
export const useSiteActivities = () => {
  return useQuery({
    queryKey: ["site-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_activities")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("site_activities").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-activities"] });
      toast.success("Activité créée");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_activities")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-activities"] });
      toast.success("Activité mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-activities"] });
      toast.success("Activité supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Hook pour Events
export const useSiteEvents = () => {
  return useQuery({
    queryKey: ["site-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_events")
        .select("*")
        .eq("actif", true)
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("site_events").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-events"] });
      toast.success("Événement créé");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_events")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-events"] });
      toast.success("Événement mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-events"] });
      toast.success("Événement supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Hook pour Gallery
export const useSiteGallery = () => {
  return useQuery({
    queryKey: ["site-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_gallery")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("site_gallery").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-gallery"] });
      toast.success("Élément de galerie créé");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });
};

export const useUpdateGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_gallery")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-gallery"] });
      toast.success("Élément mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

export const useDeleteGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_gallery")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-gallery"] });
      toast.success("Élément supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Hook pour Partners
export const useSitePartners = () => {
  return useQuery({
    queryKey: ["site-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_partners")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("site_partners").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-partners"] });
      toast.success("Partenaire créé");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });
};

export const useUpdatePartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_partners")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-partners"] });
      toast.success("Partenaire mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

export const useDeletePartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_partners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-partners"] });
      toast.success("Partenaire supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Hook pour Config
export const useSiteConfig = () => {
  return useQuery({
    queryKey: ["site-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("*")
        .order("categorie", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_config")
        .update({ valeur: data.valeur })
        .eq("cle", data.cle);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
      toast.success("Configuration mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// =================== HERO IMAGES ===================
export const useSiteHeroImages = (heroId?: string) => {
  return useQuery({
    queryKey: ["site-hero-images", heroId],
    queryFn: async () => {
      if (!heroId) return [];
      const { data, error } = await supabase
        .from("site_hero_images")
        .select("*")
        .eq("hero_id", heroId)
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!heroId,
  });
};

export const useCreateHeroImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_hero_images")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-hero-images"] });
      toast.success("Image ajoutée");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });
};

export const useUpdateHeroImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_hero_images")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-hero-images"] });
      toast.success("Image mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

export const useDeleteHeroImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_hero_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-hero-images"] });
      toast.success("Image supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

// =================== GALLERY ALBUMS ===================
export const useSiteGalleryAlbums = () => {
  return useQuery({
    queryKey: ["site-gallery-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_gallery_albums")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateGalleryAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_gallery_albums")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-gallery-albums"] });
      toast.success("Album créé");
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });
};

export const useUpdateGalleryAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_gallery_albums")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-gallery-albums"] });
      queryClient.invalidateQueries({ queryKey: ["site-gallery"] });
      toast.success("Album mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

export const useDeleteGalleryAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_gallery_albums")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-gallery-albums"] });
      queryClient.invalidateQueries({ queryKey: ["site-gallery"] });
      toast.success("Album supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Hook to get gallery items by album
export const useSiteGalleryByAlbum = (albumId?: string) => {
  return useQuery({
    queryKey: ["site-gallery", "album", albumId],
    queryFn: async () => {
      if (!albumId) return [];
      const { data, error } = await supabase
        .from("site_gallery")
        .select("*")
        .eq("album_id", albumId)
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!albumId,
  });
};

// =================== EVENTS CAROUSEL CONFIG ===================
export const useSiteEventsCarouselConfig = () => {
  return useQuery({
    queryKey: ["site-events-carousel-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_events_carousel_config")
        .select("*")
        .eq("actif", true)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateEventsCarouselConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("site_events_carousel_config")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-events-carousel-config"] });
      toast.success("Configuration carousel mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};
