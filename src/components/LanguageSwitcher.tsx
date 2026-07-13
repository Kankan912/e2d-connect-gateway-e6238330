/**
 * LanguageSwitcher — sélecteur FR/EN (Phase 6).
 * Persiste dans localStorage (`lovable_language`) et applique immédiatement.
 */
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { i18n, t } = useTranslation("common");
  const current = (i18n.resolvedLanguage as SupportedLang) ?? "fr";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" aria-label={t("language.label")}>
          <Languages className="h-4 w-4 mr-2" />
          {current.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGS.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => void i18n.changeLanguage(lng)}
            className={current === lng ? "font-semibold" : ""}
          >
            {t(`language.${lng}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
