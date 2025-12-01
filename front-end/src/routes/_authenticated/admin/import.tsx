import { createFileRoute } from '@tanstack/react-router'
import { Admin } from '@/features/admin'

// Route: /admin/import
// Renders the Admin feature; the component will detect
// this pathname and auto-switch to the Import tab.
export const Route = createFileRoute('/_authenticated/admin/import')({
  component: Admin,
})
