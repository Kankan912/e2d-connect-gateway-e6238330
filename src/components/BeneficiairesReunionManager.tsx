import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Gift } from "lucide-react";

interface BeneficiairesReunionManagerProps {
  reunionId?: string;
}

export default function BeneficiairesReunionManager({ reunionId }: BeneficiairesReunionManagerProps) {
  const [selectedMembreId, setSelectedMembreId] = useState<string>("");
  const { toast } = useToast();

  if (!reunionId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Sélectionnez une réunion pour gérer ses bénéficiaires
          </p>
        </CardContent>
      </Card>
    );
  }

  const { data: membres } = useQuery({
    queryKey: ['membres-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  const beneficiaire = null;

  const assignerBeneficiaire = useMutation({
    mutationFn: async (membreId: string) => {
      toast({ title: "Fonctionnalité à venir", description: "Table beneficiaires à créer" });
      return null;
    }
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gestion du Bénéficiaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fonctionnalité en développement - Table beneficiaires à créer
          </p>
          <div className="flex gap-2">
            <Select value={selectedMembreId} onValueChange={setSelectedMembreId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {membres?.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.nom} {membre.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => assignerBeneficiaire.mutate(selectedMembreId)}
              disabled={!selectedMembreId || assignerBeneficiaire.isPending}
            >
              Assigner
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
