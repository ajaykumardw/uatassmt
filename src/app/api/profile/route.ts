import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { pipeline } from 'stream/promises'

import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import type { Prisma, users_gender } from '@prisma/client'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'
import { storageFolders } from '@/configs/customDataConfig'

const storageRoot = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads)

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key)

  return typeof value === 'string' ? value.trim() : ''
}

const getNullableText = (formData: FormData, key: string) => getText(formData, key) || null

const getNullableNumber = (formData: FormData, key: string) => {
  const value = getText(formData, key)

  return value ? Number(value) : null
}

const getFile = (formData: FormData, key: string) => {
  const value = formData.get(key)

  return value && typeof value !== 'string' && value.size > 0 ? value : null
}

const saveFile = async (file: File, directory: string) => {
  const extension = path.extname(file.name) || '.jpg'
  const filename = `${randomUUID()}${extension}`

  await fsp.mkdir(directory, { recursive: true })
  await pipeline(file.stream() as any, fs.createWriteStream(path.join(directory, filename)))

  return filename
}

const removeFile = async (filePath: string) => {
  if (fs.existsSync(filePath)) {
    await fsp.unlink(filePath)
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!session?.user || !userId || session.user.is_student) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const isSsc = Boolean(session.user.is_ssc)
  const formData = await req.formData()

  const profileImage = getFile(formData, 'profileImage')
  const signImage = getFile(formData, 'signImage')

  const profileDirectory = isSsc
    ? path.join(storageRoot, storageFolders.ssc, String(userId))
    : session.user.user_type === 'AG'
      ? path.join(storageRoot, storageFolders.agency, String(userId))
      : path.join(storageRoot, storageFolders.agency, storageFolders.users, String(userId))

  const signDirectory = path.join(profileDirectory, 'sign')

  let newProfileImage = ''
  let newSignImage = ''

  try {
    if (profileImage) newProfileImage = await saveFile(profileImage, profileDirectory)
    if (signImage) newSignImage = await saveFile(signImage, signDirectory)

    if (isSsc) {
      const currentSsc = await prisma.sector_skill_councils.findUnique({ where: { id: userId } })

      if (!currentSsc) {
        return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })
      }

      await prisma.sector_skill_councils.update({
        where: { id: userId },
        data: {
          ssc_name: getText(formData, 'sscName') || currentSsc.ssc_name,
          ssc_code: getNullableText(formData, 'sscCode'),
          sector: getNullableText(formData, 'sector'),
          sub_sector: getNullableText(formData, 'subSector'),
          type_of_awarding_body: getNullableText(formData, 'typeOfAwardingBody'),
          ssc_image: newProfileImage || currentSsc.ssc_image
        }
      })

      if (newProfileImage && currentSsc.ssc_image) {
        await removeFile(path.join(profileDirectory, currentSsc.ssc_image))
      }
    } else {
      const currentUser = await prisma.users.findUnique({ where: { id: userId } })

      if (!currentUser) {
        return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })
      }

      const email = getText(formData, 'email')
      const gender = getText(formData, 'gender')
      const dateOfBirth = getText(formData, 'dateOfBirth')
      const canEditCompany = ['AG', 'TC'].includes(currentUser.user_type) || Number(currentUser.role_id) === 2
      const canEditStamp = canEditCompany

      const data: Prisma.usersUncheckedUpdateInput = {
        first_name: getNullableText(formData, 'firstName'),
        last_name: getNullableText(formData, 'lastName'),
        email: email || currentUser.email,
        mobile_no: getNullableText(formData, 'mobileNo'),
        landline_no: getNullableText(formData, 'landlineNo'),
        gender: ['m', 'f', 't'].includes(gender) ? (gender as users_gender) : undefined,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: getNullableText(formData, 'address'),
        state_id: getNullableNumber(formData, 'state'),
        city_id: getNullableNumber(formData, 'city'),
        pin_code: getNullableText(formData, 'pinCode')
      }

      if (canEditCompany) {
        data.company_name = getNullableText(formData, 'companyName')
      }

      if (canEditStamp) {
        data.sign_image = newSignImage || currentUser.sign_image
      }

      data.avatar = newProfileImage || currentUser.avatar

      await prisma.users.update({
        where: { id: userId },
        data
      })

      if (newProfileImage && currentUser.avatar) {
        await removeFile(path.join(profileDirectory, currentUser.avatar))
      }

      if (newSignImage && currentUser.sign_image) {
        await removeFile(path.join(signDirectory, currentUser.sign_image))
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error: any) {
    if (newProfileImage) await removeFile(path.join(profileDirectory, newProfileImage))
    if (newSignImage) await removeFile(path.join(signDirectory, newSignImage))

    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Email is already in use' }, { status: 400 })
    }

    console.error('Profile update error:', error)

    return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 })
  }
}

