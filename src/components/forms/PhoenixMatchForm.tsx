import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function PhoenixMatchForm({ open, onOpenChange, onSuccess }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-muted-foreground">Placeholder: PhoenixMatchForm</p>
      </DialogContent>
    </Dialog>
  );
}
