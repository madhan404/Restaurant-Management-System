import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  InputAdornment,
  Autocomplete
} from '@mui/material'
import {
  TrendingUp,
  People,
  Restaurant,
  AttachMoney,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import axios from 'axios'
import Navbar from '../components/Navbar'
import OrderStatusChip from '../components/OrderStatusChip'
import { useSocket } from '../context/SocketContext'
import jsPDF from 'jspdf';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0)
  const [orders, setOrders] = useState([])
  const [billedOrders, setBilledOrders] = useState([])
  const [users, setUsers] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeStaff: 0,
    pendingOrders: 0
  })
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' })
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main-course',
    image: '',
    preparationTime: ''
  })
  const [orderSearch, setOrderSearch] = useState('')
  const [completedOrderSearch, setCompletedOrderSearch] = useState('')
  const [historyOrderSearch, setHistoryOrderSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [menuSearch, setMenuSearch] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [selectedCompletedOrderIds, setSelectedCompletedOrderIds] = useState([])
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const { notifications } = useSocket()
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: ''
  })
  const [userLoading, setUserLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders()
    fetchUsers()
    fetchMenuItems()
    fetchBilledOrders()
  }, [])

  useEffect(() => {
    if (notifications.length > 0) {
      fetchOrders()
    }
  }, [notifications])

  // Update stats when billedOrders changes
  useEffect(() => {
    const totalRevenue = Array.isArray(billedOrders)
      ? billedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      : 0;
    setStats(prev => ({
      ...prev,
      totalRevenue
    }));
  }, [billedOrders]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/all`)
      let ordersArray = []
      if (Array.isArray(response.data)) {
        ordersArray = response.data
      } else if (Array.isArray(response.data.orders)) {
        ordersArray = response.data.orders
      } else {
        ordersArray = []
      }
      setOrders(ordersArray)
      calculateStats(ordersArray)
      console.log('Fetched Orders:', ordersArray)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      calculateStats([])
      setAlert({
        show: true,
        message: 'Failed to fetch orders',
        severity: 'error'
      })
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`)
      if (Array.isArray(response.data)) {
        setUsers(response.data)
      } else if (Array.isArray(response.data.users)) {
        setUsers(response.data.users)
      } else {
        setUsers([])
      }
      console.log('Fetched Users:', response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      setAlert({
        show: true,
        message: 'Failed to fetch users',
        severity: 'error'
      })
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/menu`)
      if (Array.isArray(response.data)) {
        setMenuItems(response.data)
      } else if (Array.isArray(response.data.menuItems)) {
        setMenuItems(response.data.menuItems)
      } else {
        setMenuItems([])
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setMenuItems([])
      setAlert({
        show: true,
        message: 'Failed to fetch menu items',
        severity: 'error'
      })
    }
  }

  const fetchBilledOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/billed`, { withCredentials: true })
      if (Array.isArray(response.data)) {
        setBilledOrders(response.data)
      } else if (Array.isArray(response.data.orders)) {
        setBilledOrders(response.data.orders)
      } else {
        setBilledOrders([])
      }
    } catch (error) {
      console.error('Error fetching billed orders:', error)
      setBilledOrders([])
    }
  }

  const calculateStats = (ordersData) => {
    if (!Array.isArray(ordersData)) ordersData = []
    const activeStaff = users.filter(user => user.role === 'staff' && (user.isActive || user.active)).length
    const totalOrders = ordersData.length
    // totalRevenue is now handled by billedOrders effect
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length

    setStats(prev => ({
      ...prev,
      totalOrders,
      activeStaff,
      pendingOrders
    }))
  }

  const handleMenuSubmit = async () => {
    try {
      const data = {
        ...menuFormData,
        price: parseFloat(menuFormData.price),
        preparationTime: parseInt(menuFormData.preparationTime)
      }

      if (editingMenuItem) {
        await axios.put(`${API_BASE_URL}/api/menu/${editingMenuItem._id}`, data)
        setAlert({
          show: true,
          message: 'Menu item updated successfully',
          severity: 'success'
        })
      } else {
        await axios.post(`${API_BASE_URL}/api/menu`, data)
        setAlert({
          show: true,
          message: 'Menu item created successfully',
          severity: 'success'
        })
      }

      setMenuDialogOpen(false)
      setEditingMenuItem(null)
      setMenuFormData({
        name: '',
        description: '',
        price: '',
        category: 'main-course',
        image: '',
        preparationTime: ''
      })
      fetchMenuItems()
    } catch (error) {
      console.error('Error saving menu item:', error)
      setAlert({
        show: true,
        message: error.response?.data?.error || 'Failed to save menu item',
        severity: 'error'
      })
    }
  }

  const handleEditMenuItem = (item) => {
    setEditingMenuItem(item)
    setMenuFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price != null ? item.price.toString() : '',
      category: item.category || 'main-course',
      image: item.image || '',
      preparationTime: item.preparationTime != null ? item.preparationTime.toString() : ''
    })
    setMenuDialogOpen(true)
  }

  const handleDeleteMenuItem = async (itemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/menu/${itemId}`)
      setAlert({
        show: true,
        message: 'Menu item deleted successfully',
        severity: 'success'
      })
      fetchMenuItems()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      setAlert({
        show: true,
        message: error.response?.data?.error || 'Failed to delete menu item',
        severity: 'error'
      })
    }
  }

  const generateBillPDF = (order) => {
    try {
      const doc = new jsPDF();
      const orderNumber = order.orderNumber || `ORD-${order._id?.slice(-6) || Math.floor(Math.random() * 1000000)}`;

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('The Great Indian Restaurant', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('123 Main Street, Chennai, India', 105, 22, { align: 'center' });
      doc.setTextColor(0);

      // Bill Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Restaurant Bill', 105, 38, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for dining with us!', 105, 45, { align: 'center' });

      let y = 55;
      doc.setFontSize(13);
      doc.text(`Order Number:`, 15, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${orderNumber}`, 55, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      doc.text(`Customer Name:`, 15, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${order.customerName || order.customer?.name || 'N/A'}`, 55, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      doc.text(`Date:`, 15, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${new Date(order.createdAt).toLocaleString()}`, 55, y);
      doc.setFont('helvetica', 'normal');
      y += 12;

      // Table Header
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(230, 230, 250);
      doc.rect(15, y - 6, 180, 10, 'F');
      doc.text('Qty', 20, y);
      doc.text('Item', 50, y);
      doc.text('Rate', 120, y, { align: 'right' });
      doc.text('Total', 180, y, { align: 'right' });
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setLineWidth(0.1);
      doc.line(15, y, 195, y);
      y += 4;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const name = item.menuItem?.name || item.name || 'Unnamed Item';
          const price = item.menuItem?.price || item.price || 0;
          const total = price * item.quantity;
          doc.text(`${item.quantity}`, 20, y);
          doc.text(`${name}`, 50, y);
          doc.text(`₹${price.toFixed(2)}`, 120, y, { align: 'right' });
          doc.text(`₹${total.toFixed(2)}`, 180, y, { align: 'right' });
          y += 7;
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
        });
      }

      y += 4;
      doc.setLineWidth(0.1);
      doc.line(15, y, 195, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Grand Total:', 120, y, { align: 'right' });
      doc.text(`₹${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}`, 180, y, { align: 'right' });
      y += 16;

      if (order.specialInstructions) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text('Special Instructions:', 15, y);
        y += 6;
        doc.setFont('helvetica', 'italic');
        doc.text(order.specialInstructions, 15, y, { maxWidth: 180 });
        y += 10;
      }

      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(13);
      doc.text('We hope to see you again soon!', 105, 285, { align: 'center' });

      doc.save(`Bill_Order_${orderNumber}.pdf`);
    } catch (error) {
      console.error('Error generating single bill PDF:', error);
      setAlert({
        show: true,
        message: 'Failed to generate bill PDF',
        severity: 'error'
      });
    }
  };

  const generateCombinedBillPDF = (orders) => {
    if (!orders.length) {
      setAlert({
        show: true,
        message: 'No orders found for the provided email',
        severity: 'warning'
      });
      return;
    }
    try {
      const doc = new jsPDF();
      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('The Great Indian Restaurant', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('123 Main Street, Chennai, India', 105, 22, { align: 'center' });
      doc.setTextColor(0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Combined Bill', 105, 38, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for dining with us!', 105, 45, { align: 'center' });

      let y = 55;
      let grandTotal = 0;
      orders.forEach((order, idx) => {
        const orderNumber = order.orderNumber || `ORD-${order._id?.slice(-6) || Math.floor(Math.random() * 1000000)}`;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order #${idx + 1}: ${orderNumber}`, 15, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
        doc.text(`Customer: ${order.customerName || order.customer?.name || 'N/A'}`, 15, y);
        y += 7;
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 15, y);
        y += 7;
        // Table Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setFillColor(230, 230, 250);
        doc.rect(15, y - 5, 180, 8, 'F');
        doc.text('Qty', 20, y);
        doc.text('Item', 50, y);
        doc.text('Rate', 120, y, { align: 'right' });
        doc.text('Total', 180, y, { align: 'right' });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setLineWidth(0.1);
        doc.line(15, y, 195, y);
        y += 3;
        let orderTotal = 0;
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.menuItem?.name || item.name || 'Unnamed Item';
            const price = item.menuItem?.price || item.price || 0;
            const total = price * item.quantity;
            doc.text(`${item.quantity}`, 20, y);
            doc.text(`${name}`, 50, y);
            doc.text(`₹${price.toFixed(2)}`, 120, y, { align: 'right' });
            doc.text(`₹${total.toFixed(2)}`, 180, y, { align: 'right' });
            y += 6;
            orderTotal += total;
            if (y > 260) {
              doc.addPage();
              y = 20;
            }
          });
        }
        y += 3;
        doc.setLineWidth(0.1);
        doc.line(15, y, 195, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Order Total:', 120, y, { align: 'right' });
        doc.text(`₹${orderTotal.toFixed(2)}`, 180, y, { align: 'right' });
        grandTotal += orderTotal;
        y += 10;
        if (order.specialInstructions) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(11);
          doc.text('Special Instructions:', 15, y);
          y += 5;
          doc.text(order.specialInstructions, 15, y, { maxWidth: 180 });
          y += 8;
        }
        y += 4;
        if (y > 250 && idx < orders.length - 1) {
          doc.addPage();
          y = 20;
        }
      });
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('-----------------------------------------', 105, y, { align: 'center' });
      y += 8;
      doc.text('GRAND TOTAL:', 120, y, { align: 'right' });
      doc.text(`₹${grandTotal.toFixed(2)}`, 180, y, { align: 'right' });
      y += 16;
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(13);
      doc.text('We hope to see you again soon!', 105, 285, { align: 'center' });
      doc.save('Combined_Bill.pdf');
    } catch (error) {
      console.error('Error generating combined bill PDF:', error);
      setAlert({
        show: true,
        message: 'Failed to generate combined bill PDF',
        severity: 'error'
      });
    }
  };

  const handleGenerateBill = () => {
    setEmailDialogOpen(true);
  };

  const handleEmailSubmit = async () => {
    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setAlert({
        show: true,
        message: 'Please enter a valid email address',
        severity: 'warning'
      });
      return;
    }

    const userOrders = orders.filter(order =>
      order.status === 'completed' &&
      (order.customerEmail?.toLowerCase() === emailInput.toLowerCase() ||
        order.customer?.email?.toLowerCase() === emailInput.toLowerCase())
    );

    if (userOrders.length === 0) {
      setAlert({
        show: true,
        message: `No completed orders found for ${emailInput}`,
        severity: 'warning'
      });
    } else {
      generateCombinedBillPDF(userOrders);
      // Mark these orders as billed in the backend
      try {
        await axios.post(`${API_BASE_URL}/api/orders/mark-billed`, {
          orderIds: userOrders.map(order => order._id)
        }, { withCredentials: true });
        setAlert({
          show: true,
          message: `Bill generated successfully for ${emailInput}. Orders moved to Total Order History.`,
          severity: 'success'
        });
        // Refresh orders and billed orders from backend
        fetchOrders();
        fetchBilledOrders();
      } catch (err) {
        setAlert({
          show: true,
          message: 'Failed to mark orders as billed',
          severity: 'error'
        });
      }
    }

    setEmailDialogOpen(false);
    setEmailInput('');
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
      await axios.put(`${API_BASE_URL}/api/orders/${orderToCancel.id}/cancel`, {}, { withCredentials: true });
      setAlert({ show: true, message: 'Order cancelled successfully', severity: 'success' });
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      fetchOrders();
    } catch (err) {
      setAlert({ show: true, message: err.response?.data?.error || 'Failed to cancel order', severity: 'error' });
    }
  };

  const orderColumns = [
    { field: 'orderNumber', headerName: 'Order #', width: 120 },
    { field: 'customerName', headerName: 'Customer', width: 150 },
    { field: 'customerEmail', headerName: 'Customer Email', width: 200 },
    { field: 'totalAmount', headerName: 'Amount', width: 100, renderCell: (params) => `₹${params.value.toFixed(2)}` },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => <OrderStatusChip status={params.value} /> },
    { field: 'createdAt', headerName: 'Order Time', width: 180, renderCell: (params) => new Date(params.value).toLocaleString() },
    { field: 'assignedStaff', headerName: 'Assigned Staff', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => {
        const order = params.row;
        return canCancelOrder(order) ? (
          <Button
            color="error"
            size="small"
            onClick={() => {
              setOrderToCancel(order);
              setCancelDialogOpen(true);
            }}
          >
            Cancel
          </Button>
        ) : null;
      }
    }
  ]

  const orderRows = Array.isArray(orders) ? orders
    .filter(order => order.status !== 'completed' && order.status !== 'billed')
    .map(order => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || order.customerName,
      customerEmail: order.customer?.email || order.customerEmail || '',
      totalAmount: order.totalAmount || 0,
      status: order.status,
      createdAt: order.createdAt,
      assignedStaff: order.assignedStaff?.name || 'Unassigned',
      items: order.items,
      specialInstructions: order.specialInstructions,
      customer: order.customer
    })) : [];

  const filteredOrderRows = orderRows.filter(row => {
    const q = orderSearch.toLowerCase();
    return (
      row.orderNumber?.toString().toLowerCase().includes(q) ||
      row.customerName?.toLowerCase().includes(q) ||
      row.customerEmail?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q) ||
      row.assignedStaff?.toLowerCase().includes(q)
    );
  });

  const completedOrderRows = Array.isArray(orders) ? orders
    .filter(order => order.status === 'completed')
    .filter(order => order.status !== 'billed')
    .map(order => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || order.customerName,
      customerEmail: order.customer?.email || order.customerEmail || '',
      totalAmount: order.totalAmount || 0,
      status: order.status,
      createdAt: order.createdAt,
      assignedStaff: order.assignedStaff?.name || 'Unassigned',
      items: order.items,
      specialInstructions: order.specialInstructions,
      customer: order.customer
    })) : [];

  const filteredCompletedOrderRows = completedOrderRows.filter(row => {
    const q = completedOrderSearch.toLowerCase();
    return (
      row.orderNumber?.toString().toLowerCase().includes(q) ||
      row.customerName?.toLowerCase().includes(q) ||
      row.customerEmail?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q) ||
      row.assignedStaff?.toLowerCase().includes(q)
    );
  });

  const historyOrderRows = Array.isArray(billedOrders) ? billedOrders
    .map(order => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || order.customerName,
      customerEmail: order.customer?.email || order.customerEmail || '',
      totalAmount: order.totalAmount || 0,
      status: order.status,
      createdAt: order.createdAt,
      assignedStaff: order.assignedStaff?.name || 'Unassigned',
      items: order.items,
      specialInstructions: order.specialInstructions,
      customer: order.customer
    })) : [];

  const filteredHistoryOrderRows = historyOrderRows.filter(row => {
    const q = historyOrderSearch.toLowerCase();
    return (
      row.orderNumber?.toString().toLowerCase().includes(q) ||
      row.customerName?.toLowerCase().includes(q) ||
      row.customerEmail?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q) ||
      row.assignedStaff?.toLowerCase().includes(q)
    );
  });

  const userColumns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'role', headerName: 'Role', width: 100 },
    { field: 'isActive', headerName: 'Status', width: 100, renderCell: (params) => params.value ? 'Active' : 'Inactive' },
    { field: 'createdAt', headerName: 'Joined', width: 150, renderCell: (params) => new Date(params.value).toLocaleDateString() },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => {
        return (
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteUser(params.row.id)}
          >
            Delete
          </Button>
        )
      }
    }
  ]

  const userRows = Array.isArray(users) ? users.map(user => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  })) : []

  const filteredUserRows = userRows.filter(row => {
    const q = userSearch.toLowerCase();
    return (
      row.name?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) ||
      row.role?.toLowerCase().includes(q)
    );
  });

  const menuColumns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'price', headerName: 'Price', width: 100, renderCell: (params) => `₹${params.value.toFixed(2)}` },
    { field: 'preparationTime', headerName: 'Prep Time', width: 100 },
    { field: 'actions', headerName: 'Actions', width: 200 }
  ]

  const menuRows = Array.isArray(menuItems) ? menuItems.map(item => ({
    id: item._id,
    name: item.name,
    category: item.category,
    price: item.price,
    preparationTime: item.preparationTime,
    image: item.image
  })) : []

  const filteredMenuItems = (Array.isArray(menuItems) ? menuItems : []).filter(item => {
    const q = menuSearch.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  const handleAddUser = async () => {
    setUserLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users`, newUser);
      setAlert({ show: true, message: 'User added successfully', severity: 'success' });
      setUserDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'customer', phone: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      setAlert({ show: true, message: error.response?.data?.error || 'Failed to add user', severity: 'error' });
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      setAlert({ show: true, message: 'User deleted successfully', severity: 'success' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlert({ show: true, message: error.response?.data?.error || 'Failed to delete user', severity: 'error' });
    }
  };

  const customerEmails = [...new Set(users.filter(u => u.role === 'customer').map(u => u.email).filter(Boolean))];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar title="Admin Dashboard" />
      
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

        <Grid container columns={12} spacing={3} sx={{ mb: 4 }}>
          <Grid gridColumn="span 3">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalOrders}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid gridColumn="span 3">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.totalRevenue.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid gridColumn="span 3">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Staff
                    </Typography>
                    <Typography variant="h4">
                      {stats.activeStaff}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid gridColumn="span 3">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Restaurant color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.pendingOrders}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Orders Management" />
            <Tab label="Users Management" />
            <Tab label="Menu Management" />
            <Tab label="Completed Orders" />
            <Tab label="Total Order History" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  All Orders
                </Typography>
                <TextField
                  label="Search Orders"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredOrderRows}
                    columns={orderColumns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                    disableSelectionOnClick
                    selectionModel={selectedOrderIds}
                    onSelectionModelChange={ids => {
                      console.log('Order selection changed, ids:', ids);
                      setSelectedOrderIds(Array.isArray(ids) ? ids.map(String) : []);
                    }}
                    getRowId={row => String(row.id)}
                  />
                </div>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  User Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  sx={{ mb: 2, ml: 2 }}
                  onClick={() => setUserDialogOpen(true)}
                >
                  Add User
                </Button>
                <TextField
                  label="Search Users"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredUserRows}
                    columns={userColumns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                    disableSelectionOnClick
                  />
                </div>
                <MuiDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="xs" fullWidth>
                  <MuiDialogTitle>Add New User</MuiDialogTitle>
                  <MuiDialogContent>
                    <TextField
                      label="Name"
                      fullWidth
                      margin="normal"
                      value={newUser.name}
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    />
                    <TextField
                      label="Email"
                      fullWidth
                      margin="normal"
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      margin="normal"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <TextField
                      label="Phone"
                      fullWidth
                      margin="normal"
                      value={newUser.phone}
                      onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={newUser.role}
                        label="Role"
                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="staff">Staff</MenuItem>
                        <MenuItem value="customer">Customer</MenuItem>
                      </Select>
                    </FormControl>
                  </MuiDialogContent>
                  <MuiDialogActions>
                    <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} variant="contained" disabled={userLoading}>
                      {userLoading ? 'Adding...' : 'Add User'}
                    </Button>
                  </MuiDialogActions>
                </MuiDialog>
              </Box>
            )}

            {tabValue === 2 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Menu Management
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setMenuDialogOpen(true)}
                  >
                    Add Menu Item
                  </Button>
                </Box>
                <TextField
                  label="Search Menu"
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Prep Time</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMenuItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>₹{item.price.toFixed(2)}</TableCell>
                          <TableCell>{item.preparationTime} min</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditMenuItem(item)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteMenuItem(item._id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Completed Orders
                </Typography>
                <TextField
                  label="Search Completed Orders"
                  value={completedOrderSearch}
                  onChange={e => setCompletedOrderSearch(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mb: 2, ml: 2 }}
                  onClick={handleGenerateBill}
                >
                  Generate Bill for User
                </Button>
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredCompletedOrderRows}
                    columns={orderColumns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                    disableSelectionOnClick
                    getRowId={(row) => String(row.id)}
                    selectionModel={selectedCompletedOrderIds}
                    onSelectionModelChange={(ids) => {
                      console.log('Completed order selection changed, ids:', ids);
                      setSelectedCompletedOrderIds(Array.isArray(ids) ? ids.map(String) : []);
                    }}
                  />
                </div>
                <MuiDialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="xs" fullWidth>
                  <MuiDialogTitle>Generate Bill</MuiDialogTitle>
                  <MuiDialogContent>
                    <Autocomplete
                      freeSolo
                      options={customerEmails}
                      inputValue={emailInput}
                      onInputChange={(_, newValue) => setEmailInput(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          autoFocus
                          margin="dense"
                          label="Customer Email"
                          type="email"
                          fullWidth
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}
                    />
                  </MuiDialogContent>
                  <MuiDialogActions>
                    <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleEmailSubmit} variant="contained">
                      Generate
                    </Button>
                  </MuiDialogActions>
                </MuiDialog>
              </Box>
            )}

            {tabValue === 4 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Total Order History
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setClearDialogOpen(true)}
                  >
                    Start a New Day
                  </Button>
                </Box>
                <TextField
                  label="Search Order History"
                  value={historyOrderSearch}
                  onChange={e => setHistoryOrderSearch(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredHistoryOrderRows}
                    columns={orderColumns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    disableSelectionOnClick
                    getRowId={(row) => String(row.id)}
                  />
                </div>
                <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
                  <DialogTitle>Start a New Day</DialogTitle>
                  <DialogContent>
                    <Typography>Are you sure you want to clear all billed orders? This cannot be undone.</Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={async () => {
                      try {
                        await axios.delete(`${API_BASE_URL}/api/orders/billed`, { withCredentials: true });
                        setAlert({ show: true, message: 'All billed orders cleared!', severity: 'success' });
                        fetchBilledOrders();
                      } catch (err) {
                        setAlert({ show: true, message: 'Failed to clear billed orders', severity: 'error' });
                      }
                      setClearDialogOpen(false);
                    }}>
                      Yes, Clear
                    </Button>
                  </DialogActions>
                </Dialog>
              </Box>
            )}
          </Box>
        </Card>
      </Container>

      <Dialog open={menuDialogOpen} onClose={() => setMenuDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={menuFormData.name}
            onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={menuFormData.description}
            onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={menuFormData.price}
            onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={menuFormData.category}
              label="Category"
              onChange={(e) => setMenuFormData({ ...menuFormData, category: e.target.value })}
            >
              <MenuItem value="appetizer">Appetizer</MenuItem>
              <MenuItem value="main-course">Main Course</MenuItem>
              <MenuItem value="dessert">Dessert</MenuItem>
              <MenuItem value="beverage">Beverage</MenuItem>
              <MenuItem value="side-dish">Side Dish</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Image URL"
            fullWidth
            variant="outlined"
            value={menuFormData.image}
            onChange={(e) => setMenuFormData({ ...menuFormData, image: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Preparation Time (minutes)"
            type="number"
            fullWidth
            variant="outlined"
            value={menuFormData.preparationTime}
            onChange={(e) => setMenuFormData({ ...menuFormData, preparationTime: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMenuDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMenuSubmit} variant="contained">
            {editingMenuItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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
  )
}

export default AdminDashboard