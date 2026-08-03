import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, ImageOff } from "lucide-react";
import { logger } from "@/lib/logger";

interface LogoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Dossier de destination dans le bucket `site-images`. */
  folder?: string;
  label?: string;
}

const MAX_SIZE = 3 * 1024 * 1024;

/** Envoi d'un logo dans le bucket `site-images` et restitution de son URL publique. */
export const LogoUploader = ({
  value,
  onChange,
  folder = "logos",
  label = "Logo de l'association",
}: LogoUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format non supporté : choisissez une image.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop volumineuse (3 Mo maximum).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("site-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo envoyé");
    } catch (error: unknown) {
      logger.error("[LogoUploader] échec upload:", error);
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt="Logo de l'association" className="h-full w-full object-contain" />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {value ? "Remplacer" : "Téléverser"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange(null)} disabled={uploading}>
              Retirer
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};
