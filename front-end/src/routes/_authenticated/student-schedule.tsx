import { createFileRoute } from '@tanstack/react-router'
import { StudentSchedule } from '@/features/student-schedule'

export const Route = createFileRoute('/_authenticated/student-schedule')({
  component: StudentSchedule,
})


