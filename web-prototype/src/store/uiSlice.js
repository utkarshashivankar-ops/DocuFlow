import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  darkMode: localStorage.getItem('docuflow_theme') === 'dark',
  sidebarOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode
      localStorage.setItem('docuflow_theme', state.darkMode ? 'dark' : 'light')
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    closeSidebar(state) {
      state.sidebarOpen = false
    },
  },
})

export const { toggleDarkMode, toggleSidebar, closeSidebar } = uiSlice.actions
export default uiSlice.reducer
