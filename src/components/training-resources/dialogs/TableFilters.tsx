// // React Imports
// import { useState, useEffect } from 'react'

// // MUI Imports
// import CardContent from '@mui/material/CardContent'
// import Grid from '@mui/material/Grid'
// import MenuItem from '@mui/material/MenuItem'

// // Type Imports
// import type { role, users } from '@prisma/client'

// // import type { UsersType } from '@/types/apps/userTypes'

// // Component Imports
// import CustomTextField from '@core/components/mui/TextField'
// import { MenuProps } from '@/configs/customDataConfig'

// const TableFilters = ({ setData, tableData }: { setData: any, tableData?: users[] }) => {
//   // States
//   const [role, setRole] = useState<users['role_id']>(-1)
//   const [rolesData, setRoles] = useState<role[]>([])

//   // const [plan, setPlan] = useState<UsersType['currentPlan']>('')

//   const [status, setStatus] = useState<users['status']>(-1)


//   const getRoles = async () => {
//     // Vars
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`)

//     if (!res.ok) {
//       throw new Error('Failed to fetch roles')
//     }

//     const rolesData = await res.json();

//     setRoles(rolesData);
//   }

//   useEffect(() => {
//     getRoles();
//   }, [])

//   useEffect(() => {
//     const filteredData = tableData?.filter(user => {
//       if (role !== -1 && user.role_id !== role) return false

//       // if (plan && user.currentPlan !== plan) return false
//       // if (status && user.status !== status) return false

//       if (status !== -1 && user.status !== status) return false;

//       return true
//     })

//     setData(filteredData)
//   }, [role, status, tableData, setData])

//   return (
//     <CardContent>
//       <Grid container spacing={6}>
//         <Grid item xs={12} sm={4}>
//           <CustomTextField
//             select
//             fullWidth
//             id='select-role'
//             value={role}
//             onChange={e => setRole(parseInt(e.target.value))}
//             SelectProps={{ MenuProps, displayEmpty: true }}
//           >
//             <MenuItem value='-1'>Select Role</MenuItem>
//             {rolesData.map((role, index) => (
//               <MenuItem key={index} value={role.id.toString()}>{role.name}</MenuItem>
//             ))}
//           </CustomTextField>
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <CustomTextField
//             select
//             fullWidth
//             id='select-status'
//             value={status}
//             onChange={e => setStatus(parseInt(e.target.value))}
//             SelectProps={{ MenuProps, displayEmpty: true }}
//           >
//             <MenuItem value='-1'>Select Status</MenuItem>
//             <MenuItem value='1'>Active</MenuItem>
//             <MenuItem value='0'>Inactive</MenuItem>
//           </CustomTextField>
//         </Grid>
//       </Grid>
//     </CardContent>
//   )
// }

// export default TableFilters


'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'

// Types
import type { role } from '@prisma/client'

// Components
import CustomTextField from '@core/components/mui/TextField'

import { MenuProps } from '@/configs/customDataConfig'

type FiltersType = {
  role: number[]
}

const TableFilters = ({ setFilters }: { setFilters: (filters: FiltersType) => void }) => {

  const [role, setRole] = useState<number[]>([])
  const [rolesData, setRoles] = useState<role[]>([])

  const getRoles = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`)
    const data = await res.json()

    setRoles(data)
  }

  useEffect(() => {
    getRoles()
  }, [])

  useEffect(() => {
    setFilters({ role })
  }, [role, setFilters])

  return (
    <Grid item xs={12} sm={6}>
      <CustomTextField
        select
        fullWidth
        value={role}
        onChange={e => {
          const value = e.target.value as unknown as string[]

          if (value.includes('all')) {
            setRole([])

            return
          }

          setRole(value.map(Number))
        }}
        SelectProps={{
          multiple: true,
          MenuProps,
          displayEmpty: true,
          renderValue: selected => {
            const selectedIds = selected as number[]

            if (selectedIds.length === 0) return 'All Roles'

            return rolesData
              .filter(r => selectedIds.includes(r.id))
              .map(r => r.name)
              .join(', ')
          }
        }}
        label="Filter by Role"
      >
        {rolesData.map(r => (
          <MenuItem key={r.id} value={r.id}>
            <Checkbox checked={role.includes(r.id)} />
            <ListItemText primary={r.name} />
          </MenuItem>
        ))}
      </CustomTextField>
    </Grid>
  )
}

export default TableFilters
