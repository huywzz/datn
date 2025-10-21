import { createFileRoute } from '@tanstack/react-router'
import { CreditRegistration } from '@/features/credit-registration'

// Route: /credit-registration-schedule
// Renders the same CreditRegistration feature; the component will detect
// this pathname and auto-switch to the Schedule tab.
export const Route = createFileRoute('/_authenticated/credit-registration-schedule')({
  component: CreditRegistration,
})


