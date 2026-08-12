"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { Box, CircularProgress, Typography } from "@mui/material";

import FabricCanvas from "../../create/FabricCanvas";
import Toolbar from "../../create/Toolbar";

export default function EditTemplatePage() {
  const { templateId, lang } = useParams();

  const router = useRouter();

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canvas, setCanvas] = useState<any>(null);
  const [fabric, setFabric] = useState<any>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/certificate/templates/${templateId}`
        );

        const data = await res.json();

        if (data.success) {
          setTemplate(data.data);
        } else {
          setError(data.message || "Failed to load template");
        }
      } catch (e) {
        console.error("Error loading template:", e);
        setError("An error occurred while loading the template.");
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  if (loading) {
    return (
      <Box className='flex items-center justify-center' sx={{ minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className='flex items-center justify-center' sx={{ minHeight: 300 }}>
        <Typography color='error'>{error}</Typography>
      </Box>
    );
  }

  const config = template?.config || {};

  return (
    <Box className="flex gap-4">
      {canvas && fabric && (
        <Toolbar
          canvas={canvas}
          fabric={fabric}
          mode="edit"
          templateId={templateId}
          initialConfig={config}
          initialName={template?.name}
          onSaved={() => {
            router.push(`/${lang}/certificate-templates`);
          }}
        />
      )}

      <FabricCanvas
        width={config.width || 1123}
        height={config.height || 794}
        onReady={(c: any, f: any) => {
          setCanvas(c);
          setFabric(f);
        }}
      />
    </Box>
  );
}