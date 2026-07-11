import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DocumentListResponse } from '../types/document'

export function useDocuments(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery<DocumentListResponse>({
    queryKey: ['documents', params],
    queryFn: () => api.documents.list(params),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.documents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
