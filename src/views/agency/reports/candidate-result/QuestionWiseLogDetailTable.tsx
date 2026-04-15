import { styled } from '@mui/material/styles';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton'

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

const QuestionWiseLogDetailTable = ({ logDetail }: { logDetail: any[] }) => {
  return (
    <TableContainer sx={{ maxHeight: 440 }}>
      <Table stickyHeader size="small" aria-label="Question Wise Time Taken">
          <TableHead>
              <TableRow>
                <StyledTableCell>SR. No.</StyledTableCell>
                <StyledTableCell>NOS Name</StyledTableCell>
                <StyledTableCell>PC Name</StyledTableCell>
                <StyledTableCell>Question</StyledTableCell>
                <StyledTableCell>Correct Answer</StyledTableCell>
                <StyledTableCell>Candidate{"'"}s Response</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
              {logDetail?.map((item: any, index: number) => (
                <StyledTableRow key={index}>
                  <StyledTableCell>{item.sr_no}</StyledTableCell>
                  <StyledTableCell>{item.nos_name}</StyledTableCell>
                  <StyledTableCell>{item.pc_name}</StyledTableCell>
                  <StyledTableCell>{item.question}</StyledTableCell>
                  <StyledTableCell>{item.correct_answer}</StyledTableCell>
                  <StyledTableCell>{item.candidate_response}</StyledTableCell>
                  <StyledTableCell>
                    {item.status === 1 ?
                      <IconButton aria-label='correct' color='success'>
                          <i className="tabler-check" />
                      </IconButton>
                    :
                    item.status === 0 ?
                      <IconButton aria-label='wrong' color='error'>
                          <i className="tabler-x" />
                      </IconButton>
                    : '--'}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
      </Table>
    </TableContainer>
  )
}

export default QuestionWiseLogDetailTable
