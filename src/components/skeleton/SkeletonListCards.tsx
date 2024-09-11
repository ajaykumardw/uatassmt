import React from 'react';

import { Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';

interface CardProps {

  /**
   * The number of skeleton cards.
   *
   * Should be between 1 and 12
   * @default 4
   * @max 12
   */
  totalCards?: number
}

const SkeletonListCards = ( {totalCards = 4}: CardProps) => {

  const maxCards  = 12;
  const cardCounts = Math.min(totalCards, maxCards);

  return (
    <Grid container spacing={6}>
      {Array.from({ length: cardCounts }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent className='flex justify-between gap-3'>
              <div className='flex flex-col gap-1 flex-grow'>
                <Typography color='text.primary'><Skeleton width={80} /></Typography>
                <Typography variant='h4'><Skeleton /></Typography>
                <Typography variant='body2'><Skeleton /></Typography>
              </div>
              <Skeleton width={42} height={70} style={{ transformOrigin: "top" }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default SkeletonListCards;
