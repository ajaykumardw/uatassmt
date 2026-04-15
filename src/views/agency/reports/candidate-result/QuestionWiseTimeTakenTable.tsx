import { styled } from '@mui/material/styles';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },

  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const QuestionWiseTimeTakenTable = ({ logDetail }: { logDetail: any[] }) => {
  return (
    <TableContainer sx={{ maxHeight: 440 }}>
      <Table stickyHeader size="small" aria-label="Question Wise Time Taken">
          <TableHead>
              <TableRow>
                <StyledTableCell>SR. No.</StyledTableCell>
                <StyledTableCell>NOS Name</StyledTableCell>
                <StyledTableCell>PC Name</StyledTableCell>
                <StyledTableCell>Question</StyledTableCell>
                <StyledTableCell>Question open time (in hh:mm:ss)</StyledTableCell>
                <StyledTableCell>Answer Submitted Time (in hh:mm:ss)</StyledTableCell>
                <StyledTableCell>Duration</StyledTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
              {logDetail?.map((item: any, index: number) => (
                <StyledTableRow key={index}>
                  <StyledTableCell>{item.sr_no}</StyledTableCell>
                  <StyledTableCell>{item.nos_name}</StyledTableCell>
                  <StyledTableCell>{item.pc_name}</StyledTableCell>
                  <StyledTableCell>{item.question}</StyledTableCell>
                  <StyledTableCell>{item.open_time}</StyledTableCell>
                  <StyledTableCell>{item.submit_time}</StyledTableCell>
                  <StyledTableCell>{item.duration}</StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
      </Table>
    </TableContainer>
  )
}

export default QuestionWiseTimeTakenTable
