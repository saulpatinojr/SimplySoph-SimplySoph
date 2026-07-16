import { useEffect } from "react";

/**
 * Removes browser convenience actions for images displayed by the public site.
 * This is a deterrent, not DRM: a visitor can always capture media the browser
 * is allowed to render.
 */
export default function ImageProtection() {
  useEffect(() => {
    const isImage = (target: EventTarget | null) => target instanceof HTMLImageElement;
    const preventImageMenu = (event: MouseEvent) => {
      if (isImage(event.target)) event.preventDefault();
    };
    const preventImageDrag = (event: DragEvent) => {
      if (isImage(event.target)) event.preventDefault();
    };
    document.addEventListener("contextmenu", preventImageMenu);
    document.addEventListener("dragstart", preventImageDrag);
    return () => {
      document.removeEventListener("contextmenu", preventImageMenu);
      document.removeEventListener("dragstart", preventImageDrag);
    };
  }, []);
  return null;
}
