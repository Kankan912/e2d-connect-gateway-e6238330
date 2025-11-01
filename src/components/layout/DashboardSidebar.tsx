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
  { title: "Gestion Membres", url: "/dashboard/admin/membres", icon: Users },
  { title: "Statistiques", url: "/dashboard/admin/stats", icon: BarChart3 },
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
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
      </SidebarContent>
    </Sidebar>
  );
}
