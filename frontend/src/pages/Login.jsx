import React, { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material'
import { Restaurant } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  if (user) {
    return <Navigate to={`/${user.role}`} replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      navigate(`/${result.user.role}`)
    } else {
      setError(result.message)
    }
    
    setLoading(false)
  }

  const quickLogin = async (role) => {
    const credentials = {
      admin: { email: 'admin@restaurant.com', password: '1234567' },
      staff: { email: 'dee@gmail.com', password: '1234567' },
      customer: { email: 'sri@gmail.com', password: '1234567' }
    }

    const cred = credentials[role]
    if (cred) {
      setFormData(cred)
      const result = await login(cred.email, cred.password)
      if (result.success) {
        navigate(`/${result.user.role}`)
      }
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2
          }}
        >
          <Restaurant color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            Restaurant Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to access your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ width: '100%', my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Quick Login (Demo)
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => quickLogin('admin')}
              sx={{ minWidth: 80 }}
            >
              Admin
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => quickLogin('staff')}
              sx={{ minWidth: 80 }}
            >
              Staff
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => quickLogin('customer')}
              sx={{ minWidth: 80 }}
            >
              Customer
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button variant="text" size="small">
                  Sign Up
                </Button>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login