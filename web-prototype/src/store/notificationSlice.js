import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { unreadCount: 2, items: [] },
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload
      state.unreadCount = action.payload.filter((n) => !n.read).length
    },
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, read: true }))
      state.unreadCount = 0
    },
    clearAll(state) {
      state.items = []
      state.unreadCount = 0
    },
  },
})

export const { setNotifications, markAllRead, clearAll } = notificationSlice.actions
export default notificationSlice.reducer
