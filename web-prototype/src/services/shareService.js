export const shareService = {
  async generateLink(documentId) {
    await new Promise((r) => setTimeout(r, 500))
    return { url: `${window.location.origin}/share/${documentId}-${Math.random().toString(36).slice(2, 10)}` }
  },
}
