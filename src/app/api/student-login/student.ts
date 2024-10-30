// ** Fake user data and data type

// ** Please remove below user data and data type in production and verify user with Real Database
export type StudentTable = {
  id: number

  // name: string

  candidate_id: string

  // image: string

  password: string
}

// =============== Fake Data ============================

export const users: StudentTable[] = [
  {
    id: 1,

    // name: 'John Doe',

    password: 'admin',
    candidate_id: 'admin@vuexy.com',

    // image: '/images/avatars/1.png'
  }
]
