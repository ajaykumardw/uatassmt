"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box
} from "@mui/material";

import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import { useSession } from "next-auth/react";

import { toast } from "react-toastify";

interface Template {
  id: number;
  name: string;
  html?: string;
  is_active: boolean;
  created_at: string;
  config: any;
}

export default function TemplateListing() {

  const [templates, setTemplates] =
    useState<Template[]>([]);

  const [agencyData, setAgencyData] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [previewHtml, setPreviewHtml] =
    useState("");

  const [templateSize, setTemplateSize] =
    useState({ width: 1123, height: 794 });

  const [openPreview, setOpenPreview] =
    useState(false);

  const {data: session} = useSession();

  console.log("Session:", session?.user);

  // ================= FETCH =================
  const fetchTemplates = async () => {
    try {

      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/certificate/templates`
      );

      const data = await res.json();

      if (data.success) {
        setTemplates(data.data || []);
        setAgencyData(data.agency || null);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleActivateTemplate = async (templateId: number) => {
    try {

      if (templates.find(t => t.id === templateId)?.is_active) {
        return;
      }

      // setLoading(true);

      setTemplates((prev) =>
        prev.map((template) => ({
          ...template,
          is_active: template.id === templateId
        }))
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/certificate/templates/${templateId}`,
        {
          method: "PATCH"
        }
      );

      const data = await res.json();

      if (!data.success) {

        // rollback if failed
        fetchTemplates();

        toast.error(data.message || "Failed to activate template");

        console.error("Activation failed:", data.message);
      } else {
        toast.success(data.message || "Template activated");
      }

    } catch (error) {
      console.error("Activation error:", error);

    } finally {

      // setLoading(false);
    }
  };

  // ================= PREVIEW =================
  const handlePreview = (template: any) => {

    // 🔥 simple preview html generate
    let html = template.html || "";

    // fake values for preview
    const replacements: Record<string, string> = {
      candidate_name: "<strong>Candidate Name</strong>",
      father_name: "<strong>S/o Father Name</strong>",
      qp_name: "<strong>Call Center Executive (AWF) (TEL/Q0100_1)</strong>",
      qp_level: "<strong>5</strong>",
      scheme: "<strong>PMKVY</strong>",
      tp_name: "<strong>ABC Training Center</strong>",
      agency_name: `<strong>${agencyData?.agency_name || "NSDC Agency"}</strong>`,
      date: new Date().toLocaleDateString(),
      head_name: `<strong>${agencyData?.head_name || "Director"}</strong>`,
      agency_logo: agencyData?.agency_logo || "",
      agency_stamp: agencyData?.agency_stamp || "",
      qr_code: "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=certificate",
      certificate_no: `CERT-003030`,
      issue_date: "09/05/2026",
      system_identification_no: `NON-PMKVY/2026-27/UP2019CR26944/DEMOAWF01/CAN_2663`,
          
    };

    Object.entries(replacements).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, `${value}`);
    });

    setPreviewHtml(html);
    setTemplateSize({
      width: template.config?.width || 1123,
      height: template.config?.height || 794
    });
    setOpenPreview(true);
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <Box
        className='flex items-center justify-center'
        sx={{ minHeight: 300 }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>

      <Grid container spacing={4}>

        {templates.map((template) => (

          <Grid item xs={12} sm={6} md={4} key={template.id}>

            <Card
              sx={{
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >

              {/* ================= MINI PREVIEW ================= */}
              <Box
                className="border-b"
                sx={{
                  height: 220,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <iframe
                  srcDoc={template.html}
                  className={template.config?.background ? '' : 'outline outline-1'}
                  style={{
                    width: `${template.config?.width || templateSize.width}px`,
                    height: `${template.config?.height || templateSize.height}px`,
                    border: "none",
                    overflow: "hidden",
                    transform: "scale(0.25)",
                    transformOrigin: "center center",
                    pointerEvents: "none",
                    flexShrink: 0,
                  }}
                />

              </Box>

              {/* ================= CONTENT ================= */}
              <CardContent
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}
              >

                <div className='flex items-start justify-between gap-2'>

                  <Typography
                    variant='h6'
                    sx={{ fontWeight: 700 }}
                  >
                    {template.name}
                  </Typography>

                  <FormControlLabel control={<Switch size='small' checked={template.is_active} onClick={() => { handleActivateTemplate(template.id); }} color={ template.is_active ? "success" : "default" } />} label={ template.is_active ? "Active" : "Inactive" } />

                </div>

                <Typography
                  variant='body2'
                  color='text.secondary'
                >
                  Created:
                  {" "}
                  {new Date(
                    template.created_at
                  ).toLocaleString()}
                </Typography>

                <div className='flex gap-2 mt-auto'>

                  <Button
                    fullWidth
                    variant='contained'
                    onClick={() =>
                      handlePreview(template)
                    }
                  >
                    Preview
                  </Button>

                  <Button
                    fullWidth
                    variant='outlined'
                  >
                    Edit
                  </Button>

                </div>

              </CardContent>

            </Card>

          </Grid>

        ))}

      </Grid>

      {/* ================= FULL PREVIEW ================= */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth='xl'
        fullWidth
      >

        <DialogTitle>
          Certificate Preview
        </DialogTitle>

        <DialogContent>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              borderRadius: 2
            }}
          >

            <iframe
              srcDoc={previewHtml}
              style={{
                width: `${templateSize.width}px`,
                height: `${templateSize.height}px`,
                border: "none",
                background: "white"
              }}
            />

          </Box>

        </DialogContent>

      </Dialog>

    </>
  );
}
