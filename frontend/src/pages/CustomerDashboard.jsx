import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, CardMedia, Typography, Button,
  Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Badge, IconButton, Fab, Drawer, List, ListItem, ListItemText,
  Divider, Alert
} from '@mui/material';
import {
  Add as AddIcon, Remove as RemoveIcon, ShoppingCart, History
} from '@mui/icons-material';
import axios from 'axios';
import Navbar from '../components/Navbar';
import OrderStatusChip from '../components/OrderStatusChip';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3001';

const CustomerDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  useEffect(() => {
    fetchMenuItems();
    fetchMyOrders();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/menu`);
      const data = res.data;
      setMenuItems(Array.isArray(data) ? data : data.menuItems);
    } catch {
      setMenuItems([]);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/orders/my-orders`);
      const data = res.data;
      setOrders(Array.isArray(data) ? data : data.orders);
    } catch {
      setOrders([]);
    }
  };

  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(ci => ci._id === item._id);
      if (existing) {
        return prev.map(ci =>
          ci._id === item._id ? { ...ci, quantity: ci.quantity + qty } : ci
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateCartQuantity = (id, qty) => {
    setCart(prev =>
      qty <= 0 ? prev.filter(ci => ci._id !== id)
        : prev.map(ci => (ci._id === id ? { ...ci, quantity: qty } : ci))
    );
  };

  const getCartTotal = () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const getCartCount = () => cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/orders`, {
        items: cart.map(i => ({ menuItemId: i._id, quantity: i.quantity })),
        specialInstructions
      });
      const orderId = res.data.orderNumber || res.data._id;
      setAlert({
        show: true,
        message: `Order placed! ID: ${orderId}`,
        severity: 'success'
      });
      setCart([]);
      setSpecialInstructions('');
      setOrderDialogOpen(false);
      setCartOpen(false);
      fetchMyOrders();
    } catch (err) {
      setAlert({
        show: true,
        message: err.response?.data?.error || 'Failed to place order',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if order can be cancelled
  const canCancelOrder = (order) => {
    if (!order || ['completed', 'billed', 'cancelled'].includes(order.status)) return false;
    const created = new Date(order.createdAt);
    const now = new Date();
    return (now - created) <= 5 * 60 * 1000;
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      await axios.put(`${API_BASE_URL}/api/orders/${orderToCancel._id}/cancel`, {}, { withCredentials: true });
      setAlert({ show: true, message: 'Order cancelled successfully', severity: 'success' });
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      fetchMyOrders();
    } catch (err) {
      setAlert({ show: true, message: err.response?.data?.error || 'Failed to cancel order', severity: 'error' });
    }
  };

  const grouped = Array.isArray(menuItems) ? menuItems.reduce((g, i) => {
    (g[i.category] = g[i.category] || []).push(i);
    return g;
  }, {}) : {};

  const categoryTitles = {
    'appetizer': 'Appetizers',
    'main-course': 'Main Courses',
    'dessert': 'Desserts',
    'beverage': 'Beverages',
    'side-dish': 'Sides'
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar title="Customer Dashboard" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
  <Typography variant="h4" gutterBottom>Our Menu</Typography>
  {Object.entries(grouped).map(([cat, items]) => (
    <Box key={cat} sx={{ mb: 4 }}>
      <Typography variant="h5" color="primary" gutterBottom>{categoryTitles[cat] || cat}</Typography>
      <Grid container spacing={2} alignItems="stretch">
        {items.map(item => (
          <Grid item xs={12} sm={6} md={3} key={item._id}>
            <Card
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                borderRadius: 2,
                boxShadow: 3,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)' }
              }}
            >
              <CardMedia
                component="img"
                image={item.image}
                alt={item.name}
                sx={{ height: 180, width: '100%', objectFit: 'cover', minHeight: 180, maxHeight: 180 }}
              />
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 1 }}>
                <Typography variant="h6" gutterBottom>{item.name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {item.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" color="primary">
                    ₹{item.price.toFixed(2)}
                  </Typography>
                  <Chip label={`${item.preparationTime} min`} size="small" />
                </Box>
              </CardContent>
              <Box sx={{ p: 1, pt: 0 }}>
                <Button fullWidth variant="contained" onClick={() => addToCart(item)} startIcon={<AddIcon />}>
                  Add to Cart
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  ))}
</Container>

      {/* FABs */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Fab color="primary" onClick={() => setCartOpen(true)}>
          <Badge badgeContent={getCartCount()} color="error"><ShoppingCart /></Badge>
        </Fab>
        <Fab color="secondary" onClick={() => setOrdersOpen(true)}><History /></Fab>
      </Box>

      {/* Cart Drawer */}
      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>Shopping Cart</Typography>
          {!cart.length ? <Typography color="text.secondary">Your cart is empty</Typography> : (
            <>
              <List>
                {cart.map(item => (
                  <ListItem key={item._id}>
                    <ListItemText primary={item.name} secondary={`₹${item.price.toFixed(2)} each`} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <IconButton size="small" onClick={() => updateCartQuantity(item._id, item.quantity - 1)}>
                        <RemoveIcon />
                      </IconButton>
                      <Typography>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateCartQuantity(item._id, item.quantity + 1)}>
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">₹{getCartTotal().toFixed(2)}</Typography>
              </Box>
              <Button fullWidth variant="contained" onClick={() => setOrderDialogOpen(true)}>
                Place Order
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      {/* Orders Drawer */}
      <Drawer anchor="right" open={ordersOpen} onClose={() => setOrdersOpen(false)}>
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>My Orders</Typography>
          {!orders.length ? <Typography color="text.secondary">No orders yet</Typography> : (
            <List>
              {orders.map(order => (
                <ListItem key={order._id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                    <Typography variant="subtitle1">{order.orderNumber || order._id}</Typography>
                    <OrderStatusChip status={order.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ₹{order.totalAmount.toFixed(2)} • {order.items.length} items
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.createdAt).toLocaleString()}
                  </Typography>
                  {canCancelOrder(order) && (
                    <Button
                      color="error"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setOrderToCancel(order);
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Confirm Order Dialog */}
      <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Order</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Order Summary</Typography>
          {cart.map(item => (
            <Box key={item._id} display="flex" justifyContent="space-between" mb={1}>
              <Typography>{item.name} × {item.quantity}</Typography>
              <Typography>₹{(item.price * item.quantity).toFixed(2)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6">₹{getCartTotal().toFixed(2)}</Typography>
          </Box>
          <TextField
            fullWidth multiline rows={3} label="Special Instructions (Optional)"
            value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePlaceOrder} variant="contained" disabled={loading}>
            {loading ? 'Placing...' : 'Confirm Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel this order?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
          <Button onClick={handleCancelOrder} color="error" variant="contained">Yes, Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboard;