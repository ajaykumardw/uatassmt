import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'
import { agencyImagePath, agencyUsersFilePath, sscImagePath } from '@/configs/customDataConfig'

import MyProfile, { type ProfileData } from './MyProfile'

const roleLabels: Record<number, string> = {
  1: 'Assessor',
  2: 'Training Partner',
  3: 'Monitoring Team',
  4: 'Accounts'
}

const getUserRoleLabel = (user: { user_type: string; role_id: number | null; role?: { name: string } | null }) => {
  if (user.user_type === 'SA') return 'Super Admin'
  if (user.user_type === 'AG') return 'Agency'
  if (user.user_type === 'TC') return 'Training Center'

  return (user.role_id ? roleLabels[user.role_id] : null) || user.role?.name || 'Portal User'
}

const getStatusLabel = (status: number | null) => (Number(status) === 1 ? 'Active' : 'Inactive')

const buildUserProfile = async (userId: number): Promise<ProfileData | null> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      role: true,
      city: true,
      state: true
    }
  })

  if (!user) return null

  const personName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.user_name || user.email
  const showCompany = ['AG', 'TC'].includes(user.user_type) || Number(user.role_id) === 2

  const fullName =
    (user.user_type === 'AG' || user.user_type === 'TC'
      ? user.company_name || personName
      : personName || user.company_name) || 'Not available'

  const profileImage = user.avatar
    ? user.user_type === 'AG' || user.user_type === 'SA'
      ? agencyImagePath(user.id, user.avatar)
      : agencyUsersFilePath(user.id, user.avatar)
    : '/images/avatars/1.png'

  const signImage = user.sign_image
    ? user.user_type === 'AG'
      ? agencyImagePath(user.id, `sign/${user.sign_image}`)
      : agencyUsersFilePath(user.id, `sign/${user.sign_image}`)
    : ''

  return {
    id: user.id,
    isSsc: false,
    userType: user.user_type,
    roleLabel: getUserRoleLabel(user),
    statusLabel: getStatusLabel(user.status),
    fullName,
    firstName: user.first_name,
    lastName: user.last_name,
    companyName: user.company_name,
    username: user.user_name,
    email: user.email,
    mobileNo: user.mobile_no,
    landlineNo: user.landline_no,
    gender: user.gender,
    dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString().slice(0, 10) : null,
    address: user.address,
    stateId: user.state_id,
    cityId: user.city_id,
    stateName: user.state?.state_name || null,
    cityName: user.city?.city_name || null,
    pinCode: user.pin_code,
    profileImage,
    signImage,
    canEditStamp: showCompany,
    showCompany,
    sscName: null,
    sscCode: null,
    sector: null,
    subSector: null,
    typeOfAwardingBody: null,
    agencyName: null
  }
}

const buildSscProfile = async (sscId: number): Promise<ProfileData | null> => {
  const ssc = await prisma.sector_skill_councils.findUnique({
    where: { id: sscId },
    include: {
      agency: true
    }
  })

  if (!ssc) return null

  return {
    id: ssc.id,
    isSsc: true,
    userType: null,
    roleLabel: 'Sector Skill Council',
    statusLabel: getStatusLabel(ssc.status),
    fullName: ssc.ssc_name,
    firstName: null,
    lastName: null,
    companyName: null,
    username: ssc.ssc_username,
    email: null,
    mobileNo: null,
    landlineNo: null,
    gender: null,
    dateOfBirth: null,
    address: null,
    stateId: null,
    cityId: null,
    stateName: null,
    cityName: null,
    pinCode: null,
    profileImage: ssc.ssc_image ? sscImagePath(ssc.id, ssc.ssc_image) : '/images/avatars/1.png',
    signImage: '',
    canEditStamp: false,
    showCompany: false,
    sscName: ssc.ssc_name,
    sscCode: ssc.ssc_code,
    sector: ssc.sector,
    subSector: ssc.sub_sector,
    typeOfAwardingBody: ssc.type_of_awarding_body,
    agencyName: ssc.agency?.company_name || ssc.agency?.first_name || null
  }
}

const PortalProfile = async () => {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!session?.user || !userId) {
    return <div className='p-6 text-center text-error'>Unauthorized: No active session</div>
  }

  const isSsc = Boolean(session.user.is_ssc)
  const data = isSsc ? await buildSscProfile(userId) : await buildUserProfile(userId)

  if (!data) {
    return <div className='p-6 text-center text-error'>Profile not found</div>
  }

  const states = isSsc
    ? []
    : await prisma.state.findMany({
        where: {
          country_id: 101,
          is_active: true
        },
        select: {
          state_id: true,
          state_name: true
        },
        orderBy: {
          state_name: 'asc'
        }
      })

  const cities =
    !isSsc && data.stateId
      ? await prisma.city.findMany({
          where: {
            state_id: data.stateId,
            is_active: true
          },
          select: {
            city_id: true,
            city_name: true
          },
          orderBy: {
            city_name: 'asc'
          }
        })
      : []

  return <MyProfile data={data} states={states} cities={cities} />
}

export default PortalProfile
