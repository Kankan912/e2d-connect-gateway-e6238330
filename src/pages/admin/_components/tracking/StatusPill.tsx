import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, TrackingStatus } from "@/data/programTracking";

const STYLES: Record<TrackingStatus, string> = {
  termine: "bg-primary/10 text-primary border-primary/30",
  en_cours: "bg-accent/20 text-accent-foreground border-accent",
  non_demarre: "bg-muted text-muted-foreground border-border",
};

export const StatusPill = ({ status }: { status: TrackingStatus }) => (
  <Badge variant="outline" className={STYLES[status]}>
    {STATUS_LABELS[status]}
  </Badge>
);
