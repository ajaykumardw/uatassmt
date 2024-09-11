import React from 'react';

import { Card, CardContent, CardHeader, Grid, Skeleton } from '@mui/material'; // or use any skeleton library of your choice

import tableStyles from '@core/styles/table.module.css'

const SkeletonTable = () => {
  return (
    <Card>
      <CardHeader title={<Skeleton width={100} height={36} />} className='pbe-4' />
      <CardContent>
        <Grid container spacing={6}>
          {/* Skeleton for the first select field */}
          <Grid item xs={12} sm={4}>
            <Skeleton variant='text' width='100%' height={56} />
          </Grid>

          {/* Skeleton for the second select field */}
          <Grid item xs={12} sm={4}>
            <Skeleton variant='text' width='100%' height={56} />
          </Grid>

          {/* Skeleton for the third select field */}
          <Grid item xs={12} sm={4}>
            <Skeleton variant='text' width='100%' height={56} />
          </Grid>
        </Grid>
      </CardContent>
      <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
        <Skeleton variant='text' width={70} height={40} className='is-[70px]' />
        <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
          <Skeleton variant='text' className='is-full sm:is-auto min-w-48' width='100%' height={40} />
          <Skeleton variant='text' className='is-full sm:is-auto min-w-28' width='100%' height={40} />
          <Skeleton variant='text' className='is-full sm:is-auto min-w-40' width='100%' height={40} />
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              {[...Array(6)].map((_, index) => (
                <th key={index}>
                  <Skeleton variant='text' width={100} height={20} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(7)].map((_, index) => (
              <tr key={index}>
                {[...Array(6)].map((_, cellIndex) => (
                  <td key={cellIndex}>
                    <Skeleton variant='text' width={100} height={20} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between p-6 border-bs gap-4'>
        <Skeleton variant='text' width={120} height={40} />
        {/* <Skeleton variant='text' width={120} height={40} /> */}
        <Skeleton variant='text' width={120} height={40} />
      </div>
    </Card>
  );
}

export default SkeletonTable;
