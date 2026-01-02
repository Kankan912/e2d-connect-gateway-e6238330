import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlertesGlobales } from "@/hooks/useAlertesGlobales";
import { NotificationItem } from "./NotificationItem";
import { useState } from "react";

export const NotificationCenter = () => {
  const { alertes, nombreCritiques } = useAlertesGlobales();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {nombreCritiques > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {nombreCritiques > 9 ? '9+' : nombreCritiques}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {alertes.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {alertes.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune notification
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Tout est en ordre !
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-2 space-y-2">
              {alertes.map((alerte) => (
                <NotificationItem 
                  key={alerte.id} 
                  alerte={alerte} 
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
