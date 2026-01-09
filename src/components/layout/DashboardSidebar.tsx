import { NavLink, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  User,
  Heart,
  Receipt,
  DollarSign,
  UserPlus,
  Settings,
  Users,
  BarChart3,
  Palette,
  Calendar,
  Camera,
  Handshake,
  PiggyBank,
  CheckSquare,
  Trophy,
  Flame,
  Dumbbell,
  Gauge,
  Shield,
  Gift,
  Bell,
  Download,
  HandCoins,
  Building2,
  HandHeart,
  Wallet,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import logoE2D from "@/assets/logo-e2d.png";

const memberItems = [
  { title: "Accueil", url: "/dashboard", icon: Home },
  { title: "Mon Profil", url: "/dashboard/profile", icon: User },
  { title: "Mes Dons", url: "/dashboard/my-donations", icon: Heart },
  { title: "Mes Cotisations", url: "/dashboard/my-cotisations", icon: Receipt },
];

// E2D - Section principale regroupant tous les modules internes
const e2dCotisationsItems = [
  { title: "Épargnes", url: "/dashboard/admin/tontine/epargnes", icon: PiggyBank, resource: "epargnes" },
  { title: "Bénéficiaires", url: "/dashboard/admin/tontine/beneficiaires", icon: Gift, resource: "epargnes" },
  { title: "Caisse", url: "/dashboard/admin/caisse", icon: Wallet, resource: "epargnes" },
];

const e2dReunionsItems = [
  { title: "Réunions", url: "/dashboard/admin/reunions", icon: Calendar, resource: "reunions" },
];

const e2dFinancesItems = [
  { title: "Prêts", url: "/dashboard/admin/finances/prets", icon: HandCoins, resource: "prets" },
  { title: "Config Prêts", url: "/dashboard/admin/finances/prets/config", icon: Settings, resource: "config" },
  { title: "Aides", url: "/dashboard/admin/finances/aides", icon: HandHeart, resource: "aides" },
];

const e2dTontineItems = [
  { title: "Configuration Tontine", url: "/dashboard/admin/tontine/config", icon: Settings, resource: "config" },
];

const e2dGestionItems = [
  { title: "Membres", url: "/dashboard/admin/membres", icon: Users, resource: "membres" },
  { title: "Rôles & Permissions", url: "/dashboard/admin/roles", icon: Shield, resource: "roles" },
  { title: "Statistiques", url: "/dashboard/admin/stats", icon: BarChart3, resource: "stats" },
  { title: "Rapports Financiers", url: "/dashboard/admin/rapports", icon: FileText, resource: "stats" },
  { title: "Configuration E2D", url: "/dashboard/admin/e2d-config", icon: Settings, resource: "config" },
];

// Section Administration site public
const adminPublicItems = [
  { title: "Gestion des Dons", url: "/dashboard/admin/donations", icon: DollarSign, resource: "donations" },
  { title: "Gestion des Adhésions", url: "/dashboard/admin/adhesions", icon: UserPlus, resource: "adhesions" },
  { title: "Configuration Paiements", url: "/dashboard/admin/payment-config", icon: Settings, resource: "config" },
];

// Section Sport
const sportItems = [
  { title: "Vue d'Ensemble", url: "/dashboard/admin/sport", icon: Gauge, resource: "sport_e2d" },
  { title: "Matchs E2D", url: "/dashboard/admin/sport/e2d", icon: Trophy, resource: "sport_e2d" },
  { title: "Phoenix", url: "/dashboard/admin/sport/phoenix", icon: Flame, resource: "sport_phoenix" },
  { title: "Équipes", url: "/dashboard/admin/sport/equipes", icon: Users, resource: "sport_phoenix" },
  { title: "Présences", url: "/dashboard/admin/presences", icon: CheckSquare, resource: "presences" },
  { title: "Entraînements", url: "/dashboard/admin/sport/entrainements", icon: Dumbbell, resource: "sport_phoenix" },
  { title: "Sanctions Sport", url: "/dashboard/admin/sport/sanctions", icon: Shield, resource: "sport_phoenix" },
  { title: "Match Gala", url: "/dashboard/admin/sport/match-gala", icon: Trophy, resource: "sport_phoenix" },
];

// Section Communication
const communicationItems = [
  { title: "Notifications", url: "/dashboard/admin/communication/notifications", icon: Bell, resource: "notifications" },
];

// Section Configuration - Supprimée, maintenant intégrée dans Configuration E2D

// Section Site Web (CMS)
const siteItems = [
  { title: "Hero", url: "/dashboard/admin/site/hero", icon: Palette, resource: "site" },
  { title: "À Propos", url: "/dashboard/admin/site/about", icon: Heart, resource: "site" },
  { title: "Activités", url: "/dashboard/admin/site/activities", icon: Heart, resource: "site" },
  { title: "Événements", url: "/dashboard/admin/site/events", icon: Calendar, resource: "site" },
  { title: "Galerie", url: "/dashboard/admin/site/gallery", icon: Camera, resource: "site" },
  { title: "Partenaires", url: "/dashboard/admin/site/partners", icon: Handshake, resource: "site" },
  { title: "Images", url: "/dashboard/admin/site/images", icon: Camera, resource: "site" },
  { title: "Messages", url: "/dashboard/admin/site/messages", icon: Users, resource: "site" },
  { title: "Configuration", url: "/dashboard/admin/site/config", icon: Settings, resource: "site" },
];

export function DashboardSidebar() {
  const { hasPermission } = usePermissions();
  const { userRole } = useAuth();
  const { open } = useSidebar();
  const location = useLocation();

  // Compter les prêts en retard pour le badge
  const { data: pretsEnRetardCount } = useQuery({
    queryKey: ["prets-en-retard-count"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("prets")
        .select("*", { count: "exact", head: true })
        .lt("echeance", today)
        .neq("statut", "rembourse");
      if (error) throw error;
      return count || 0;
    },
  });

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Filtrer les items selon les permissions
  const visibleE2dCotisationsItems = e2dCotisationsItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleE2dReunionsItems = e2dReunionsItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleE2dFinancesItems = e2dFinancesItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleE2dTontineItems = e2dTontineItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleE2dGestionItems = e2dGestionItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleAdminPublicItems = adminPublicItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleSportItems = sportItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleCommunicationItems = communicationItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleSiteItems = siteItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );

  // Vérifier si les sections doivent être affichées
  const hasE2dAccess = visibleE2dCotisationsItems.length > 0 || 
                       visibleE2dReunionsItems.length > 0 || 
                       visibleE2dFinancesItems.length > 0 ||
                       visibleE2dTontineItems.length > 0 ||
                       visibleE2dGestionItems.length > 0;
  const hasAdminPublicAccess = visibleAdminPublicItems.length > 0;
  const hasSportAccess = visibleSportItems.length > 0;
  const hasCommunicationAccess = visibleCommunicationItems.length > 0;
  const hasSiteAccess = visibleSiteItems.length > 0;

  const renderMenuItems = (items: typeof memberItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const isPrets = item.url === "/dashboard/admin/finances/prets";
        const showBadge = isPrets && pretsEnRetardCount && pretsEnRetardCount > 0;
        
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive(item.url)}>
              <NavLink to={item.url} className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {open && (
                  <span className="flex items-center gap-2">
                    {item.title}
                    {showBadge && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                        {pretsEnRetardCount}
                      </Badge>
                    )}
                  </span>
                )}
                {!open && showBadge && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="flex items-center gap-3">
          <img src={logoE2D} alt="E2D" className="h-8 w-8 object-contain" />
          {open && (
            <div className="flex-1">
              <h2 className="font-bold text-sidebar-foreground">E2D Connect</h2>
              <p className="text-xs text-muted-foreground">Portail Membre</p>
            </div>
          )}
        </div>
        {open && userRole && (
          <Badge variant="outline" className="w-full justify-center text-xs">
            {userRole === 'administrateur' && '👑 Super Admin'}
            {userRole === 'tresorier' && '💰 Trésorier'}
            {userRole === 'secretaire_general' && '📝 Secrétaire Général'}
            {userRole === 'responsable_sportif' && '⚽ Resp. Sportif'}
            {userRole === 'censeur' && '⚖️ Censeur'}
            {userRole === 'commissaire_comptes' && '🔍 Commissaire'}
            {!['administrateur', 'tresorier', 'secretaire_general', 'responsable_sportif', 'censeur', 'commissaire_comptes'].includes(userRole) && `📋 ${userRole}`}
          </Badge>
        )}
        <SidebarTrigger className="absolute top-4 right-2" />
      </div>

      <SidebarContent>
        {/* Mon Espace - toujours visible */}
        <SidebarGroup>
          <SidebarGroupLabel>Mon Espace</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(memberItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* E2D - Section principale regroupant tous les modules internes */}
        {hasE2dAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              E2D
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {visibleE2dCotisationsItems.length > 0 && (
                <div className="mb-2">
                  {open && <p className="text-xs text-muted-foreground px-3 py-1">Cotisations & Épargnes</p>}
                  {renderMenuItems(visibleE2dCotisationsItems)}
                </div>
              )}
              {visibleE2dReunionsItems.length > 0 && (
                <div className="mb-2">
                  {open && <p className="text-xs text-muted-foreground px-3 py-1">Réunions</p>}
                  {renderMenuItems(visibleE2dReunionsItems)}
                </div>
              )}
              {visibleE2dFinancesItems.length > 0 && (
                <div className="mb-2">
                  {open && <p className="text-xs text-muted-foreground px-3 py-1">Prêts & Aides</p>}
                  {renderMenuItems(visibleE2dFinancesItems)}
                </div>
              )}
              {visibleE2dTontineItems.length > 0 && (
                <div className="mb-2">
                  {open && <p className="text-xs text-muted-foreground px-3 py-1">Tontine</p>}
                  {renderMenuItems(visibleE2dTontineItems)}
                </div>
              )}
              {visibleE2dGestionItems.length > 0 && (
                <div className="mb-2">
                  {open && <p className="text-xs text-muted-foreground px-3 py-1">Gestion</p>}
                  {renderMenuItems(visibleE2dGestionItems)}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administration Site Public */}
        {hasAdminPublicAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(visibleAdminPublicItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sport */}
        {hasSportAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Sport</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(visibleSportItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Communication */}
        {hasCommunicationAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Communication</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(visibleCommunicationItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Site Web (CMS) */}
        {hasSiteAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Site Web</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(visibleSiteItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
