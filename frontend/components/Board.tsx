"use client";
// @ts-nocheck

import React, { useEffect, useRef } from "react";
import { Chessground } from "chessground";
import { Config } from "chessground/config";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

interface BoardProps {
  fen: string;
  orientation?: "white" | "black";
  turnColor?: "white" | "black";
  check?: boolean | "white" | "black";
  lastMove?: string[];
  movable?: {
    color?: "white" | "black" | "both";
    dests?: Map<string, string[]>;
  };
  onMove?: (orig: string, dest: string) => void;
  viewOnly?: boolean;
}

export default function Board({ 
    fen, 
    orientation = "white", 
    turnColor,
    check,
    lastMove,
    movable,
    onMove,
    viewOnly = false
}: BoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof Chessground> | null>(null);

  useEffect(() => {
    if (ref.current && !api.current) {
      // Initialize
      const config: Config = {
        fen: fen,
        orientation: orientation,
        turnColor: turnColor,
        check: check,
        lastMove: lastMove as any,
        viewOnly: viewOnly,
        coordinates: true,
        animation: { enabled: true, duration: 200 },
        movable: {
            color: movable?.color || "white",
            free: false,
            dests: movable?.dests as any,
            showDests: true, // Show dots for valid moves
            events: {
                after: (orig, dest) => onMove && onMove(orig, dest),
            },
        },
      };
      api.current = Chessground(ref.current, config);
    } else if (api.current) {
      // Update
      api.current.set({
        fen: fen,
        turnColor: turnColor,
        check: check,
        lastMove: lastMove as any,
        viewOnly: viewOnly,
        movable: {
            color: movable?.color || "white",
            dests: movable?.dests as any,
            events: {
                after: (orig, dest) => onMove && onMove(orig, dest),
            },
        }
      });
    }
  }, [fen, movable, onMove, viewOnly, orientation, turnColor, check, lastMove]);

  useEffect(() => {
    const handleResize = () => {
        if (api.current) {
            api.current.redrawAll();
        }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div 
        ref={ref} 
        style={{ width: "100%", height: "100%" }} 
        className="cg-board-wrap blue merida" 
    />
  );
}