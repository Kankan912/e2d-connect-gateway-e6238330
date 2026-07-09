import { Building2 } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Sélecteur d'association affiché uniquement lorsque l'utilisateur a accès
 * à plusieurs tenants (super_admin ou membre multi-associations).
 */
export const AssociationSwitcher = () => {
  const { currentAssociation, availableAssociations, switchAssociation, loading } = useAssociation();

  if (loading) return null;
  if (availableAssociations.length <= 1) return null;
  if (!currentAssociation) return null;

  return (
    <Select value={currentAssociation.id} onValueChange={switchAssociation}>
      <SelectTrigger className="h-9 w-auto gap-2 border-border bg-background text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[220px]">
        {availableAssociations.map((assoc) => (
          <SelectItem key={assoc.id} value={assoc.id}>
            <div className="flex items-center gap-2">
              {assoc.logo_url ? (
                <img src={assoc.logo_url} alt="" className="h-5 w-5 rounded object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-semibold uppercase">
                  {assoc.slug?.[0] ?? '?'}
                </div>
              )}
              <span>{assoc.nom}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
