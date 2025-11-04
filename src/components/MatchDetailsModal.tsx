import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function MatchDetailsModal({ open, onOpenChange, match, matchType }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-muted-foreground">Placeholder: MatchDetailsModal</p>
      </DialogContent>
    </Dialog>
  );
}
