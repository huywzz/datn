import { createFileRoute } from '@tanstack/react-router'
import { CreateExchangeRequestPage } from '@/features/exchange-request/create-exchange-request'

export const Route = createFileRoute('/_authenticated/exchange-request/create')({
  component: CreateExchangeRequestPage,
})
