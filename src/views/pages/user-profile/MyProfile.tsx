'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import ChangePasswordDialog from '@/components/ChangePasswordDialog'

export type ProfileData = {
  id: number
  isSsc: boolean
  userType: string | null
  roleLabel: string
  statusLabel: string
  fullName: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  username: string | null
  email: string | null
  mobileNo: string | null
  landlineNo: string | null
  gender: string | null
  dateOfBirth: string | null
  address: string | null
  stateId: number | null
  cityId: number | null
  stateName: string | null
  cityName: string | null
  pinCode: string | null
  profileImage: string
  signImage: string
  canEditStamp: boolean
  showCompany: boolean
  sscName: string | null
  sscCode: string | null
  sector: string | null
  subSector: string | null
  typeOfAwardingBody: string | null
  agencyName: string | null
}

type StateOption = { state_id: number; state_name: string }
type CityOption = { city_id: number; city_name: string }

type FormValues = {
  firstName: string
  lastName: string
  companyName: string
  email: string
  mobileNo: string
  landlineNo: string
  gender: string
  dateOfBirth: string
  address: string
  state: string
  city: string
  pinCode: string
  sscName: string
  sscCode: string
  sector: string
  subSector: string
  typeOfAwardingBody: string
}

const getInitialForm = (data: ProfileData): FormValues => ({
  firstName: data.firstName || '',
  lastName: data.lastName || '',
  companyName: data.companyName || '',
  email: data.email || '',
  mobileNo: data.mobileNo || '',
  landlineNo: data.landlineNo || '',
  gender: data.gender || 'm',
  dateOfBirth: data.dateOfBirth || '',
  address: data.address || '',
  state: data.stateId ? String(data.stateId) : '',
  city: data.cityId ? String(data.cityId) : '',
  pinCode: data.pinCode || '',
  sscName: data.sscName || '',
  sscCode: data.sscCode || '',
  sector: data.sector || '',
  subSector: data.subSector || '',
  typeOfAwardingBody: data.typeOfAwardingBody || ''
})

const getCompanyLabel = (data: ProfileData) => {
  if (data.userType === 'AG') return 'Company Name'
  if (data.userType === 'TC') return 'Training Center Name'

  return 'Training Partner Name'
}

const getGenderLabel = (gender: string | null) => {
  if (gender === 'm') return 'Male'
  if (gender === 'f') return 'Female'
  if (gender === 't') return 'Transgender'

  return 'Not available'
}

const getDateLabel = (date: string | null) => {
  if (!date) return 'Not available'

  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

const DetailItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <Grid item xs={12} sm={6} md={4}>
    <div className='flex items-start gap-3'>
      <i className={`${icon} text-2xl text-textSecondary mbs-0.5 shrink-0`} />
      <div>
        <Typography variant='caption' color='text.secondary' className='block'>
          {label}
        </Typography>
        <Typography color='text.primary'>{value || 'Not available'}</Typography>
      </div>
    </div>
  </Grid>
)

const MyProfile = ({
  data,
  states,
  cities
}: {
  data: ProfileData
  states: StateOption[]
  cities: CityOption[]
}) => {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [form, setForm] = useState<FormValues>(getInitialForm(data))
  const [cityOptions, setCityOptions] = useState<CityOption[]>(cities)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState('')
  const [signFile, setSignFile] = useState<File | null>(null)
  const [signPreview, setSignPreview] = useState('')

  const updateField = (field: keyof FormValues, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  const startEditing = () => {
    setForm(getInitialForm(data))
    setCityOptions(cities)
    setProfileFile(null)
    setProfilePreview('')
    setSignFile(null)
    setSignPreview('')
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setProfileFile(null)
    setProfilePreview('')
    setSignFile(null)
    setSignPreview('')
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>, type: 'profile' | 'sign') => {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      if (type === 'profile') {
        setProfilePreview(String(reader.result))
        setProfileFile(file)
      } else {
        setSignPreview(String(reader.result))
        setSignFile(file)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleStateChange = async (stateId: string) => {
    updateField('state', stateId)
    updateField('city', '')
    setCityOptions([])

    if (!stateId) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/${stateId}`)

      if (!response.ok) throw new Error('Failed to load cities')

      setCityOptions(await response.json())
    } catch {
      toast.error('Unable to load cities for the selected state')
    }
  }

  const handleSubmit = async () => {
    if (data.isSsc) {
      if (!form.sscName.trim()) {
        toast.error('SSC name is required')

        return
      }
    } else {
      if (!form.firstName.trim()) {
        toast.error('First name is required')

        return
      }

      if (!form.email.trim()) {
        toast.error('Email is required')

        return
      }

      if (data.showCompany && !form.companyName.trim()) {
        toast.error(`${getCompanyLabel(data)} is required`)

        return
      }
    }

    setSaving(true)

    try {
      const formData = new FormData()

      Object.entries(form).forEach(([key, value]) => formData.append(key, value))

      if (profileFile) formData.append('profileImage', profileFile)
      if (signFile && data.canEditStamp) formData.append('signImage', signFile)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.message || 'Failed to update profile')

        return
      }

      toast.success('Profile updated successfully')
      setEditing(false)
      setProfileFile(null)
      setProfilePreview('')
      setSignFile(null)
      setSignPreview('')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const profileImage = profilePreview || data.profileImage
  const signImage = signPreview || data.signImage

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent className='flex flex-col sm:flex-row items-center gap-6'>
            <Avatar src={profileImage} alt={data.fullName} sx={{ width: 96, height: 96 }} />
            <div className='flex flex-col items-center sm:items-start gap-1 flex-grow text-center sm:text-left'>
              <div className='flex items-center gap-3 flex-wrap justify-center sm:justify-start'>
                <Typography variant='h4'>{data.fullName}</Typography>
                <Chip size='small' variant='tonal' color={data.statusLabel === 'Active' ? 'success' : 'secondary'} label={data.statusLabel} />
              </div>
              <Typography color='text.secondary'>{data.roleLabel}</Typography>
              {!data.isSsc && data.email ? <Typography color='text.secondary'>{data.email}</Typography> : null}
            </div>
            {!editing ? (
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button variant='contained' startIcon={<i className='tabler-edit' />} onClick={startEditing}>
                  Edit Profile
                </Button>
                <Button variant='tonal' startIcon={<i className='tabler-lock' />} onClick={() => setPasswordOpen(true)}>
                  Change Password
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title={editing ? 'Edit Profile' : 'Profile Details'} />
          <Divider />
          <CardContent>
            {!editing ? (
              <Grid container spacing={6}>
                {data.isSsc ? (
                  <>
                    <DetailItem icon='tabler-building-bank' label='SSC Name' value={data.sscName || ''} />
                    <DetailItem icon='tabler-id' label='SSC Code' value={data.sscCode || ''} />
                    <DetailItem icon='tabler-user-circle' label='Username' value={data.username || ''} />
                    <DetailItem icon='tabler-layout-grid' label='Sector' value={data.sector || ''} />
                    <DetailItem icon='tabler-list-details' label='Sub Sector' value={data.subSector || ''} />
                    <DetailItem icon='tabler-certificate' label='Awarding Body' value={data.typeOfAwardingBody || ''} />
                    <DetailItem icon='tabler-building' label='Agency' value={data.agencyName || ''} />
                  </>
                ) : (
                  <>
                    <DetailItem icon='tabler-user' label='Full Name' value={data.fullName} />
                    {data.showCompany ? (
                      <DetailItem icon='tabler-building' label={getCompanyLabel(data)} value={data.companyName || ''} />
                    ) : null}
                    <DetailItem icon='tabler-user-circle' label='Username' value={data.username || ''} />
                    <DetailItem icon='tabler-mail' label='Email' value={data.email || ''} />
                    <DetailItem icon='tabler-phone-call' label='Mobile' value={data.mobileNo || ''} />
                    <DetailItem icon='tabler-phone' label='Landline' value={data.landlineNo || ''} />
                    <DetailItem icon='tabler-user' label='Gender' value={getGenderLabel(data.gender)} />
                    <DetailItem icon='tabler-calendar' label='Date of Birth' value={getDateLabel(data.dateOfBirth)} />
                    <DetailItem icon='tabler-map-pin' label='Address' value={data.address || ''} />
                    <DetailItem icon='tabler-building' label='City' value={data.cityName || ''} />
                    <DetailItem icon='tabler-map' label='State' value={data.stateName || ''} />
                    <DetailItem icon='tabler-map' label='Pin Code' value={data.pinCode || ''} />
                  </>
                )}
                {data.canEditStamp ? (
                  <Grid item xs={12}>
                    <Divider className='mbe-6' />
                    <Typography variant='body2' color='text.secondary' className='mbe-2'>
                      Stamp / Signature
                    </Typography>
                    {data.signImage ? (
                      <img src={data.signImage} alt='Stamp' className='max-bs-[100px] rounded border' />
                    ) : (
                      <Typography color='text.secondary'>Not uploaded</Typography>
                    )}
                  </Grid>
                ) : null}
              </Grid>
            ) : (
              <form
                onSubmit={event => {
                  event.preventDefault()
                  handleSubmit()
                }}
              >
                <Grid container spacing={6}>
                  <Grid item xs={12}>
                    <div className='flex flex-col sm:flex-row gap-10'>
                      <div className='flex flex-col items-start gap-3'>
                        <Avatar src={profileImage} alt={data.fullName} sx={{ width: 96, height: 96 }} />
                        <Button component='label' variant='contained' size='small'>
                          Upload Photo
                          <input hidden type='file' accept='image/png, image/jpeg' onChange={event => handleImageChange(event, 'profile')} />
                        </Button>
                      </div>
                      {data.canEditStamp ? (
                        <div className='flex flex-col items-start gap-3'>
                          {signImage ? (
                            <img src={signImage} alt='Stamp' className='w-24 h-24 object-contain rounded border' />
                          ) : (
                            <Avatar variant='rounded' sx={{ width: 96, height: 96 }}>
                              <i className='tabler-pencil text-4xl' />
                            </Avatar>
                          )}
                          <Button component='label' variant='outlined' size='small'>
                            Upload Stamp
                            <input hidden type='file' accept='image/png, image/jpeg' onChange={event => handleImageChange(event, 'sign')} />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </Grid>

                  {data.isSsc ? (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label='SSC Name' value={form.sscName} onChange={event => updateField('sscName', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='SSC Code' value={form.sscCode} onChange={event => updateField('sscCode', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Sector' value={form.sector} onChange={event => updateField('sector', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Sub Sector' value={form.subSector} onChange={event => updateField('subSector', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label='Awarding Body'
                          value={form.typeOfAwardingBody}
                          onChange={event => updateField('typeOfAwardingBody', event.target.value)}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label='First Name' value={form.firstName} onChange={event => updateField('firstName', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Last Name' value={form.lastName} onChange={event => updateField('lastName', event.target.value)} />
                      </Grid>
                      {data.showCompany ? (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            required
                            label={getCompanyLabel(data)}
                            value={form.companyName}
                            onChange={event => updateField('companyName', event.target.value)}
                          />
                        </Grid>
                      ) : null}
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required type='email' label='Email' value={form.email} onChange={event => updateField('email', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Mobile' value={form.mobileNo} onChange={event => updateField('mobileNo', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Landline' value={form.landlineNo} onChange={event => updateField('landlineNo', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label='Gender' value={form.gender} onChange={event => updateField('gender', event.target.value)}>
                          <MenuItem value='m'>Male</MenuItem>
                          <MenuItem value='f'>Female</MenuItem>
                          <MenuItem value='t'>Transgender</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type='date'
                          label='Date of Birth'
                          value={form.dateOfBirth}
                          onChange={event => updateField('dateOfBirth', event.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth multiline minRows={2} label='Address' value={form.address} onChange={event => updateField('address', event.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label='State' value={form.state} onChange={event => handleStateChange(event.target.value)}>
                          <MenuItem value=''>Select State</MenuItem>
                          {states.map(state => (
                            <MenuItem key={state.state_id} value={String(state.state_id)}>
                              {state.state_name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label='City' value={form.city} onChange={event => updateField('city', event.target.value)}>
                          <MenuItem value=''>Select City</MenuItem>
                          {cityOptions.map(city => (
                            <MenuItem key={city.city_id} value={String(city.city_id)}>
                              {city.city_name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label='Pin Code' value={form.pinCode} onChange={event => updateField('pinCode', event.target.value)} />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} className='flex flex-wrap gap-4'>
                    <Button type='submit' variant='contained' disabled={saving} startIcon={saving ? <i className='tabler-loader animate-spin' /> : <i className='tabler-check' />}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant='tonal' color='secondary' onClick={cancelEditing} disabled={saving}>
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </CardContent>
        </Card>
      </Grid>

      <ChangePasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        userId={data.id}
        userType={data.isSsc ? 'ssc' : 'user'}
      />
    </Grid>
  )
}

export default MyProfile

