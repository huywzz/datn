import { createFileRoute } from '@tanstack/react-router'
import { CohortRegistrationManagement } from '@/features/admin/components/cohort-registration-management'

export const Route = createFileRoute('/_authenticated/admin/cohort-schedule')({
  component: CohortRegistrationManagement,
})
