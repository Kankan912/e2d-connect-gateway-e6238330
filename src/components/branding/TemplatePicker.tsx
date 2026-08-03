import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_TEMPLATES, SiteTemplateId } from "@/lib/siteTemplates";

interface TemplatePickerProps {
  value: SiteTemplateId;
  onChange: (id: SiteTemplateId) => void;
}

/**
 * Sélection du modèle de site public. Le changement de modèle n'affecte que
 * la structure d'affichage : aucun contenu n'est supprimé.
 */
export const TemplatePicker = ({ value, onChange }: TemplatePickerProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {SITE_TEMPLATES.map((tpl) => {
      const selected = tpl.id === value;
      return (
        <button
          key={tpl.id}
          type="button"
          onClick={() => onChange(tpl.id)}
          aria-pressed={selected}
          className={cn(
            "text-left rounded-lg border p-3 transition-colors hover:bg-accent/40",
            selected ? "border-primary ring-2 ring-primary/30 bg-accent/30" : "border-border",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">{tpl.nom}</span>
            {selected && <Check className="h-4 w-4 text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
          <div className="mt-2 flex gap-1" aria-hidden>
            <span className="h-6 flex-1 rounded bg-primary/70" />
            <span className="h-6 w-6 rounded bg-secondary" />
            <span className="h-6 w-6 rounded bg-accent" />
          </div>
        </button>
      );
    })}
  </div>
);
