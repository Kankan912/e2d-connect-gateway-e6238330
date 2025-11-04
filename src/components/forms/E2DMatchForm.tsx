import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function E2DMatchForm({ open, onOpenChange, onSuccess }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-muted-foreground">Placeholder: E2DMatchForm</p>
      </DialogContent>
    </Dialog>
  );
}
