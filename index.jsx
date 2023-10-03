// ** react  imports
import { useRef } from 'react'

// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Components
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled, useTheme } from '@mui/material/styles'
import InputAdornment from '@mui/material/InputAdornment'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import { Autocomplete, Card, CardContent, Paper, Switch } from '@mui/material'

// ** image imports
import Image from 'next/image'
import Avatarimage from 'public/images/avatars/1.png'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks
import { useForm } from 'react-hook-form'

// ** yup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** translation
import { useTranslation } from 'react-i18next'
import Translations from 'src/layouts/components/Translations'

// ** redux
import { useDispatch, useSelector } from 'react-redux'
import { addUserByAdmin, editUser, getUser } from 'src/store/reducers/user'
import { getUserTypesForDropdown } from 'src/store/reducers/userTypes'
import { addIdIntoEndpoint } from 'src/utils/functions'
import { showUserEndpoint, editUserEndpoint } from 'src/utils/functions/Endpoints'

// ** toaster
import { toast } from 'react-hot-toast'

// ** next router
import { useRouter } from 'next/router'

// ** custom imports
import CommonHeader from 'src/pages/components/CommonHeader'
import useMediaQueries from 'src/hooks/useMediaQueries'
import ErrorShow from 'src/pages/components/ErrorShow'

// ** styled components
const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(1.75),
  '& .MuiFormControlLabel-label': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary
  }
}))

/**
 * Main page for adding Users into system.
 *
 * @component
 * @example
 * // Example usage of AddUsers
 * <AddUsers />
 *
 *
 * @returns {JSX.Element} Main page for adding Users into system
 */
const AddUsers = () => {
  // ** useRef
  const profilePic = useRef()

  // ** redux selector function
  const userTypesData = useSelector(state => state.userTypes)
  const userTypes = userTypesData?.allUserTypesDropdown?.data

  // ** States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profileImageUrl, setprofileImageUrl] = useState(null)
  const [profileImage, setprofileImage] = useState(null)
  const [userType, setUserType] = useState(null)
  const [userData, setUserData] = useState(null)
  const [userStatus, setUserStatus] = useState(null)

  // ** localStorage token
  const token = localStorage.getItem('accessToken')

  // ** Hooks
  const theme = useTheme()
  const dispatch = useDispatch()

  // ** route
  const router = useRouter()
  const { id, option } = router.query

  // ** get redux data     //! shows old data
  // const userData = useSelector(state => state.userReducer)
  // const user = userData?.data?.data

  // ** frm values (schema and default values)
  const defaultValues =
    option === 'Edit' || option === 'Show' || option === 'Update_Profile'
      ? {
          first_name: 'First Name',
          last_name: 'Last Name',
          usr_email: 'User Email',
          usr_phone: '0000000000',
          usertype_id: '',
          usr_status: true
        }
      : {
          first_name: '',
          last_name: '',
          usr_email: '',
          usr_phone: '',
          password: '',
          password_confirmation: '',
          usertype_id: '',
          usr_status: true
        }

  // ** language
  const { t } = useTranslation()

  // ** validation Schema
  const passwordsValidation =
    option === 'Edit'
      ? {}
      : {
          password: yup.string().min(8).required(t('This field is required')),
          password_confirmation: yup
            .string()
            .min(8)
            .oneOf([yup.ref('password'), null], 'Passwords must match')
        }

  const userTypeValidation =
    option === 'Update_Profile'
      ? {}
      : {
          usertype_id: yup.string().required(t('This field is required')),
          usr_status: yup.boolean().required(t('This field is required')),
          ...passwordsValidation
        }

  const schema = yup.object().shape({
    first_name: yup.string().required(t('This field is required')),
    last_name: yup.string().required(t('This field is required')),
    usr_email: yup.string().email().required(t('This field is required')),
    usr_phone: yup.string().min(10).max(19).required(t('This field is required')),
    ...userTypeValidation
  })

  // ** form hook
  const {
    getValues,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, mode: 'onBlur', resolver: yupResolver(schema) })

  // ** get values for edit and show
  // ** useEffects
  useEffect(() => {
    dispatch(getUserTypesForDropdown({ token }))
    if (option === 'Edit' || option === 'Show' || option === 'Update_Profile') {
      const endpoint = addIdIntoEndpoint({ Endpoint: showUserEndpoint, id })
      dispatch(getUser({ endpoint, token })).then(data => {
        const tempUser = data.payload.data

        // console.log(tempUser)
        setUserData(data.payload.data)
        setUserStatus(data.payload.data?.usr_status)

        setUserType(tempUser?.usertype)
        setprofileImageUrl(tempUser?.user_profile)
        reset({
          first_name: tempUser?.first_name,
          last_name: tempUser?.last_name,
          usr_email: tempUser?.usr_email,
          usr_phone: tempUser?.usr_phone,
          usertype_id: tempUser?.usertype,
          usr_status: tempUser?.usr_status === 1 ? true : false
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** formSubmit function
  const onSubmit = data => {
    const token = localStorage.getItem('accessToken')
    data.user_profile = profileImage ? profileImage : null
    data.usertype_id = userType.id
    data.token = token

    console.log(data)
    try {
      let dispatchUser
      let payload
      dispatch(addUserByAdmin(data))
        .then(response => {
          dispatchUser = response
          payload = Object.values(dispatchUser?.payload) // ? converts all errors into array and shows
          if (dispatchUser?.error) {
            payload.map(val => {
              val.map(err => {
                toast.error(err)
              })
            })
          } else {
            toast.success(t('User Added Successfully'))
            router.back()
            reset()
          }
        })
        .catch(error => {
          toast.error(t('Something Went Wrong'))
        })
    } catch (error) {
      toast.error(t('Something Went Wrong'))
    }
  }

  // * update function
  const onUpdate = data => {
    console.log(data)

    // * get token
    const token = localStorage.getItem('accessToken')

    // * make endpoint of edit
    const endpoint = addIdIntoEndpoint({ Endpoint: editUserEndpoint, id })
    console.log(token)

    // * bind data
    data.usertype_id = userType.id
    data.user_profile = profileImage ? profileImage : null
    data.token = token
    data.endpoint = endpoint

    try {
      let dispatchUser
      let payload
      dispatch(editUser(data))
        .then(response => {
          dispatchUser = response
          payload = Object.values(dispatchUser?.payload) // ? converts all errors into array and shows
          if (dispatchUser?.error) {
            payload.map(val => {
              val.map(err => {
                toast.error(err)
              })
            })
          } else {
            toast.success(t('User Updated Successfully'))
            router.back()
            setTimeout(() => {
              router.reload()
            }, 500)
          }
        })
        .catch(error => {
          toast.error(t('Something Went Wrong'))
        })
    } catch (error) {
      toast.error(t('Something Went Wrong'))
    }
  }

  // ** Styled components

  // ** media query
  const { smallScreen, extraSmall } = useMediaQueries()

  // ** handle functions

  // ? FOR HANDLING SWITCH CHANGE
  const handleStatusChange = () => {
    setUserStatus(!userStatus)
  }

  const handleFileUpload = () => {
    profilePic.current.click()
  }

  const handleImageChange = e => {
    const file = e.target.files[0]
    if (!file) {
      return
    }
    setprofileImage(file)
    setprofileImageUrl(URL.createObjectURL(file))
  }

  return (
    <>
      <Box minHeight='80vh'>
        <form
          noValidate
          autoComplete='off'
          onSubmit={option === 'Edit' || option === 'Update_Profile' ? handleSubmit(onUpdate) : handleSubmit(onSubmit)}
        >
          <CommonHeader
            title={option === 'Edit' ? 'Edit User' : option === 'Update_Profile' ? 'Update Profile' : 'Add User'}
            custom
          />
          {/* ___________________________________________ Fields Starts Here ----------------------------------------------------------- */}
          <Card>
            <CardContent sx={!smallScreen}>
              <Box display={'flex'}>
                <Box sx={{ marginLeft: '8%', marginTop: '3%' }}>
                  <Grid item xs={12} sm={12} md={6} mt={3}>
                    {profileImageUrl ? (
                      <img
                        style={{
                          borderRadius: '6px',
                          marginBottom: '10px',
                          height: '130px',
                          width: '140px',
                          objectFit: 'cover'
                        }}
                        src={profileImageUrl}
                        alt='user-image'
                        {...register('user_profile')}
                      />
                    ) : (
                      <Image
                        style={{
                          borderRadius: '6px',
                          marginBottom: '10px',
                          height: '130px',
                          width: '140px',
                          objectFit: 'cover'
                        }}
                        src={Avatarimage}
                        alt='user-image'
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} mt={3}>
                    <Button
                      variant='contained'
                      size='small'
                      sx={{ marginLeft: '15px' }}
                      onClick={() => {
                        handleFileUpload()
                      }}
                    >
                      <Icon icon='material-symbols:upload' />
                      <Translations text='Upload' />
                    </Button>
                    <input
                      ref={profilePic}
                      name='user_profile'
                      type='file'
                      style={{ display: 'none' }}
                      accept='.png, .jpg'
                      onChange={handleImageChange}
                    />
                  </Grid>
                </Box>

                <Box sx={{ marginLeft: '9.8%' }}>
                  <Grid container spacing={3}>
                    {/* fname  */}
                    <Grid item xs={12} sm={12} md={6} mt={3}>
                      <TextField
                        fullWidth
                        label={<Translations text='First Name' />}
                        name='first_name'
                        placeholder={t('john')}
                        {...register('first_name', { required: true })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Icon icon='tabler:user' />
                            </InputAdornment>
                          )
                        }}
                      />

                      <ErrorShow errorKey={errors.first_name} />
                    </Grid>

                    {/* lname  */}
                    <Grid item xs={12} sm={12} md={6} mt={3}>
                      <TextField
                        fullWidth
                        label={<Translations text='Last Name' />}
                        name='last_name'
                        placeholder={t('doe')}
                        {...register('last_name', { required: true })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Icon icon='tabler:user' />
                            </InputAdornment>
                          )
                        }}
                      />

                      <ErrorShow errorKey={errors.last_name} />
                    </Grid>

                    {/* email  */}
                    <Grid item xs={12} sm={12} md={6} mt={3}>
                      <TextField
                        fullWidth
                        sx={{ mb: 0 }}
                        label={<Translations text='Email' />}
                        name='usr_email'
                        disabled={option === 'Update_Profile'}
                        placeholder={t('user@email.com')}
                        {...register('usr_email', { required: true })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Icon icon='tabler:mail' />
                            </InputAdornment>
                          )
                        }}
                      />

                      <ErrorShow errorKey={errors.usr_email} />
                    </Grid>

                    {/* phone number  */}
                    <Grid item xs={12} sm={12} md={6} mt={3}>
                      <TextField
                        type={'tel'}
                        fullWidth
                        sx={{ mb: 0 }}
                        label={<Translations text='Phone Number' />}
                        name='usr_phone'
                        placeholder={t('0000000000')}
                        {...register('usr_phone', { required: true, minLength: 15 })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Icon icon='tabler:phone' />
                            </InputAdornment>
                          )
                        }}
                      />

                      <ErrorShow errorKey={errors.usr_phone} />
                    </Grid>

                    {!(option === 'Edit' || option === 'Show' || option === 'Update_Profile') ? (
                      <>
                        <Grid item xs={12} sm={12} md={6} mt={3}>
                          {/* password */}
                          <FormControl fullWidth>
                            <InputLabel htmlFor='auth-login-v2-password'>{<Translations text='Password' />}</InputLabel>
                            <OutlinedInput
                              label={<Translations text='Password' />}
                              id='auth-login-v2-password'
                              name='password'
                              type={showPassword ? 'text' : 'password'}
                              placeholder={t('********')}
                              startAdornment={
                                <InputAdornment position='start'>
                                  <Icon icon='solar:lock-password-linear' />
                                </InputAdornment>
                              }
                              endAdornment={
                                <InputAdornment position='end'>
                                  <IconButton
                                    edge='end'
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    <Icon icon={showPassword ? 'tabler:eye' : 'tabler:eye-off'} fontSize={20} />
                                  </IconButton>
                                </InputAdornment>
                              }
                              {...register('password', { required: true })}
                            />
                          </FormControl>

                          <ErrorShow errorKey={errors.password} />
                        </Grid>

                        <Grid item xs={12} sm={12} md={6} mt={3}>
                          {/* confirm password */}
                          <FormControl fullWidth>
                            <InputLabel htmlFor='auth-login-v2-confirm-password'>
                              {<Translations text='Confirm Password' />}
                            </InputLabel>
                            <OutlinedInput
                              label={<Translations text='Confirm Password' />}
                              id='auth-login-v2-confirm-password'
                              name='password_confirmation'
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder='********'
                              startAdornment={
                                <InputAdornment position='start'>
                                  <Icon icon='solar:lock-password-linear' />
                                </InputAdornment>
                              }
                              endAdornment={
                                <InputAdornment position='end'>
                                  <IconButton
                                    edge='end'
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    <Icon icon={showConfirmPassword ? 'tabler:eye' : 'tabler:eye-off'} fontSize={20} />
                                  </IconButton>
                                </InputAdornment>
                              }
                              {...register('password_confirmation', { required: true })}
                            />
                          </FormControl>

                          <ErrorShow errorKey={errors.password_confirmation} />
                        </Grid>
                      </>
                    ) : null}

                    {/* //! final autocomplete ** user Type  */}
                    {!(option === 'Update_Profile') && (
                      <>
                        <Grid item xs={12} sm={12} md={6} lg={6} marginTop={3}>
                          <Autocomplete
                            value={userType}
                            autoComplete='off'
                            options={userTypes ? userTypes : []}
                            getOptionLabel={option => option.usrType}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label={<Translations text='User Type' />}
                                name='usertype_id'
                                {...register('usertype_id', { required: true })}
                                autoComplete='off'
                              />
                            )}
                            PaperComponent={props => (
                              <Paper
                                sx={{
                                  backgroundColor:
                                    theme.palette.mode === 'light' ? '#F1F0F5 !important' : '#393D55 !important'
                                }}
                                {...props}
                                selected={props.selected}
                              />
                            )}
                            onChange={(event, value) => {
                              setUserType(value)
                              setValue('usertype_id', value?.id) // ! this fixed problem of getting string instead of object because of use form hook does not support object only string supported
                            }}
                            inputValue={getValues('usertype_id')?.usrType} // set inputValue to the value of the usertype_id field
                            onInputChange={(event, inputVal) => setValue('usertype_id', inputVal)} // set the value of usertype_id to the input value when it changes
                            disableClearable
                          />

                          <ErrorShow errorKey={errors.usertype_id} />
                        </Grid>

                        {/* Status  */}
                        <Grid item xs={12} sm={12} md={3} lg={3} marginTop={3}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={userStatus}
                                name='usr_status'
                                inputProps={{ 'aria-label': 'controlled' }}
                                onClick={handleStatusChange}
                                {...register('usr_status', { required: true })}
                              />
                            }
                            label={t('User Status')}
                            labelPlacement='start'
                            sx={{ margin: 0 }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              </Box>
              {option != 'Show' ? (
                <CardContent>
                  <Grid item xs={12} sm={12} md={3} lg={3}>
                    <Box sx={{ float: 'right' }}>
                      <Button size='large' type='submit' variant='contained' sx={{ textAlign: 'center' }}>
                        {option === 'Edit' ? (
                          <Translations text='Edit User' />
                        ) : option === 'Update_Profile' ? (
                          <Translations text='Update Profile' />
                        ) : (
                          <Translations text='Add User' />
                        )}
                      </Button>
                    </Box>
                    <br />
                  </Grid>
                </CardContent>
              ) : null}
            </CardContent>
          </Card>

          {/* -------------------------------------------------------- Fields Ends Here ----------------------------------------------------------- */}
        </form>
      </Box>
    </>
  )
}

AddUsers.acl = {
  action: 'read',
  subject: 'admin-page'
}

export default AddUsers

// ! remove when host
// DONE:

// PENDING:
