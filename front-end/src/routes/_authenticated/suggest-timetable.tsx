import { createFileRoute } from '@tanstack/react-router'
import { SuggestTimetable } from '@/features/suggest-timetable'

export const Route = createFileRoute('/_authenticated/suggest-timetable')({
  component: SuggestTimetable,
})
