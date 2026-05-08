"use client";

import { Box, Paper, Typography } from "@mui/material";

export default function Preview({ template, data }: any) {

  if (!template) return null;

  return (
    <Box>
      <Typography variant="h6" mb={1}>Preview</Typography>

      <Paper
        elevation={3}
        sx={{
          width: template.width,
          height: template.height,
          position: "relative",
          backgroundImage: `url(${template.background})`,
          backgroundSize: "cover",
          overflow: "hidden"
        }}
      >
        {template.elements.map((el: any, i: number) => {

          if (el.type === "text") {
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: el.left,
                  top: el.top,
                  fontSize: el.fontSize
                }}
              >
                {data[el.key] || el.key}
              </div>
            );
          }

          if (el.type === "image") {
            return (
              <img
                key={i}
                src={data.signature || el.src}
                style={{
                  position: "absolute",
                  left: el.left,
                  top: el.top,
                  width: el.width,
                  height: el.height
                }}
              />
            );
          }

          if (el.type === "qr") {
            return (
              <img
                key={i}
                src={data.qrCode}
                style={{
                  position: "absolute",
                  left: el.left,
                  top: el.top,
                  width: el.size,
                  height: el.size
                }}
              />
            );
          }

        })}
      </Paper>
    </Box>
  );
}
