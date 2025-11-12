import { Checkbox } from "@/components/ui/checkbox";
import { useRoles } from "@/hooks/useRoles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

const RESOURCES = [
  { id: 'membres', label: 'Membres' },
  { id: 'cotisations', label: 'Cotisations' },
  { id: 'epargnes', label: 'Épargnes' },
  { id: 'reunions', label: 'Réunions' },
  { id: 'prets', label: 'Prêts' },
  { id: 'aides', label: 'Aides' },
  { id: 'sanctions', label: 'Sanctions' },
  { id: 'sport_e2d', label: 'Sport E2D' },
  { id: 'sport_phoenix', label: 'Sport Phoenix' },
  { id: 'donations', label: 'Dons' },
  { id: 'site', label: 'Site Web (CMS)' },
  { id: 'configuration', label: 'Configuration' },
];

const PERMISSIONS = [
  { id: 'create', label: 'Créer' },
  { id: 'read', label: 'Lire' },
  { id: 'update', label: 'Modifier' },
  { id: 'delete', label: 'Supprimer' },
];

interface PermissionsMatrixProps {
  roleId: string;
}

export const PermissionsMatrix = ({ roleId }: PermissionsMatrixProps) => {
  const { useRolePermissions, updateRolePermission } = useRoles();
  const { data: permissions, isLoading } = useRolePermissions(roleId);

  const hasPermission = (resource: string, permission: string) => {
    return permissions?.some(
      p => p.resource === resource && p.permission === permission && p.granted
    ) || false;
  };

  const handleToggle = (resource: string, permission: string, granted: boolean) => {
    updateRolePermission.mutate({ roleId, resource, permission, granted });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Chargement des permissions...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Ressource</TableHead>
            {PERMISSIONS.map(perm => (
              <TableHead key={perm.id} className="text-center">
                {perm.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {RESOURCES.map(resource => (
            <TableRow key={resource.id}>
              <TableCell className="font-medium">{resource.label}</TableCell>
              {PERMISSIONS.map(perm => (
                <TableCell key={perm.id} className="text-center">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      id={`${resource.id}-${perm.id}`}
                      checked={hasPermission(resource.id, perm.id)}
                      onCheckedChange={(checked) => 
                        handleToggle(resource.id, perm.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`${resource.id}-${perm.id}`}
                      className="sr-only"
                    >
                      {`${perm.label} ${resource.label}`}
                    </Label>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
