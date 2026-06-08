"use client";

import { useState } from "react";
import { Photo } from "@/lib/rh/theme";

/**
 * TourVideo — autoplaying 3D walkthrough player for the home hero.
 *
 * Drop your Higgsfield export at `public/tour.mp4`, OR set
 * NEXT_PUBLIC_TOUR_VIDEO_URL to a hosted URL. Until a playable source exists,
 * it falls back to the warm placeholder so the hero never looks broken.
 *
 * Autoplay requires muted + playsInline (browser policy), so the walkthrough
 * starts silently and loops on every visit.
 */
const TOUR_SRC = process.env.NEXT_PUBLIC_TOUR_VIDEO_URL || "/tour.mp4";

export function TourVideo({ poster }: { poster?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Photo from="#caa878" to="#7a5c38" tag={false} />;
  return (
    <video
      src={TOUR_SRC}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
