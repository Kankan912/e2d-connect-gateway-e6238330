import { NavLink, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
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

const adminItems = [
  { title: "Gestion des Dons", url: "/dashboard/admin/donations", icon: DollarSign, resource: "donations" },
  { title: "Gestion des Adhésions", url: "/dashboard/admin/adhesions", icon: UserPlus, resource: "adhesions" },
  { title: "Configuration Paiements", url: "/dashboard/admin/payment-config", icon: Settings, resource: "config" },
];

const gestionItems = [
  { title: "Gestion Membres", url: "/dashboard/admin/membres", icon: Users, resource: "membres" },
  { title: "Rôles & Permissions", url: "/dashboard/admin/roles", icon: Shield, resource: "roles" },
  { title: "Statistiques", url: "/dashboard/admin/stats", icon: BarChart3, resource: "stats" },
];

const tontineItems = [
  { title: "Épargnes", url: "/dashboard/admin/tontine/epargnes", icon: PiggyBank, resource: "epargnes" },
  { title: "Bénéficiaires", url: "/dashboard/admin/tontine/beneficiaires", icon: Gift, resource: "epargnes" },
  { title: "Configuration", url: "/dashboard/admin/tontine/config", icon: Settings, resource: "config" },
];

const reunionItems = [
  { title: "Réunions", url: "/dashboard/admin/reunions", icon: Calendar, resource: "reunions" },
  { title: "Présences", url: "/dashboard/admin/presences", icon: CheckSquare, resource: "presences" },
];

const sportItems = [
  { title: "Vue d'Ensemble", url: "/dashboard/admin/sport", icon: Gauge, resource: "sport_e2d" },
  { title: "Matchs E2D", url: "/dashboard/admin/sport/e2d", icon: Trophy, resource: "sport_e2d" },
  { title: "Phoenix", url: "/dashboard/admin/sport/phoenix", icon: Flame, resource: "sport_phoenix" },
  { title: "Équipes", url: "/dashboard/admin/sport/equipes", icon: Users, resource: "sport_phoenix" },
  { title: "Entraînements", url: "/dashboard/admin/sport/entrainements", icon: Dumbbell, resource: "sport_phoenix" },
  { title: "Sanctions", url: "/dashboard/admin/sport/sanctions", icon: Shield, resource: "sport_phoenix" },
  { title: "Match Gala", url: "/dashboard/admin/sport/match-gala", icon: Trophy, resource: "sport_phoenix" },
];

const financeAvanceeItems = [
  { title: "Prêts", url: "/dashboard/admin/finances/prets", icon: HandCoins, resource: "prets" },
];

const communicationItems = [
  { title: "Notifications", url: "/dashboard/admin/communication/notifications", icon: Bell, resource: "notifications" },
];

const configItems = [
  { title: "Exports Programmés", url: "/dashboard/admin/config/exports", icon: Download, resource: "config" },
];

const siteItems = [
  { title: "Hero", url: "/dashboard/admin/site/hero", icon: Palette, resource: "site" },
  { title: "Activités", url: "/dashboard/admin/site/activities", icon: Heart, resource: "site" },
  { title: "Événements", url: "/dashboard/admin/site/events", icon: Calendar, resource: "site" },
  { title: "Galerie", url: "/dashboard/admin/site/gallery", icon: Camera, resource: "site" },
  { title: "Partenaires", url: "/dashboard/admin/site/partners", icon: Handshake, resource: "site" },
  { title: "Configuration", url: "/dashboard/admin/site/config", icon: Settings, resource: "site" },
];

export function DashboardSidebar() {
  const { hasPermission } = usePermissions();
  const { userRole } = useAuth();
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Filtrer les items selon les permissions
  const visibleAdminItems = adminItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleGestionItems = gestionItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleTontineItems = tontineItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleReunionItems = reunionItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleSportItems = sportItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleFinanceAvanceeItems = financeAvanceeItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleCommunicationItems = communicationItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleConfigItems = configItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );
  const visibleSiteItems = siteItems.filter(item => 
    !item.resource || hasPermission(item.resource, 'read')
  );

  // Vérifier si les sections doivent être affichées
  const hasFinancesAccess = visibleAdminItems.length > 0;
  const hasTontineAccess = visibleTontineItems.length > 0;
  const hasReunionsAccess = visibleReunionItems.length > 0;
  const hasSportAccess = visibleSportItems.length > 0;
  const hasFinanceAvanceeAccess = visibleFinanceAvanceeItems.length > 0;
  const hasCommunicationAccess = visibleCommunicationItems.length > 0;
  const hasConfigAccess = visibleConfigItems.length > 0;
  const hasGestionAccess = visibleGestionItems.length > 0;
  const hasSiteAccess = visibleSiteItems.length > 0;

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
        <SidebarGroup>
          <SidebarGroupLabel>Mon Espace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasFinancesAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Finances</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasTontineAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Tontine</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleTontineItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasReunionsAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Réunions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleReunionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasSportAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Sport</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSportItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasFinanceAvanceeAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Finances Avancées</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleFinanceAvanceeItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasCommunicationAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Communication</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleCommunicationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasConfigAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleConfigItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasGestionAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestion</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleGestionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasSiteAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Site Web</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSiteItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
