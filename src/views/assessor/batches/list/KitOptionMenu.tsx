// React Imports
import { useState } from 'react'
import type { MouseEvent } from 'react'

import { toast } from 'react-toastify'

// MUI Imports
import Menu from '@mui/material/Menu'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'

import { authFetch } from '@/components/AuthFetch'

const KitOptionMenu = ({ batchId, questionPaper, omrSheet }: { batchId: number; questionPaper: string | null; omrSheet: string | null }) => {
  // States
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [loading, setLoading] = useState(false);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleDownloadAssessmentKit = async (batchId: number) => {

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor/batches/${batchId}/assessment-kit`, {
        method: 'GET',
      });

      if(res.ok) {
        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        const name = res.headers.get('Content-Disposition')?.split('filename=')[1] || `assessment_kit_batch_${batchId}.zip`;

        link.setAttribute('download', name); //or any other extension
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);

      } else {

        const errorData = await res.json();

        toast.error(errorData.message || "Failed to download assessment kit");

        console.error("Error downloading assessment kit:", errorData);
      }


    } catch (error) {

      console.error("Error downloading assessment kit:", error);

      toast.error("Failed to download assessment kit");

    } finally {

      setLoading(false);
    }

  }

  const handleDirectDownload = (filePath: string) => {
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${filePath}`

    handleClose()

    setTimeout(() => {
      const link = document.createElement('a')

      link.href = fileUrl
      link.setAttribute('download', '')

      document.body.appendChild(link)

      link.click()

      link.remove()
    }, 100)
  }

  return (
    <>
      <Button variant='outlined' aria-controls='basic-menu' aria-haspopup='true' onClick={handleClick} size="small">
        Assessment Kit
      </Button>
      <Menu keepMounted id='basic-menu' anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)}>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId)} disabled={loading}>
          <ListItemIcon>
            {loading ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Attendance Sheet
          </ListItemText>
        </MenuItem>
        {questionPaper && <MenuItem onClick={() => handleDirectDownload(questionPaper)}>
          <ListItemIcon>
            <i className="tabler-download text-primary"/>
          </ListItemIcon>
          <ListItemText>
            Question Paper
          </ListItemText>
        </MenuItem>}
        {omrSheet && <MenuItem onClick={() => handleDirectDownload(omrSheet)}>
          <ListItemIcon>
            <i className="tabler-download text-primary"/>
          </ListItemIcon>
          <ListItemText>
            OMR Sheet
          </ListItemText>
        </MenuItem>}
      </Menu>
    </>
  )
}

export default KitOptionMenu
