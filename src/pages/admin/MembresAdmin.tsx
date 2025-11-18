import { useState } from "react";
import { Users, Plus, Edit, Trash2, Search, Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMembers } from "@/hooks/useMembers";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

export default function MembresAdmin() {
  const { members: membres = [], isLoading } = useMembers();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredMembres = membres.filter((membre) =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    toast({ title: "Export en cours...", description: "Fonctionnalité à venir" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestion des Membres
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les membres de l'association
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Membre
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Membres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membres.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {membres.filter(m => m.statut === 'actif').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">E2D</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {membres.filter(m => m.est_membre_e2d).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phoenix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {membres.filter(m => m.est_adherent_phoenix).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Membres</CardTitle>
          <CardDescription>
            {filteredMembres.length} membre(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {filteredMembres.map((membre) => (
                <div
                  key={membre.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {membre.nom} {membre.prenom}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={membre.statut === 'actif' ? 'default' : 'secondary'}>
                        {membre.statut}
                      </Badge>
                      {membre.est_membre_e2d && <Badge variant="outline">E2D</Badge>}
                      {membre.est_adherent_phoenix && <Badge variant="outline">Phoenix</Badge>}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{membre.email}</span>
                      <span>{membre.telephone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
