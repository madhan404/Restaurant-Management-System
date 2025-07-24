import React from 'react'
import { Chip } from '@mui/material'
import {
  Schedule,
  Restaurant,
  CheckCircle,
  Cancel,
  LocalShipping
} from '@mui/icons-material'

const OrderStatusChip = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'warning',
          icon: <Schedule />,
          label: 'Pending'
        }
      case 'preparing':
        return {
          color: 'info',
          icon: <Restaurant />,
          label: 'Preparing'
        }
      case 'ready':
        return {
          color: 'primary',
          icon: <LocalShipping />,
          label: 'Ready'
        }
      case 'completed':
        return {
          color: 'success',
          icon: <CheckCircle />,
          label: 'Completed'
        }
      case 'cancelled':
        return {
          color: 'error',
          icon: <Cancel />,
          label: 'Cancelled'
        }
      default:
        return {
          color: 'default',
          icon: <Schedule />,
          label: status
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="filled"
      size="small"
    />
  )
}

export default OrderStatusChip