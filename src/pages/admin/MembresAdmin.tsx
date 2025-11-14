import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Users, Search } from "lucide-react";
import LogoHeader from "@/components/LogoHeader";
import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MembresAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMembre, setEditingMembre] = useState<any>(null);

  const { data: membres, isLoading } = useQuery({
    queryKey: ['membres-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    fonction: "",
    statut: "actif",
    equipe: ""
  });

  const createMembre = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('membres')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres-admin'] });
      toast({ title: "Membre créé avec succès" });
      setShowAddDialog(false);
      resetForm();
    }
  });

  const updateMembre = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('membres')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres-admin'] });
      toast({ title: "Membre mis à jour" });
      setEditingMembre(null);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const deleteMembre = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('membres')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres-admin'] });
      toast({ title: "Membre supprimé" });
    }
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      fonction: "",
      statut: "actif",
      equipe: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMembre) {
      updateMembre.mutate({ id: editingMembre.id, data: formData });
    } else {
      createMembre.mutate(formData);
    }
  };

  const handleEdit = (membre: any) => {
    setEditingMembre(membre);
    setFormData({
      nom: membre.nom,
      prenom: membre.prenom,
      telephone: membre.telephone || "",
      email: membre.email || "",
      fonction: membre.fonction || "",
      statut: membre.statut || "actif",
      equipe: membre.equipe || ""
    });
    setShowAddDialog(true);
  };

  const filteredMembres = membres?.filter(m => 
    `${m.nom} ${m.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.telephone?.includes(searchTerm) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <LogoHeader 
            title="Gestion des Membres"
            subtitle="Gérez les membres de l'association"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingMembre(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Membre
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMembre ? "Modifier" : "Nouveau"} Membre</DialogTitle>
              <DialogDescription>
                Remplissez les informations du membre
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom *</Label>
                  <Input 
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Prénom *</Label>
                  <Input 
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone *</Label>
                  <Input 
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fonction</Label>
                  <Input 
                    value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Équipe</Label>
                  <Input 
                    value={formData.equipe}
                    onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingMembre ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membres?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {membres?.filter(m => m.statut === 'actif').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {membres?.filter(m => m.statut === 'inactif').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Membres ({filteredMembres?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredMembres?.map(membre => (
              <div key={membre.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{membre.nom} {membre.prenom}</h4>
                    <Badge variant={membre.statut === 'actif' ? 'default' : 'secondary'}>
                      {membre.statut}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>{membre.telephone}</p>
                    {membre.email && <p>{membre.email}</p>}
                    {membre.fonction && <p>Fonction: {membre.fonction}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(membre)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
                        deleteMembre.mutate(membre.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
