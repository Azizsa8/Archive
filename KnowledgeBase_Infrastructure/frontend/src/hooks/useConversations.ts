import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ConversationListResponse } from '../types/conversation'

export function useConversations(params?: { page?: number; limit?: number }) {
  return useQuery<ConversationListResponse>({
    queryKey: ['conversations', params],
    queryFn: () => api.conversations.list(params),
  })
}
