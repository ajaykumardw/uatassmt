// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import type { exam_instructions } from '@prisma/client'

import ExamInstructionsListTable from './ExamInstructionsListTable'

// import UserListCards from './UserListCards'

const ExamInstructionsList = ({ examInstructionData, updateExamInstructionsList }: { examInstructionData?: exam_instructions[], updateExamInstructionsList: () => void }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <ExamInstructionsListTable tableData={examInstructionData} updateExamInstructionsList={updateExamInstructionsList} />
      </Grid>
    </Grid>
  )
}

export default ExamInstructionsList
