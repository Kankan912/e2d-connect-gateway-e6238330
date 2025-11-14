import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import LogoHeader from "@/components/LogoHeader";
import BackButton from "@/components/BackButton";

export default function TontineConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const { data: configs } = useQuery({
    queryKey: ['beneficiaires-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beneficiaires_config')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    mode_calcul: "pourcentage",
    pourcentage_cotisations: 100,
    montant_fixe: 0,
    actif: true
  });

  const createConfig = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('beneficiaires_config')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-config'] });
      toast({ title: "Configuration créée avec succès" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('beneficiaires_config')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-config'] });
      toast({ title: "Configuration mise à jour" });
      setEditingConfig(null);
      resetForm();
    }
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('beneficiaires_config')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-config'] });
      toast({ title: "Configuration supprimée" });
    }
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      mode_calcul: "pourcentage",
      pourcentage_cotisations: 100,
      montant_fixe: 0,
      actif: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConfig) {
      updateConfig.mutate({ id: editingConfig.id, data: formData });
    } else {
      createConfig.mutate(formData);
    }
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      nom: config.nom,
      description: config.description || "",
      mode_calcul: config.mode_calcul,
      pourcentage_cotisations: config.pourcentage_cotisations || 100,
      montant_fixe: config.montant_fixe || 0,
      actif: config.actif
    });
    setShowAddDialog(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <LogoHeader 
            title="Configuration Tontine"
            subtitle="Gérez les paramètres de calcul des bénéfices"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Configuration
        </Button>
      </div>

      {/* Liste des configurations */}
      <div className="grid gap-4">
        {configs?.map(config => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{config.nom}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.actif} disabled />
                  <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteConfig.mutate(config.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mode de calcul:</span>
                  <p className="font-medium">{config.mode_calcul}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pourcentage:</span>
                  <p className="font-medium">{config.pourcentage_cotisations}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Montant fixe:</span>
                  <p className="font-medium">{config.montant_fixe} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire */}
      {showAddDialog && (
        <Card>
          <CardHeader>
            <CardTitle>{editingConfig ? "Modifier" : "Nouvelle"} Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input 
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Mode de calcul</Label>
                <Select 
                  value={formData.mode_calcul}
                  onValueChange={(value) => setFormData({ ...formData, mode_calcul: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pourcentage">Pourcentage</SelectItem>
                    <SelectItem value="montant_fixe">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.mode_calcul === "pourcentage" && (
                <div>
                  <Label>Pourcentage des cotisations (%)</Label>
                  <Input 
                    type="number"
                    value={formData.pourcentage_cotisations}
                    onChange={(e) => setFormData({ ...formData, pourcentage_cotisations: Number(e.target.value) })}
                  />
                </div>
              )}

              {formData.mode_calcul === "montant_fixe" && (
                <div>
                  <Label>Montant fixe (FCFA)</Label>
                  <Input 
                    type="number"
                    value={formData.montant_fixe}
                    onChange={(e) => setFormData({ ...formData, montant_fixe: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
                <Label>Configuration active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingConfig ? "Mettre à jour" : "Créer"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingConfig(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
