import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000';

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const newSocket = io(`${API_BASE_URL}`)
      
      newSocket.on('connect', () => {
        console.log('Connected to server')
        newSocket.emit('join-room', `${user.role}-${user.id}`)
      })

      newSocket.on('new-order', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'new-order',
          message: data.message,
          order: data.order,
          timestamp: new Date()
        }])
      })

      newSocket.on('order-assigned', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'order-assigned',
          message: data.message,
          order: data.order,
          timestamp: new Date()
        }])
      })

      newSocket.on('order-updated', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'order-updated',
          message: data.message,
          order: data.order,
          timestamp: new Date()
        }])
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const value = {
    socket,
    notifications,
    removeNotification,
    clearAllNotifications
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}