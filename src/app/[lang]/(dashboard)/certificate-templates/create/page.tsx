"use client";

import { useState } from "react";

import { Box } from "@mui/material";

import FabricCanvas from "./FabricCanvas";
import Toolbar from "./Toolbar";

export default function Page() {
  const [canvas, setCanvas] = useState<any>(null);
  const [fabric, setFabric] = useState<any>(null);

  return (
    <Box className="flex gap-4">

      {canvas && fabric && (
        <Toolbar canvas={canvas} fabric={fabric} />
      )}

      {/* <Box sx={{ flex: 1, p: 2 }}> */}
        <FabricCanvas
          onReady={(c: any, f: any) => {
            setCanvas(c);
            setFabric(f);
          }}
        />
      {/* </Box> */}

    </Box>
  );
}
