import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/useRoles";
import { Plus, Shield } from "lucide-react";
import { PermissionsMatrix } from "@/components/admin/PermissionsMatrix";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RolesAdmin() {
  const { roles, isLoading } = useRoles();
  const [selectedRole, setSelectedRole] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Rôles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les droits d'accès pour chaque rôle de l'application
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Rôle
        </Button>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Liste des rôles */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Rôles</CardTitle>
                <CardDescription>
                  Sélectionnez un rôle pour gérer ses permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {roles?.map(role => (
                        <Button
                          key={role.id}
                          variant={selectedRole?.id === role.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedRole(role)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          <span className="flex-1 text-left">{role.name}</span>
                          {role.description && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {role.description.substring(0, 3)}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Permissions du rôle sélectionné */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedRole ? `Permissions - ${selectedRole.name}` : 'Sélectionnez un rôle'}
                </CardTitle>
                <CardDescription>
                  {selectedRole 
                    ? selectedRole.description || "Gérez les permissions d'accès pour ce rôle"
                    : "Cliquez sur un rôle dans la liste pour voir et modifier ses permissions"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRole ? (
                  <ScrollArea className="h-[500px]">
                    <PermissionsMatrix roleId={selectedRole.id} />
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                      <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Aucun rôle sélectionné
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Choisissez un rôle pour configurer ses permissions
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Attribution des Rôles aux Utilisateurs</CardTitle>
              <CardDescription>
                Gérez les rôles attribués à chaque utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fonctionnalité à venir : liste des utilisateurs avec leurs rôles et possibilité d'assigner/retirer des rôles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
