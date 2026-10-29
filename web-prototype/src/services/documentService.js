import { mockDocuments, dashboardStats, expiryChartData } from './mockData'

// Mocked document service — swap internals for real axios calls to /api/documents
export const documentService = {
  async list() {
    await new Promise((r) => setTimeout(r, 400))
    return mockDocuments
  },
  async get(id) {
    await new Promise((r) => setTimeout(r, 300))
    return mockDocuments.find((d) => d.id === id)
  },
  async remove(id) {
    await new Promise((r) => setTimeout(r, 300))
    return { success: true, id }
  },
  async upload(_file) {
    // Simulated OCR + CNN pipeline result
    await new Promise((r) => setTimeout(r, 400))
    return {
      documentType: 'Insurance Policy',
      name: 'Aarav Sharma',
      documentNumber: 'HI-90231',
      issueDate: '2025-06-01',
      expiryDate: '2027-06-01',
    }
  },
  async stats() {
    await new Promise((r) => setTimeout(r, 250))
    return dashboardStats
  },
  async expiryChart() {
    await new Promise((r) => setTimeout(r, 250))
    return expiryChartData
  },
}
