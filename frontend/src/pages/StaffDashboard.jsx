import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Paper,
  LinearProgress
} from '@mui/material'
import {
  Restaurant,
  CheckCircle,
  Schedule,
  Person
} from '@mui/icons-material'
import axios from 'axios'
import Navbar from '../components/Navbar'
import OrderStatusChip from '../components/OrderStatusChip'
import { useSocket } from '../context/SocketContext'

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';


const StaffDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' })
  const { notifications } = useSocket()

  useEffect(() => {
    fetchStaffOrders()
  }, [])

  useEffect(() => {
    // Refresh orders when new notifications arrive
    if (notifications.length > 0) {
      fetchStaffOrders()
    }
  }, [notifications])

  const fetchStaffOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/staff-orders`)
      // Ensure orders is always an array
      if (Array.isArray(response.data)) {
        setOrders(response.data)
      } else if (Array.isArray(response.data.orders)) {
        setOrders(response.data.orders)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching staff orders:', error)
      setOrders([])
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true)
    try {
        await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, { status: newStatus })
      setAlert({
        show: true,
        message: `Order status updated to ${newStatus}`,
        severity: 'success'
      })
      fetchStaffOrders()
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.error || 'Failed to update order status',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'preparing':
        return (
          <Button
            variant="contained"
            color="primary"
            onClick={() => updateOrderStatus(order._id, 'ready')}
            startIcon={<CheckCircle />}
            disabled={loading}
          >
            Mark as Ready
          </Button>
        )
      case 'ready':
        return (
          <Button
            variant="contained"
            color="success"
            onClick={() => updateOrderStatus(order._id, 'completed')}
            startIcon={<CheckCircle />}
            disabled={loading}
          >
            Complete Order
          </Button>
        )
      default:
        return null
    }
  }

  const getTotalPreparationTime = (order) => {
    return order.items.reduce((total, item) => {
      if (!item.menuItem || typeof item.menuItem.preparationTime !== 'number') {
        return total; // skip if menuItem is missing or preparationTime is not a number
      }
      return total + (item.menuItem.preparationTime * item.quantity)
    }, 0)
  }

  // Defensive checks for orders.filter
  const preparingOrders = Array.isArray(orders) ? orders.filter(order => order.status === 'preparing') : []
  const readyOrders = Array.isArray(orders) ? orders.filter(order => order.status === 'ready') : []
  const pendingOrders = Array.isArray(orders) ? orders.filter(order => order.status === 'pending') : []

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar title="Staff Dashboard - Kitchen Orders" />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {alert.show && (
          <Alert 
            severity={alert.severity} 
            onClose={() => setAlert({ ...alert, show: false })}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        )}

        {/* Dashboard Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h4">{preparingOrders.length}</Typography>
              <Typography variant="body2">Preparing</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h4">{readyOrders.length}</Typography>
              <Typography variant="body2">Ready for Pickup</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h4">{orders.length}</Typography>
              <Typography variant="body2">Total Active</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h4">
                {orders.reduce((total, order) => total + getTotalPreparationTime(order), 0)}
              </Typography>
              <Typography variant="body2">Total Prep Time (min)</Typography>
            </Paper>
          </Grid>
        </Grid>

        {orders.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Restaurant sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No Active Orders
              </Typography>
              <Typography variant="body1" color="text.secondary">
                All caught up! New orders will appear here automatically.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid item xs={12} md={6} key={order._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Order #{order.orderNumber}
                      </Typography>
                      <OrderStatusChip status={order.status} />
                    </Box>

                    <Box display="flex" alignItems="center" mb={2}>
                      <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Customer: {order.customer.name}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={2}>
                      <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Ordered: {new Date(order.createdAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Order Items:
                    </Typography>
                    <List dense>
                      {order.items.map((item, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={`${item.quantity}x ${item.menuItem ? item.menuItem.name : 'Unknown Item'}`}
                            secondary={
                              item.menuItem && typeof item.menuItem.preparationTime === 'number'
                                ? `Prep time: ${item.menuItem.preparationTime} min each`
                                : 'Prep time: N/A'
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    {order.specialInstructions && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" color="primary">
                          Special Instructions:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          {order.specialInstructions}
                        </Typography>
                      </Box>
                    )}

                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          Estimated Total Time:
                        </Typography>
                        <Chip 
                          label={`${getTotalPreparationTime(order)} min`}
                          size="small"
                          color="info"
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={order.status === 'ready' ? 100 : order.status === 'preparing' ? 50 : 0}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" color="primary">
                        Total: ${order.totalAmount.toFixed(2)}
                      </Typography>
                      {getStatusActions(order)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}

export default StaffDashboard;