import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Settings, Calendar, Users, Shield, Receipt, Bell, Gift, AlertTriangle, Wrench, Download, Banknote } from "lucide-react";
import { ExercicesManager } from "@/components/config/ExercicesManager";
import { CotisationsTypesManager } from "@/components/config/CotisationsTypesManager";
import { SanctionsTarifsManager } from "@/components/config/SanctionsTarifsManager";
import { GestionGeneraleManager } from "@/components/config/GestionGeneraleManager";
import { SauvegardeManager } from "@/components/config/SauvegardeManager";

// Import des pages existantes pour intégration
import RolesAdmin from "./RolesAdmin";
import PermissionsAdmin from "./PermissionsAdmin";
import NotificationsAdmin from "./NotificationsAdmin";
import TontineConfig from "./TontineConfig";
import PretsConfigAdmin from "./PretsConfigAdmin";

const E2DConfigAdmin = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuration E2D
          </h1>
          <p className="text-muted-foreground">
            Paramètres généraux de l'association et de la tontine
          </p>
        </div>
      </div>

      <Tabs defaultValue="exercices" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="exercices" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Exercices
          </TabsTrigger>
          <TabsTrigger value="utilisateurs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="cotisations" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Cotisations
          </TabsTrigger>
          <TabsTrigger value="prets" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Prêts
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="tontine" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Tontine
          </TabsTrigger>
          <TabsTrigger value="sanctions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sanctions
          </TabsTrigger>
          <TabsTrigger value="gestion" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Gestion
          </TabsTrigger>
          <TabsTrigger value="sauvegarde" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Sauvegarde
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercices">
          <ExercicesManager />
        </TabsContent>

        <TabsContent value="utilisateurs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription>
                Gérez les rôles et les accès des membres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matrice des Permissions
              </CardTitle>
              <CardDescription>
                Configurez les droits d'accès par rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cotisations">
          <CotisationsTypesManager />
        </TabsContent>

        <TabsContent value="prets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Configuration des Prêts
              </CardTitle>
              <CardDescription>
                Durées, taux d'intérêt et règles de reconduction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PretsConfigAdmin embedded={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuration des Notifications
              </CardTitle>
              <CardDescription>
                Gérez les campagnes et templates de notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationsAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tontine">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Configuration Tontine
              </CardTitle>
              <CardDescription>
                Paramètres de la tontine et des bénéficiaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TontineConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sanctions">
          <SanctionsTarifsManager />
        </TabsContent>

        <TabsContent value="gestion">
          <GestionGeneraleManager />
        </TabsContent>

        <TabsContent value="sauvegarde">
          <SauvegardeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default E2DConfigAdmin;
