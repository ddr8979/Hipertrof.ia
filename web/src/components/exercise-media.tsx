"use client";

import { useState } from "react";
import { exerciseGif, exerciseLocalWebm, cn } from "@/lib/utils";

export function ExerciseMedia({
  url,
  alt,
  className,
  imgClassName,
  videoClassName,
  eager,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  videoClassName?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const local = !failed ? exerciseLocalWebm(url) : null;
  const remote = !failed || !local ? exerciseGif(url) : null;
  const [videoOk, setVideoOk] = useState(false);

  if (local && !failed) {
    return (
      <video
        src={local}
        autoPlay
        muted
        loop
        playsInline
        preload={eager ? "auto" : "metadata"}
        onCanPlay={() => setVideoOk(true)}
        onError={() => setFailed(true)}
        className={cn(
          "size-full object-contain transition-opacity duration-300",
          videoOk ? "opacity-100" : "opacity-0",
          videoClassName
        )}
      />
    );
  }

  if (remote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={remote}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("size-full object-contain", imgClassName)}
      />
    );
  }

  return null;
}