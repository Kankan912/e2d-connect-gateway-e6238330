import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackingItem } from "@/data/programTracking";
import { CheckCircle2, Clock, CircleDashed, Gauge } from "lucide-react";

export const TrackingSummary = ({ items }: { items: TrackingItem[] }) => {
  const total = items.length || 1;
  const global = Math.round(items.reduce((sum, i) => sum + i.progress, 0) / total);
  const cards = [
    { label: "Avancement global", value: `${global}%`, icon: Gauge },
    { label: "Terminés", value: items.filter((i) => i.status === "termine").length, icon: CheckCircle2 },
    { label: "En cours", value: items.filter((i) => i.status === "en_cours").length, icon: Clock },
    { label: "Non démarrés", value: items.filter((i) => i.status === "non_demarre").length, icon: CircleDashed },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <card.icon className="h-4 w-4 text-primary" />
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
