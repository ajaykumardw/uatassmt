// Component Imports
import type { batches } from '@prisma/client'

import BatchesList from '@/views/batches/list'

// import UserList from '@views/apps/user/list'

// const getData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/users`)

//   if (!res.ok) {
//     throw new Error('Failed to fetch userData')
//   }

//   return res.json()
// }

const UserListApp = async () => {

  // Vars
  // const data = await getData()
  
  const data: batches[] = [];

  return <BatchesList tableData={data} />
}

export default UserListApp
