"use client";
import React, { useState } from "react";

interface TextRevealProps {
  word?: string;
}

export function TextReveal({ word }: TextRevealProps) {
  const [reset, setReset] = useState(0);
  const WORD = word || "Animations";

  return (
    <div>
      <div key={reset}>
        <h1 className="text-reveal-h1">
          {WORD.split("").map((char, i) => (
            <span
              style={{ "--index": i } as React.CSSProperties}
              key={i}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>
      </div>
      <button className="text-reveal-button" onClick={() => setReset(reset + 1)}>
        Replay animation
      </button>
    </div>
  );
}
