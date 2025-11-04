import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ClotureReunionModal({ open, onOpenChange, reunionId, reunionData }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-muted-foreground">Placeholder: ClotureReunionModal</p>
      </DialogContent>
    </Dialog>
  );
}
