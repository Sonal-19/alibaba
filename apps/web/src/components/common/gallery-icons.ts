import { Drum, Flame, Landmark, Mic2, Piano, Users } from "lucide-react";

/** Icons the admin can pick for each gallery photo (Settings → Mehfil moments). */
export const GALLERY_ICONS = {
  mic: Mic2,
  harmonium: Piano,
  tabla: Drum,
  dargah: Landmark,
  crowd: Users,
  diya: Flame,
} as const;
