import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Button
} from '@mui/material'
import {
  Schedule,
  Restaurant,
  LocalShipping,
  CheckCircle
} from '@mui/icons-material'
import axios from 'axios'
import OrderStatusChip from '../components/OrderStatusChip'

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';

const OrderTracking = () => {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/track/${orderNumber}`)
      setOrder(response.data)
      setError('')
    } catch (error) {
      setError(error.response?.data?.error || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  const getActiveStep = (status) => {
    switch (status) {
      case 'pending': return 0
      case 'preparing': return 1
      case 'ready': return 2
      case 'completed': return 3
      default: return 0
    }
  }

  const steps = [
    { label: 'Order Received', icon: <Schedule /> },
    { label: 'Preparing', icon: <Restaurant /> },
    { label: 'Ready for Pickup', icon: <LocalShipping /> },
    { label: 'Completed', icon: <CheckCircle /> }
  ]

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading order details...
        </Typography>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" gutterBottom>
              Order Tracking
            </Typography>
            <Typography variant="h5" color="primary" gutterBottom>
              #{order.orderNumber}
            </Typography>
            <OrderStatusChip status={order.status} />
          </Box>

          {/* Order Progress */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={getActiveStep(order.status)} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel icon={step.icon}>
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Order Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Order Details
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ordered on: {new Date(order.createdAt).toLocaleString()}
            </Typography>
            {order.assignedStaff && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Assigned to: {order.assignedStaff.name}
              </Typography>
            )}
          </Box>

          {/* Order Items */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Items Ordered
            </Typography>
            <List>
              {order.items.map((item, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={`${item.quantity}x ${item.menuItem.name}`}
                    secondary={`$${item.price.toFixed(2)} each`}
                  />
                  <Typography variant="body2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Special Instructions
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {order.specialInstructions}
              </Typography>
            </Box>
          )}

          {/* Order Total */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mb: 4 }}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Total Amount:</Typography>
              <Typography variant="h6" color="primary">
                ${order.totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* Status Messages */}
          <Box textAlign="center">
            {order.status === 'pending' && (
              <Alert severity="info">
                Your order has been received and will be assigned to our kitchen staff shortly.
              </Alert>
            )}
            {order.status === 'preparing' && (
              <Alert severity="warning">
                Your order is being prepared by our kitchen staff. Please wait...
              </Alert>
            )}
            {order.status === 'ready' && (
              <Alert severity="success">
                Your order is ready for pickup! Please come to the counter.
              </Alert>
            )}
            {order.status === 'completed' && (
              <Alert severity="success">
                Order completed! Thank you for your business.
              </Alert>
            )}
          </Box>

          <Box textAlign="center" mt={3}>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default OrderTracking;