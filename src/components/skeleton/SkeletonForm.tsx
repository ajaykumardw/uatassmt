import { Grid, Card, CardHeader, Skeleton, Divider, CardContent, Typography } from "@mui/material"

const SkeletonForm = () => {
  return (
    <Grid item xs={12}>
      <Card>
        <CardHeader title={(<Skeleton variant="text" width={190} height={28} animation="pulse" />)} />
        <Divider />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Typography variant='body2' className='font-medium'>
                <Skeleton width={150} animation="pulse" />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body2' className='font-medium'>
                <Skeleton width={150} animation="pulse" />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="text" width={190} height={24} animation="pulse" />
              <Skeleton variant="text" height={40} animation="pulse" />
            </Grid>
            <Grid item xs={12} className='flex gap-4'>
              <Skeleton variant="rounded" width={90} height={38} animation="pulse" />
              <Skeleton variant="rounded" width={80} height={38} animation="pulse" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default SkeletonForm
