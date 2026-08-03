import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  PALETTE_KEYS,
  PALETTE_LABELS,
  Palette,
  hexToHslToken,
  hslTokenToHex,
} from "@/lib/paletteFromLogo";

interface PaletteEditorProps {
  tokens: Record<string, string>;
  onChange: (tokens: Record<string, string>) => void;
}

/** Édition manuelle de la charte : une entrée couleur par jeton du design system. */
export const PaletteEditor = ({ tokens, onChange }: PaletteEditorProps) => {
  const setToken = (key: string, hex: string) => {
    onChange({ ...tokens, [key]: hexToHslToken(hex) });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {PALETTE_KEYS.map((key: keyof Palette) => {
        const token = tokens[key] ?? "";
        return (
          <div key={key} className="space-y-1">
            <Label htmlFor={`color-${key}`} className="text-xs">
              {PALETTE_LABELS[key]}
            </Label>
            <div className="flex items-center gap-2">
              <input
                id={`color-${key}`}
                type="color"
                aria-label={PALETTE_LABELS[key]}
                value={token ? hslTokenToHex(token) : "#ffffff"}
                onChange={(e) => setToken(key, e.target.value)}
                className="h-9 w-10 cursor-pointer rounded border bg-background p-1"
              />
              <Input
                value={token}
                onChange={(e) => onChange({ ...tokens, [key]: e.target.value })}
                placeholder="220 90% 50%"
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
