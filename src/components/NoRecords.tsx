import Link from 'next/link';

import { Button, Card, CardContent } from "@mui/material";

const NoRecords = ({url}: {url?: string}) => {
  return (
    <Card>
      <CardContent>
        <div className="w-full h-[400px] flex flex-col justify-center items-center text-gray-500 text-lg">
          No Records Available
          {url && (
            <Button variant="contained" component={Link} color="primary" href={url} sx={{ mt: 2 }}>
              Create
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default NoRecords;
