> Okay, so I can tell it's trying to pan & zoom on the coordinate now, but it's basically restarting the rendering over and over and over 
  as if stuck in a glitchy loop.  On top of that, in the editor when I delete a hotspot, save, and reload, the deleted one is still there 
  so now there's some type of saving issue as well.

● I can see there are two separate issues now:

  1. Pan & zoom getting stuck in a rendering loop - This suggests the coordinate fix is working but there's now an infinite re-render cycle
  2. Hotspot deletion not persisting - This indicates a Firebase save/delete operation issue