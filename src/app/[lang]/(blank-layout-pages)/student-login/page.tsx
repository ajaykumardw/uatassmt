// Next Imports
import type { Metadata } from 'next'

// Component Imports
import StudentLogin from '@/views/StudentLogin'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Student Login',
  description: 'Login to your account'
}

const StudentLoginPage = () => {
  // Vars
  const mode = getServerMode()

  return <StudentLogin mode={mode} />
}

export default StudentLoginPage
