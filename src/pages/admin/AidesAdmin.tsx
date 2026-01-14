import { useState } from "react";
import { Heart, Plus, Edit, Trash2, Settings, HandHeart, Calendar } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import AideForm from "@/components/forms/AideForm";
import {
  useAides,
  useAidesTypes,
  useCreateAide,
  useUpdateAide,
  useDeleteAide,
  useCreateAideType,
  useDeleteAideType,
} from "@/hooks/useAides";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AidesAdmin() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAide, setSelectedAide] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aideToDelete, setAideToDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");

  // Type d'aide management
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeMontant, setNewTypeMontant] = useState("");
  const [newTypeMode, setNewTypeMode] = useState("equitable");
  
  const { hasPermission } = usePermissions();

  const { data: aides, isLoading } = useAides();
  const { data: typesAide } = useAidesTypes();
  const createAide = useCreateAide();
  const updateAide = useUpdateAide();
  const deleteAide = useDeleteAide();
  const createAideType = useCreateAideType();
  const deleteAideType = useDeleteAideType();

  const handleSubmit = (data: any) => {
    if (selectedAide) {
      updateAide.mutate({ id: selectedAide.id, ...data });
    } else {
      createAide.mutate(data);
    }
    setFormOpen(false);
    setSelectedAide(null);
  };

  const handleCreateType = () => {
    if (!newTypeName.trim()) return;
    createAideType.mutate({
      nom: newTypeName,
      description: newTypeDescription || null,
      montant_defaut: newTypeMontant ? parseFloat(newTypeMontant) : null,
      mode_repartition: newTypeMode,
      delai_remboursement: null,
    });
    setNewTypeName("");
    setNewTypeDescription("");
    setNewTypeMontant("");
    setNewTypeMode("equitable");
    setTypeFormOpen(false);
  };

  const filteredAides = aides?.filter(aide => {
    if (filterType !== "all" && aide.type_aide_id !== filterType) return false;
    if (filterStatut !== "all" && aide.statut !== filterStatut) return false;
    return true;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "demandee":
        return <Badge variant="secondary">Demandée</Badge>;
      case "alloue":
        return <Badge className="bg-success text-success-foreground">Allouée</Badge>;
      case "refusee":
        return <Badge variant="destructive">Refusée</Badge>;
      case "remboursee":
        return <Badge variant="outline">Remboursée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getContexteBadge = (contexte: string) => {
    switch (contexte) {
      case "reunion":
        return <Badge variant="outline">Réunion</Badge>;
      case "urgent":
        return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
      case "exceptionnel":
        return <Badge variant="secondary">Exceptionnel</Badge>;
      default:
        return <Badge variant="outline">{contexte}</Badge>;
    }
  };

  // Statistiques
  const totalAides = aides?.length || 0;
  const aidesAllouees = aides?.filter(a => a.statut === "alloue").length || 0;
  const montantTotal = aides?.filter(a => a.statut === "alloue").reduce((sum, a) => sum + a.montant, 0) || 0;
  const aidesDemandees = aides?.filter(a => a.statut === "demandee").length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HandHeart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestion des Aides</h1>
        </div>
        {hasPermission('aides', 'create') && (
          <Button onClick={() => { setSelectedAide(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Aide
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Aides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalAides}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Aides Allouées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{aidesAllouees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Montant Total Alloué</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{montantTotal.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{aidesDemandees}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="aides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aides" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Aides
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Types d'aides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aides">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des Aides</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {typesAide?.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="demandee">Demandée</SelectItem>
                      <SelectItem value="alloue">Allouée</SelectItem>
                      <SelectItem value="refusee">Refusée</SelectItem>
                      <SelectItem value="remboursee">Remboursée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Chargement...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Réunion</TableHead>
                      <TableHead>Contexte</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAides?.map((aide) => (
                      <TableRow key={aide.id}>
                        <TableCell>{new Date(aide.date_allocation).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>
                          {aide.beneficiaire?.nom} {aide.beneficiaire?.prenom}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{aide.type_aide?.nom}</Badge>
                        </TableCell>
                        <TableCell>{aide.montant.toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          {aide.reunion ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Calendar className="h-3 w-3" />
                              {new Date(aide.reunion.date_reunion).toLocaleDateString("fr-FR")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getContexteBadge(aide.contexte_aide)}</TableCell>
                        <TableCell>{getStatutBadge(aide.statut)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {hasPermission('aides', 'update') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedAide(aide); setFormOpen(true); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission('aides', 'delete') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => { setAideToDelete(aide.id); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAides?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucune aide trouvée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Types d'aides</CardTitle>
                <Button onClick={() => setTypeFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant par défaut</TableHead>
                    <TableHead>Mode de répartition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesAide?.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.nom}</TableCell>
                      <TableCell>{type.description || "-"}</TableCell>
                      <TableCell>
                        {type.montant_defaut ? `${type.montant_defaut.toLocaleString()} FCFA` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{type.mode_repartition}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAideType.mutate(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AideForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedAide(null); }}
        onSubmit={handleSubmit}
        initialData={selectedAide}
      />

      {/* Dialog pour créer un type d'aide */}
      <Dialog open={typeFormOpen} onOpenChange={setTypeFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau type d'aide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ex: Aide décès"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
                placeholder="Description du type d'aide..."
              />
            </div>
            <div>
              <Label>Montant par défaut (FCFA)</Label>
              <Input
                type="number"
                value={newTypeMontant}
                onChange={(e) => setNewTypeMontant(e.target.value)}
                placeholder="Ex: 50000"
              />
            </div>
            <div>
              <Label>Mode de répartition</Label>
              <Select value={newTypeMode} onValueChange={setNewTypeMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equitable">Équitable</SelectItem>
                  <SelectItem value="proportionnel">Proportionnel</SelectItem>
                  <SelectItem value="fixe">Fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setTypeFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateType}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette aide ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (aideToDelete) deleteAide.mutate(aideToDelete);
              setDeleteDialogOpen(false);
              setAideToDelete(null);
            }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
