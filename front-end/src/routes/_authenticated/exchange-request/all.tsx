import { createFileRoute } from '@tanstack/react-router'
import { AllExchangeRequestsPage } from '@/features/exchange-request/all-exchange-requests'

export const Route = createFileRoute('/_authenticated/exchange-request/all')({
  component: AllExchangeRequestsPage,
})
