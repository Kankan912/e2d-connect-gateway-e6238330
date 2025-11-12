import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { useRefreshPermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, Shield, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const RESOURCES = [
  { id: 'membres', label: 'Membres', icon: '👥' },
  { id: 'cotisations', label: 'Cotisations', icon: '💰' },
  { id: 'epargnes', label: 'Épargnes', icon: '🏦' },
  { id: 'reunions', label: 'Réunions', icon: '📅' },
  { id: 'prets', label: 'Prêts', icon: '💵' },
  { id: 'aides', label: 'Aides', icon: '🤝' },
  { id: 'sanctions', label: 'Sanctions', icon: '⚠️' },
  { id: 'sport_e2d', label: 'Sport E2D', icon: '⚽' },
  { id: 'sport_phoenix', label: 'Sport Phoenix', icon: '🔥' },
  { id: 'donations', label: 'Dons', icon: '❤️' },
  { id: 'site', label: 'Site Web (CMS)', icon: '🌐' },
  { id: 'configuration', label: 'Configuration', icon: '⚙️' },
];

const PERMISSIONS = [
  { id: 'create', label: 'Créer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { id: 'read', label: 'Lire', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'update', label: 'Modifier', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { id: 'delete', label: 'Supprimer', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
];

const PermissionsAdmin = () => {
  const { userRole } = useAuth();
  const { roles, useRolePermissions } = useRoles();
  const refreshPermissions = useRefreshPermissions();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const isAdmin = userRole === "administrateur";

  // Exporter la matrice en Excel
  const handleExport = () => {
    if (!roles) return;

    const data: any[] = [];
    
    // En-tête
    const header = ['Ressource', ...roles.map(r => r.name)];
    data.push(header);

    // Pour chaque ressource
    RESOURCES.forEach(resource => {
      PERMISSIONS.forEach(perm => {
        const row = [`${resource.label} - ${perm.label}`];
        
        roles.forEach(role => {
          const { data: permissions } = useRolePermissions(role.id);
          const hasPermission = permissions?.some(
            p => p.resource === resource.id && p.permission === perm.id && p.granted
          );
          row.push(hasPermission ? '✓' : '✗');
        });
        
        data.push(row);
      });
    });

    // Créer le workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Permissions');

    // Télécharger
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `permissions_matrix_${date}.xlsx`);

    toast({
      title: "✅ Export réussi",
      description: "La matrice des permissions a été exportée avec succès.",
    });
  };

  // Rafraîchir les permissions
  const handleRefresh = () => {
    refreshPermissions();
    toast({
      title: "✅ Permissions actualisées",
      description: "Vos permissions ont été rechargées depuis la base de données.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Gestion des Permissions
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin 
              ? "Gérez les permissions pour chaque rôle du système" 
              : "Consultez vos permissions actuelles"
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {isAdmin && (
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">rôles configurés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ressources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{RESOURCES.length}</div>
            <p className="text-xs text-muted-foreground">ressources protégées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{PERMISSIONS.length}</div>
            <p className="text-xs text-muted-foreground">types de permissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votre Rôle</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-lg">
              {userRole === 'administrateur' && '👑 Admin'}
              {userRole === 'tresorier' && '💰 Trésorier'}
              {userRole === 'secretaire_general' && '📝 Secrétaire'}
              {userRole === 'responsable_sportif' && '⚽ Sport'}
              {userRole === 'censeur' && '⚖️ Censeur'}
              {userRole === 'commissaire_comptes' && '🔍 Commissaire'}
              {!userRole && '👤 Membre'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">Matrice des Permissions</TabsTrigger>
          <TabsTrigger value="roles">Par Rôle</TabsTrigger>
          <TabsTrigger value="audit">Historique</TabsTrigger>
        </TabsList>

        {/* Matrice globale */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble des permissions</CardTitle>
              <CardDescription>
                Tableau complet des permissions par rôle et ressource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] sticky left-0 bg-background">
                        Ressource
                      </TableHead>
                      <TableHead className="text-center">Permission</TableHead>
                      {roles?.map(role => (
                        <TableHead key={role.id} className="text-center min-w-[100px]">
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RESOURCES.map(resource => (
                      PERMISSIONS.map((perm, permIndex) => (
                        <TableRow key={`${resource.id}-${perm.id}`}>
                          {permIndex === 0 && (
                            <TableCell 
                              rowSpan={PERMISSIONS.length} 
                              className="font-medium sticky left-0 bg-background"
                            >
                              <span className="flex items-center gap-2">
                                <span>{resource.icon}</span>
                                <span>{resource.label}</span>
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <Badge variant="outline" className={perm.color}>
                              {perm.label}
                            </Badge>
                          </TableCell>
                          {roles?.map(role => {
                            const { data: permissions } = useRolePermissions(role.id);
                            const hasPermission = permissions?.some(
                              p => p.resource === resource.id && 
                                   p.permission === perm.id && 
                                   p.granted
                            );
                            return (
                              <TableCell key={role.id} className="text-center">
                                {hasPermission ? (
                                  <span className="text-green-600 text-xl">✓</span>
                                ) : (
                                  <span className="text-gray-300 text-xl">✗</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion par rôle */}
        <TabsContent value="roles" className="space-y-4">
          {isAdmin ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionner un rôle</CardTitle>
                  <CardDescription>
                    Choisissez un rôle pour modifier ses permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {roles?.map(role => (
                      <Button
                        key={role.id}
                        variant={selectedRole === role.id ? "default" : "outline"}
                        onClick={() => setSelectedRole(role.id)}
                        className="w-full"
                      >
                        {role.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedRole && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Permissions du rôle : {roles?.find(r => r.id === selectedRole)?.name}
                    </CardTitle>
                    <CardDescription>
                      Cochez les permissions que vous souhaitez accorder
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PermissionsMatrix roleId={selectedRole} />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Vos permissions actuelles</CardTitle>
                <CardDescription>
                  Liste des permissions accordées à votre rôle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas les droits pour modifier les permissions.
                  Contactez un administrateur si vous pensez qu'il manque des accès.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Historique d'audit */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des modifications
              </CardTitle>
              <CardDescription>
                Journal des changements de permissions (à implémenter avec la table permissions_audit)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Cette fonctionnalité nécessite la création de la table permissions_audit
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionsAdmin;
