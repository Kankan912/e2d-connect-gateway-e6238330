import { NavLink, useLocation } from "react-router-dom";
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
import logoE2D from "@/assets/logo-e2d.png";

const memberItems = [
  { title: "Accueil", url: "/dashboard", icon: Home },
  { title: "Mon Profil", url: "/dashboard/profile", icon: User },
  { title: "Mes Dons", url: "/dashboard/my-donations", icon: Heart },
  { title: "Mes Cotisations", url: "/dashboard/my-cotisations", icon: Receipt },
];

const adminItems = [
  { title: "Gestion des Dons", url: "/dashboard/admin/donations", icon: DollarSign },
  { title: "Gestion des Adhésions", url: "/dashboard/admin/adhesions", icon: UserPlus },
  { title: "Configuration Paiements", url: "/dashboard/admin/payment-config", icon: Settings },
];

const gestionItems = [
  { title: "Gestion Membres", url: "/dashboard/admin/membres", icon: Users },
  { title: "Rôles & Permissions", url: "/dashboard/admin/roles", icon: Shield },
  { title: "Statistiques", url: "/dashboard/admin/stats", icon: BarChart3 },
];

const tontineItems = [
  { title: "Épargnes", url: "/dashboard/admin/tontine/epargnes", icon: PiggyBank },
  { title: "Configuration", url: "/dashboard/admin/tontine/config", icon: Settings },
];

const reunionItems = [
  { title: "Réunions", url: "/dashboard/admin/reunions", icon: Calendar },
  { title: "Présences", url: "/dashboard/admin/presences", icon: CheckSquare },
];

const sportItems = [
  { title: "Vue d'Ensemble", url: "/dashboard/admin/sport", icon: Gauge },
  { title: "Matchs E2D", url: "/dashboard/admin/sport/e2d", icon: Trophy },
  { title: "Phoenix", url: "/dashboard/admin/sport/phoenix", icon: Flame },
  { title: "Entraînements", url: "/dashboard/admin/sport/entrainements", icon: Dumbbell },
];

const siteItems = [
  { title: "Hero", url: "/dashboard/admin/site/hero", icon: Palette },
  { title: "Activités", url: "/dashboard/admin/site/activities", icon: Heart },
  { title: "Événements", url: "/dashboard/admin/site/events", icon: Calendar },
  { title: "Galerie", url: "/dashboard/admin/site/gallery", icon: Camera },
  { title: "Partenaires", url: "/dashboard/admin/site/partners", icon: Handshake },
  { title: "Configuration", url: "/dashboard/admin/site/config", icon: Settings },
];

export function DashboardSidebar() {
  const { userRole } = useAuth();
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const isAdmin = userRole === "admin" || userRole === "tresorier";

  return (
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoE2D} alt="E2D" className="h-8 w-8 object-contain" />
          {open && (
            <div>
              <h2 className="font-bold text-sidebar-foreground">E2D Connect</h2>
              <p className="text-xs text-muted-foreground">Portail Membre</p>
            </div>
          )}
        </div>
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Finances</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Tontine</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tontineItems.map((item) => (
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

        {(userRole === "admin" || userRole === "secretaire") && (
          <SidebarGroup>
            <SidebarGroupLabel>Réunions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {reunionItems.map((item) => (
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

        {(userRole === "admin" || userRole === "responsable_sportif") && (
          <SidebarGroup>
            <SidebarGroupLabel>Sport</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sportItems.map((item) => (
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

        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestion</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {gestionItems.map((item) => (
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

        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Site Web</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {siteItems.map((item) => (
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
