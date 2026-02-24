import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const { roles } = useRoles();
  const { members } = useMembers();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    password: generatePassword(),
    sendEmail: true,
    selectedRoles: [] as string[],
    membreId: "none",
  });

  // Members not linked to any user
  const availableMembers = members?.filter((m) => !m.user_id) || [];

  const handleRoleToggle = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter((r) => r !== roleId)
        : [...prev.selectedRoles, roleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.nom || !formData.prenom) {
      toast.error("Email, nom et prénom sont obligatoires");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-platform-user", {
        body: {
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone || null,
          password: formData.password,
          sendEmail: formData.sendEmail,
          roleIds: formData.selectedRoles,
          membreId: formData.membreId === "none" ? null : formData.membreId,
        },
      });

      if (error) {
        const errorMessage = data?.error || error.message;
        throw new Error(errorMessage);
      }
      if (data?.error) throw new Error(data.error);

      toast.success("Compte utilisateur créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["membres"] });

      // Reset form
      setFormData({
        email: "",
        nom: "",
        prenom: "",
        telephone: "",
        password: generatePassword(),
        sendEmail: true,
        selectedRoles: [],
        membreId: "none",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un compte utilisateur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Jean"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean.dupont@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe temporaire</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ ...formData, password: generatePassword() })}
              >
                Régénérer
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rôles</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
              {formData.selectedRoles.length === 0 ? (
                <span className="text-muted-foreground text-sm">Aucun rôle sélectionné</span>
              ) : (
                formData.selectedRoles.map((roleId) => {
                  const role = roles?.find((r) => r.id === roleId);
                  return (
                    <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                      {role?.name}
                      <button type="button" onClick={() => handleRoleToggle(roleId)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })
              )}
            </div>
            <Select onValueChange={handleRoleToggle}>
              <SelectTrigger>
                <SelectValue placeholder="Ajouter un rôle..." />
              </SelectTrigger>
              <SelectContent>
                {roles
                  ?.filter((r) => !formData.selectedRoles.includes(r.id))
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lier à un membre (optionnel)</Label>
            <Select
              value={formData.membreId}
              onValueChange={(value) => setFormData({ ...formData, membreId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {availableMembers.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.prenom} {membre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sendEmail: checked as boolean })
              }
            />
            <Label htmlFor="sendEmail" className="font-normal">
              Envoyer un email d'invitation avec les identifiants
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le compte"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
