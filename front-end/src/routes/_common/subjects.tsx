import { createFileRoute } from '@tanstack/react-router'

function BlankPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            Trang này đang được phát triển
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground">
            Nội dung sẽ được thêm vào đây
          </p>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_common/subjects')({
  component: () => <BlankPage title="Quản lý môn học" />,
})