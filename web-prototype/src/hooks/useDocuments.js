import { useQuery } from '@tanstack/react-query'
import { documentService } from '@/services/documentService'

export function useDocuments() {
  return useQuery({ queryKey: ['documents'], queryFn: documentService.list })
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentService.get(id),
    enabled: !!id,
  })
}

export function useDashboardStats() {
  return useQuery({ queryKey: ['stats'], queryFn: documentService.stats })
}

export function useExpiryChart() {
  return useQuery({ queryKey: ['expiry-chart'], queryFn: documentService.expiryChart })
}
