import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import notificationReducer from './notificationSlice'
import uiReducer from './uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    ui: uiReducer,
  },
})
