import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function EntrainementInterneForm({ open, onOpenChange, onSuccess }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-muted-foreground">Placeholder: EntrainementInterneForm</p>
      </DialogContent>
    </Dialog>
  );
}
