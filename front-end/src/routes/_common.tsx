import { createFileRoute } from '@tanstack/react-router'
import { CommonLayout } from '@/components/layout/common-layout'

export const Route = createFileRoute('/_common')({
  component: CommonLayout,
})
