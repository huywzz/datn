import { createFileRoute } from '@tanstack/react-router'
import { ExchangeRequest } from '@/features/exchange-request'

export const Route = createFileRoute('/_authenticated/exchange-request')({
  component: ExchangeRequest,
})