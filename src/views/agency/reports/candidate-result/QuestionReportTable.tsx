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

const QuestionReportTable = ({ logDetail, type }: { logDetail: any[], type: string }) => {

  if(logDetail?.length === 0) {
    return
  }

  return (
    <TableContainer sx={{ maxHeight: 440 }} className='mb-6 border'>
      <Table stickyHeader size="small" aria-label="Question Wise Time Taken">
          <TableHead>
              <TableRow>
                <TableCell colSpan={type === 'Theory' ? 8 : 6} align='center'>{type}</TableCell>
              </TableRow>
              <TableRow>
                <StyledTableCell>SR. No.</StyledTableCell>
                <StyledTableCell>NOS Name</StyledTableCell>
                <StyledTableCell>PC Name</StyledTableCell>
                {type !== 'Project' &&<StyledTableCell>Question</StyledTableCell>}
                {type === 'Theory' && (
                  <>
                  <StyledTableCell>Correct Answer</StyledTableCell>
                  <StyledTableCell>Candidate{"'"}s Response</StyledTableCell>
                  </>
                )}
                <StyledTableCell>Maximum Marks</StyledTableCell>
                <StyledTableCell>Obtained Marks</StyledTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
              {logDetail?.map((item: any, index: number) => (
                <StyledTableRow key={index}>
                  <StyledTableCell>{item.sr_no}</StyledTableCell>
                  <StyledTableCell>{item.nos_name}</StyledTableCell>
                  <StyledTableCell>{item.pc_name}</StyledTableCell>
                  {type !== 'Project' &&<StyledTableCell>{item.question}</StyledTableCell>}
                  {type === 'Theory' && (
                    <>
                      <StyledTableCell>{item.correct_answer}</StyledTableCell>
                      <StyledTableCell>{item.candidate_response}</StyledTableCell>
                    </>
                  )}
                  <StyledTableCell>
                    {item.max_marks}
                  </StyledTableCell>
                  <StyledTableCell>
                    {item.obtained_marks}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
      </Table>
    </TableContainer>
  )
}

export default QuestionReportTable
