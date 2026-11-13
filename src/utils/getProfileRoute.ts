type ProfileRouteUser = {
  user_type?: string | null
  is_ssc?: boolean | null
  role_id?: string | number | null
  is_student?: boolean | null
}

export const getProfileRoute = (user?: ProfileRouteUser | null) => {
  if (!user || user.is_student) return null
  if (user.is_ssc) return '/ssc-dashboard/profile'
  if (user.user_type === 'SA') return '/super-admin/profile'
  if (user.user_type !== 'U') return '/dashboard/profile'

  switch (Number(user.role_id)) {
    case 1:
      return '/assessor/profile'
    case 2:
      return '/training-partner/profile'
    case 3:
      return '/monitoring-team/profile'
    case 4:
      return '/accounts/profile'
    default:
      return '/dashboard/profile'
  }
}
