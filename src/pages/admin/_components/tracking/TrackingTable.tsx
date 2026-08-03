import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrackingItem } from "@/data/programTracking";
import { StatusPill } from "./StatusPill";

interface TrackingTableProps {
  title: string;
  description: string;
  firstColumn: string;
  items: TrackingItem[];
}

export const TrackingTable = ({ title, description, firstColumn, items }: TrackingTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">{firstColumn}</TableHead>
            <TableHead>Périmètre</TableHead>
            <TableHead className="w-[130px]">Statut</TableHead>
            <TableHead className="w-[160px]">Avancement</TableHead>
            <TableHead>Détail / reste à faire</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Aucun élément ne correspond aux filtres
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium whitespace-nowrap">{item.label}</TableCell>
                <TableCell>{item.scope}</TableCell>
                <TableCell>
                  <StatusPill status={item.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={item.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{item.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.detail}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
