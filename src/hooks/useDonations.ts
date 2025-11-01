import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DonationFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  isRecurring?: boolean;
}

export const useDonations = (filters?: DonationFilters) => {
  return useQuery({
    queryKey: ["donations", filters],
    queryFn: async () => {
      let query = supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }
      if (filters?.paymentMethod) {
        query = query.eq("payment_method", filters.paymentMethod);
      }
      if (filters?.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters?.isRecurring !== undefined) {
        query = query.eq("is_recurring", filters.isRecurring);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};

export const useDonationStats = (period: "month" | "year" = "month") => {
  return useQuery({
    queryKey: ["donation-stats", period],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("donations-stats", {
        body: { period },
      });

      if (error) throw error;
      return data;
    },
  });
};
