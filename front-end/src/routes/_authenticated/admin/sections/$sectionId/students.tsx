import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SectionStudentsPage } from '@/features/admin/components/section-students-page'

const studentsSearchSchema = z.object({
  courseId: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/admin/sections/$sectionId/students')({
  validateSearch: studentsSearchSchema,
  component: SectionStudentsPage,
})
