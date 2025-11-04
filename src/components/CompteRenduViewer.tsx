import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function CompteRenduViewer({ open, onOpenChange, reunion, onEdit }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-muted-foreground">Placeholder: CompteRenduViewer</p>
      </DialogContent>
    </Dialog>
  );
}
