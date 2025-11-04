export function useEnsureAdmin() {
  const withEnsureAdmin = async (operation: () => Promise<void>) => {
    // Placeholder - Vérifier les permissions admin
    await operation();
  };
  
  return { withEnsureAdmin };
}
