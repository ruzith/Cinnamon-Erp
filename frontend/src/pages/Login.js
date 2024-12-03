import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert
} from '@mui/material'
import { login, reset } from '../features/auth/authSlice'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth)

  useEffect(() => {
    if (isSuccess || user) {
      navigate('/')
    }

    return () => {
      dispatch(reset())
    }
  }, [isSuccess, user, navigate, dispatch])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(login(formData))
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link href="/register" underline="hover">
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login 