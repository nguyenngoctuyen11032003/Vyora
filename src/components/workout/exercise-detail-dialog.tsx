"use client";

import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import { ExerciseDetailContent } from "@/src/components/workout/exercise-detail-content";
import { useMediaQuery } from "@/src/hooks/use-media-query";
import type { Exercise } from "@/src/types/workout";

interface ExerciseDetailDialogProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseDetailDialog({ exercise, open, onOpenChange }: ExerciseDetailDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)", false);

  if (!exercise) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-48px)] max-w-5xl gap-0 overflow-hidden rounded-[28px] border-glass-border bg-[#11162a]/95 p-0 text-fg shadow-[0_40px_120px_-20px_rgb(0_0_0/0.75)] backdrop-blur-xl sm:rounded-[28px]" data-testid="exercise-dialog">
          <ExerciseDetailContent exercise={exercise} onClose={() => onOpenChange(false)} variant="dialog" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="h-[94dvh] border-glass-border bg-[#11162a] text-fg" data-testid="exercise-drawer">
        <ExerciseDetailContent exercise={exercise} onClose={() => onOpenChange(false)} variant="drawer" />
      </DrawerContent>
    </Drawer>
  );
}
