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
  const [loadingDocs, setLoadingDocs] = useState<string[]>([]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleDownloadAssessmentKit = async (batchId: number, doc: string = "") => {

    const key = doc || "attendance";

    setLoadingDocs(prev => [...prev, key]);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor/batches/${batchId}/assessment-kit${doc ? `?doc=${doc}` : ""}`, {
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

      setLoadingDocs(prev => prev.filter(d => d !== key));
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
      <Menu keepMounted id='basic-menu' anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)} PaperProps={{ style: { maxHeight: 420 } }}>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId)} disabled={loadingDocs.includes("attendance")}>
          <ListItemIcon>
            {loadingDocs.includes("attendance") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Attendance Sheet
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "annexure-m1")} disabled={loadingDocs.includes("annexure-m1")}>
          <ListItemIcon>
            {loadingDocs.includes("annexure-m1") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Annexure M1
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "annexure-m2")} disabled={loadingDocs.includes("annexure-m2")}>
          <ListItemIcon>
            {loadingDocs.includes("annexure-m2") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Annexure M2
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "annexure-n")} disabled={loadingDocs.includes("annexure-n")}>
          <ListItemIcon>
            {loadingDocs.includes("annexure-n") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Annexure N (Candidate Feedback Form)
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "tp-feedback")} disabled={loadingDocs.includes("tp-feedback")}>
          <ListItemIcon>
            {loadingDocs.includes("tp-feedback") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Feedback Form (Training Provider)
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "assessor-feedback")} disabled={loadingDocs.includes("assessor-feedback")}>
          <ListItemIcon>
            {loadingDocs.includes("assessor-feedback") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Assessor Feedback Form
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "tc-declaration")} disabled={loadingDocs.includes("tc-declaration")}>
          <ListItemIcon>
            {loadingDocs.includes("tc-declaration") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            TC Declaration
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "undertaking")} disabled={loadingDocs.includes("undertaking")}>
          <ListItemIcon>
            {loadingDocs.includes("undertaking") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Undertaking Form
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadAssessmentKit(batchId, "apaar-declaration")} disabled={loadingDocs.includes("apaar-declaration")}>
          <ListItemIcon>
            {loadingDocs.includes("apaar-declaration") ?
              <CircularProgress size={20} />
              :
              <i className="tabler-download text-primary"/>
            }
          </ListItemIcon>
          <ListItemText>
            Declaration for APAAR ID
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
