import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendrierBeneficiaires() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: reunions } = useQuery({
    queryKey: ['reunions-beneficiaires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions')
        .select('*')
        .order('date_reunion', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Table beneficiaires à créer
  const beneficiaires: any[] = [];

  const reunionDates = reunions?.map(r => new Date(r.date_reunion)) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier des Bénéficiaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={fr}
                modifiers={{
                  reunion: reunionDates
                }}
                modifiersStyles={{
                  reunion: { backgroundColor: 'hsl(var(--primary))', color: 'white' }
                }}
                className="rounded-md border"
              />
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Prochains Bénéficiaires
              </h3>
              <div className="space-y-3">
                {beneficiaires?.slice(0, 5).map((beneficiaire) => (
                  <Card key={beneficiaire.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {beneficiaire.membre?.nom} {beneficiaire.membre?.prenom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(beneficiaire.date_benefice), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <Badge variant={beneficiaire.statut === 'recu' ? 'default' : 'secondary'}>
                          {beneficiaire.statut}
                        </Badge>
                      </div>
                      {beneficiaire.montant && (
                        <p className="text-sm font-semibold mt-2">
                          Montant: {beneficiaire.montant.toLocaleString('fr-FR')} FCFA
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
