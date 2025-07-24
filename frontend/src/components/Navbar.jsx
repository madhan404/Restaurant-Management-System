import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Avatar
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  ExitToApp,
  Restaurant
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const Navbar = ({ title }) => {
  const { user, logout } = useAuth()
  const { notifications, removeNotification, clearAllNotifications } = useSocket()
  const [anchorEl, setAnchorEl] = useState(null)
  const [notifAnchorEl, setNotifAnchorEl] = useState(null)

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleNotifications = (event) => {
    setNotifAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setNotifAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ff6b35'
      case 'staff': return '#4caf50'
      case 'customer': return '#2196f3'
      default: return '#757575'
    }
  }

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Restaurant sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Welcome, {user?.name}
          </Typography>
          
          <Avatar
            sx={{ 
              width: 24, 
              height: 24, 
              bgcolor: getRoleColor(user?.role),
              fontSize: '0.75rem'
            }}
          >
            {user?.role?.charAt(0).toUpperCase()}
          </Avatar>

          <IconButton
            color="inherit"
            onClick={handleNotifications}
            aria-label="notifications"
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleMenu}
            aria-label="account"
          >
            <AccountCircle />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>
            <AccountCircle sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleClose}
          PaperProps={{
            style: {
              maxHeight: 400,
              width: '300px',
            },
          }}
        >
          {notifications.length === 0 ? (
            <MenuItem disabled>No new notifications</MenuItem>
          ) : (
            [
              <MenuItem key="clear-all" onClick={clearAllNotifications}>
                <Typography variant="body2" color="primary">
                  Clear All
                </Typography>
              </MenuItem>,
              ...notifications.map((notif) => (
                <MenuItem
                  key={notif.id}
                  onClick={() => removeNotification(notif.id)}
                  sx={{ whiteSpace: 'normal', py: 1 }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {notif.message}
                    </Typography>
                    {notif.order && (
                      <Typography variant="caption" color="text.secondary">
                        Order: {notif.order.orderNumber}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {notif.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ]
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar