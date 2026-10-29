import { mockNotifications } from './mockData'

export const notificationService = {
  async list() {
    await new Promise((r) => setTimeout(r, 300))
    return mockNotifications
  },
}
