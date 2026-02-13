import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadFieldProps {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  accept?: string;
  maxSizeMB?: number;
}

export default function FileUploadField({
  label,
  value,
  onChange,
  bucket = "justificatifs",
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSizeMB = 5,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximale est de ${maxSizeMB} MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);

      toast({
        title: "Fichier téléversé",
        description: "Le fichier a été téléversé avec succès",
      });
    } catch (error: unknown) {
      console.error("Erreur upload:", error);
      toast({
        title: "Erreur",
        description: "Impossible de téléverser le fichier: " + (error instanceof Error ? error.message : "Erreur"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extraire le chemin du fichier de l'URL
      const url = new URL(value);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];

      // Supprimer de Supabase Storage
      await supabase.storage.from(bucket).remove([fileName]);

      onChange(null);

      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
      });
    } catch (error: unknown) {
      console.error("Erreur suppression:", error);
      // Même si la suppression échoue, on permet de retirer l'URL
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate flex-1"
          >
            Voir le fichier
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm">Téléversement...</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Formats acceptés: PDF, JPG, PNG, DOC. Max {maxSizeMB} MB.
      </p>
    </div>
  );
}
