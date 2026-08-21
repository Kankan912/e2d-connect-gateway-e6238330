ALTER TABLE public.notifications_campagnes
ADD COLUMN IF NOT EXISTS reunion_id uuid REFERENCES public.reunions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_campagnes_reunion_id ON public.notifications_campagnes(reunion_id);