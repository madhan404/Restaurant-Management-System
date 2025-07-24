// import express from 'express';
// import Order from '../models/Order.js';
// import User from '../models/User.js';
// import MenuItem from '../models/MenuItem.js';
// import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

// const router = express.Router();

// // Round-robin staff assignment
// const assignOrderToStaff = async () => {
//   try {
//     const staff = await User.find({ 
//       role: 'staff', 
//       isActive: true 
//     }).sort({ lastOrderAssigned: 1 });
    
//     if (staff.length === 0) {
//       return null;
//     }

//     const assignedStaff = staff[0];
//     assignedStaff.lastOrderAssigned = new Date();
//     await assignedStaff.save();
    
//     return assignedStaff._id;
//   } catch (error) {
//     console.error('Error assigning staff:', error);
//     return null;
//   }
// };

// // Create order
// router.post('/', authenticateToken, async (req, res) => {
//   try {
//     const { items, specialInstructions } = req.body;
    
//     let totalAmount = 0;
//     const orderItems = [];

//     // Calculate total and prepare order items
//     for (const item of items) {
//       const menuItem = await MenuItem.findById(item.menuItemId);
//       if (!menuItem || !menuItem.isAvailable) {
//         return res.status(400).json({ error: `Menu item not available: ${item.menuItemId}` });
//       }
      
//       const itemTotal = menuItem.price * item.quantity;
//       totalAmount += itemTotal;
      
//       orderItems.push({
//         menuItem: menuItem._id,
//         quantity: item.quantity,
//         price: menuItem.price
//       });
//     }

//     // Assign staff using round-robin
//     const assignedStaffId = await assignOrderToStaff();

//     const order = new Order({
//       customer: req.user._id,
//       items: orderItems,
//       totalAmount,
//       specialInstructions,
//       assignedStaff: assignedStaffId,
//       status: assignedStaffId ? 'preparing' : 'pending'
//     });

//     await order.save();
//     await order.populate(['customer', 'items.menuItem', 'assignedStaff']);

//     // Emit real-time notification
//     req.io.emit('new-order', {
//       order: order,
//       message: 'New order received'
//     });

//     if (assignedStaffId) {
//       req.io.to(`staff-${assignedStaffId}`).emit('order-assigned', {
//         order: order,
//         message: 'New order assigned to you'
//       });
//     }

//     res.status(201).json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get all orders (Admin only)
// router.get('/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate('customer', 'name email')
//       .populate('items.menuItem', 'name price')
//       .populate('assignedStaff', 'name')
//       .sort({ createdAt: -1 });
    
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get orders by customer
// router.get('/my-orders', authenticateToken, async (req, res) => {
//   try {
//     const orders = await Order.find({ customer: req.user._id })
//       .populate('items.menuItem', 'name price')
//       .populate('assignedStaff', 'name')
//       .sort({ createdAt: -1 });
    
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get orders assigned to staff
// router.get('/staff-orders', authenticateToken, authorizeRoles('staff'), async (req, res) => {
//   try {
//     const orders = await Order.find({ 
//       assignedStaff: req.user._id,
//       status: { $in: ['preparing', 'ready'] }
//     })
//       .populate('customer', 'name')
//       .populate('items.menuItem', 'name price preparationTime')
//       .sort({ createdAt: -1 });
    
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Update order status
// router.put('/:id/status', authenticateToken, async (req, res) => {
//   try {
//     const { status } = req.body;
//     const order = await Order.findById(req.params.id);
    
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // Check permissions
//     if (req.user.role === 'staff' && order.assignedStaff?.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ error: 'Not authorized to update this order' });
//     }

//     order.status = status;
//     if (status === 'completed') {
//       order.completedAt = new Date();
//     }

//     await order.save();
//     await order.populate(['customer', 'items.menuItem', 'assignedStaff']);

//     // Emit real-time update
//     req.io.emit('order-updated', {
//       order: order,
//       message: `Order ${order.orderNumber} status updated to ${status}`
//     });

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get order by order number
// router.get('/track/:orderNumber', async (req, res) => {
//   try {
//     const order = await Order.findOne({ orderNumber: req.params.orderNumber })
//       .populate('items.menuItem', 'name price')
//       .populate('assignedStaff', 'name');
    
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;


import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Round-robin staff assignment
const assignOrderToStaff = async () => {
  const staff = await User.find({ role: 'staff', isActive: true }).sort({ lastOrderAssigned: 1 });
  if (!staff.length) return null;
  const assigned = staff[0];
  assigned.lastOrderAssigned = new Date();
  await assigned.save();
  return assigned._id;
};

// Create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, specialInstructions } = req.body;
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ error: `Menu item not available: ${item.menuItemId}` });
      }
      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    const assignedStaff = await assignOrderToStaff();
    const status = assignedStaff ? 'preparing' : 'pending';

    // ✅ Generate a unique orderNumber
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = new Order({
      orderNumber,
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      specialInstructions,
      assignedStaff,
      status
    });

    await order.save();
    await order.populate(['customer', 'items.menuItem', 'assignedStaff']);

    // Emit real-time events
    req.io.emit('new-order', { order, message: 'New order received' });
    if (assignedStaff) {
      req.io.to(`staff-${assignedStaff}`).emit('order-assigned', {
        order, message: 'Order assigned to you'
      });
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('items.menuItem', 'name price')
    .populate('assignedStaff', 'name')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// Admin: all orders
router.get('/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const orders = await Order.find()
    .populate('customer', 'name email')
    .populate('items.menuItem', 'name price')
    .populate('assignedStaff', 'name')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// Staff: assigned orders
router.get('/staff-orders', authenticateToken, authorizeRoles('staff'), async (req, res) => {
  const orders = await Order.find({
      assignedStaff: req.user._id,
      status: { $in: ['preparing', 'ready'] }
    })
    .populate('customer', 'name')
    .populate('items.menuItem', 'name price preparationTime')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// Update status
router.put('/:id/status', authenticateToken, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (req.user.role === 'staff' && String(order.assignedStaff) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to update this order' });
  }

  order.status = req.body.status;
  if (order.status === 'completed') order.completedAt = new Date();
  await order.save();
  await order.populate(['customer', 'items.menuItem', 'assignedStaff']);

  req.io.emit('order-updated', {
    order,
    message: `Order ${order._id} status updated to ${order.status}`
  });

  res.json(order);
});

// Cancel order within 5 minutes
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (['cancelled', 'completed', 'billed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }
    const now = new Date();
    const created = new Date(order.createdAt);
    const diffMs = now - created;
    if (diffMs > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Order can only be cancelled within 5 minutes of placement' });
    }
    order.status = 'cancelled';
    await order.save();
    await order.populate(['customer', 'items.menuItem', 'assignedStaff']);
    req.io.emit('order-updated', {
      order,
      message: `Order ${order.orderNumber} was cancelled`
    });
    res.json(order);
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Track by order number
router.get('/track/:orderNumber', async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .populate('items.menuItem', 'name price')
    .populate('assignedStaff', 'name');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Mark orders as billed (move to history)
router.post('/mark-billed', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ error: 'orderIds must be a non-empty array' });
  }
  try {
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status: 'billed' } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error marking orders as billed:', err);
    res.status(500).json({ error: 'Failed to mark orders as billed' });
  }
});

// Get all billed orders (order history)
router.get('/billed', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const billedOrders = await Order.find({ status: 'billed' })
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price')
      .populate('assignedStaff', 'name')
      .sort({ createdAt: -1 });
    res.json(billedOrders);
  } catch (err) {
    console.error('Error fetching billed orders:', err);
    res.status(500).json({ error: 'Failed to fetch billed orders' });
  }
});

// Delete all billed and cancelled orders (admin only)
// This will clear both Total Order History and all cancelled orders from Order Management
router.delete('/billed', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Delete all orders with status 'billed' or 'cancelled'
    const result = await Order.deleteMany({ status: { $in: ['billed', 'cancelled'] } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete billed/cancelled orders' });
  }
});

export default router;