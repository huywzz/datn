import { createFileRoute } from '@tanstack/react-router'
import { CourseDetailPage } from '@/features/courses'

export const Route = createFileRoute('/_authenticated/courses/$courseId')({
  component: CourseDetailPage,
})
