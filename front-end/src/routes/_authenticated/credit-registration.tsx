import { createFileRoute } from '@tanstack/react-router'
import { CreditRegistration } from '@/features/credit-registration'

export const Route = createFileRoute('/_authenticated/credit-registration')({
  component: CreditRegistration,
})
