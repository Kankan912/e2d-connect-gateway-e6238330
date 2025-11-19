import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useEnsureAdmin() {
  const { userRole } = useAuth();

  const withEnsureAdmin = async (operation: () => Promise<void>) => {
    if (userRole !== "admin") {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur pour effectuer cette action.",
        variant: "destructive",
      });
      return;
    }
    await operation();
  };

  return { withEnsureAdmin, isAdmin: userRole === "admin" };
}
