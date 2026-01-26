import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatFCFA } from "@/lib/utils";

export const NotificationToaster = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    const channel = supabase
      .channel('alertes-temps-reel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prets' },
        (payload) => {
          const pret = payload.new as any;
          const oldPret = payload.old as any;
          
          // Vérifier si le prêt vient de passer en retard
          const today = new Date().toISOString().split('T')[0];
          const wasNotOverdue = oldPret.echeance >= today || oldPret.statut === 'rembourse';
          const isNowOverdue = pret.echeance < today && ['en_cours', 'partiel'].includes(pret.statut);
          
          if (wasNotOverdue && isNowOverdue) {
            toast.warning("Prêt en retard", {
              description: `Un prêt vient de dépasser son échéance`,
              action: {
                label: "Voir",
                onClick: () => navigate('/dashboard/admin/finances/prets'),
              },
            });
          }

          // Invalider les queries pour refresh
          queryClient.invalidateQueries({ queryKey: ['alertes-prets-retard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reunions_sanctions' },
        (payload) => {
          const sanction = payload.new as any;
          
          if (sanction.montant > 0 && sanction.statut !== 'paye') {
            toast.warning("Nouvelle sanction", {
              description: `Une nouvelle sanction de ${formatFCFA(Number(sanction.montant))} a été créée`,
              action: {
                label: "Voir",
                onClick: () => navigate('/dashboard/admin/reunions'),
              },
            });
          }

          queryClient.invalidateQueries({ queryKey: ['alertes-sanctions-impayees'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reunions_sanctions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alertes-sanctions-impayees'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fond_caisse_operations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['solde-caisse-alertes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      initializedRef.current = false;
    };
  }, [user, navigate, queryClient]);

  return null;
};
