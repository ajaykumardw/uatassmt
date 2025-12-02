"use client";

import { useEffect, useState } from "react";

import Dialog from '@mui/material/Dialog';
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Card, CardContent, CardMedia, MenuItem, Pagination, Skeleton, Typography } from "@mui/material";

import { format } from "date-fns";

import DialogCloseButton from "../dialogs/DialogCloseButton";
import CustomTextField from "@/@core/components/mui/TextField";
import { TableRowLimit, MenuProps } from "@/configs/customDataConfig";

const CapturedImageDialog = ({
  open,
  onClose,
  batchId,
  studentId
}: {
  open: boolean,
  onClose: () => void,
  batchId: number | null,
  studentId: number | null
}) => {

  const [loading, setLoading] = useState(false);
  const [imagesData, setImagesData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(TableRowLimit.rowLimit[0] || 10); // You can change if needed


  const fetchImages = async (batchId: number, studentId: number) => {
    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/student-capture-image?batch=${batchId}&student=${studentId}&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: "no-store"
      }
    );

    const data = await res.json();

    if (res.ok) {
      setImagesData(data.capturedImages);
      setPagination(data.pagination);
    }

    setLoading(false);
  };

  // Reset page to 1 whenever dialog opens
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open]);

  useEffect(() => {
    if (open && batchId && studentId) {
      fetchImages(batchId, studentId);
    }
  }, [open, page]);

  const handleClose = () => {
    onClose();
    setImagesData([]);
  };

  const handlePaginationChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const CapturedImageCard = ({ image }: { image: any }) => {
    const [loaded, setLoaded] = useState(false);

    return (
      <Card variant="outlined">

        <div style={{ position: "relative", width: "100%", height: 200 }}>
          {/* Skeleton Loader */}
          {!loaded && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  borderRadius: 1
                }}
              />
            )}

          {/* Image */}
          <CardMedia
            component="img"
            loading="lazy"
            alt={`Captured Image ${image.id}`}
            image={image.captured_image_url}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;

              target.src = "/images/icons/image-not-found.png"; // fallback
              setLoaded(true);
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transition: "filter 0.4s ease, opacity 0.4s ease",
              filter: loaded ? "blur(0px)" : "blur(10px)",
              opacity: loaded ? 1 : 0.6,
            }}
          />
        </div>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            {format(image.captured_time, "dd MMM yyyy, hh:mm:ss a")}
          </Typography>
        </CardContent>
      </Card>
    );
  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle>Captured Images</DialogTitle>

      <DialogContent>
        <Grid container spacing={4}>
          {loading ? (
            Array.from({length: 8}).map((_, index) => (
              <Grid key={index} item xs={12} sm={6} md={4} lg={3}>
                <Card variant="outlined">
                  <Skeleton variant="rectangular" width="100%" height={200} />
                  <CardContent>
                    <Typography variant="body1">
                      <Skeleton width="80%" />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : imagesData?.length === 0 ? (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body1">No captured images found.</Typography>
                </CardContent>
              </Card>
            </Grid>
          ) :
          imagesData?.map((image) => (
            <Grid key={image.id} item xs={12} sm={6} md={4} lg={3}>
              <CapturedImageCard image={image} />
            </Grid>
          ))}
        </Grid>
      </DialogContent>


      <DialogActions className="flex-wrap gap-4">
        {imagesData?.length > 0 && !loading && (<div className="flex flex-1 items-center flex-wrap gap-4">
          <CustomTextField
            select
            value={pagination?.limit || limit}
            onChange={e => setLimit(Number(e.target.value))}
            className='is-[70px]'
            SelectProps={{ MenuProps }}
          >
            {TableRowLimit && TableRowLimit.rowLimit.length > 0 && TableRowLimit.rowLimit.map((limit, index) => (
              <MenuItem key={index} value={limit}>{limit}</MenuItem>
            ))}
          </CustomTextField>
          <Pagination
            variant="tonal"
            color="primary"
            shape="rounded"
            count={pagination?.totalPages}
            page={page}
            onChange={handlePaginationChange}
            sx={{ display: 'flex', justifyContent: 'center', py: 2 }}
          />
        </div>)}
        <Button onClick={handleClose} variant="tonal" disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CapturedImageDialog;
