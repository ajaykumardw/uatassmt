"use client";

import { useEffect, useRef } from "react";

import Card from "@mui/material/Card";

export default function FabricCanvas({ onReady }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let canvas: any;

    const init = async () => {
      const fabric = await import("fabric");

      const { Canvas } = fabric;

      canvas = new Canvas(canvasRef.current!, {
        preserveObjectStacking: true
      });

      // grid snap
      const grid = 10;

      canvas.on("object:moving", (e: any) => {
        e.target.set({
          left: Math.round(e.target.left / grid) * grid,
          top: Math.round(e.target.top / grid) * grid
        });
      });

      onReady(canvas, fabric);
    };

    init();

    return () => canvas?.dispose();
  }, []);

  return (
    <Card className="inline-block h-full">
      <canvas
        ref={canvasRef}
        width={1123}
        height={794}
      />
    </Card>
  );
}
