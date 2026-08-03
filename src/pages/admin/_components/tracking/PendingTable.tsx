import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pendingItems } from "@/data/programTracking";

const CRIT_STYLES: Record<string, string> = {
  P1: "bg-destructive/10 text-destructive border-destructive/30",
  P2: "bg-accent/20 text-accent-foreground border-accent",
  P3: "bg-muted text-muted-foreground border-border",
};

export const PendingTable = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Reste à faire, priorisé</CardTitle>
      <p className="text-sm text-muted-foreground">Ordre d'exécution recommandé</p>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">Ordre</TableHead>
            <TableHead>Élément</TableHead>
            <TableHead className="w-[110px]">Criticité</TableHead>
            <TableHead>Impact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...pendingItems]
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.order}</TableCell>
                <TableCell>{item.label}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={CRIT_STYLES[item.criticality]}>
                    {item.criticality}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.impact}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
