import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCourseDetails, getCourseSections, getSemesters } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CourseDetailPage() {
  const { courseId } = useParams({ from: '/_authenticated/courses/$courseId' })
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | undefined>(undefined)

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseDetails(Number(courseId)),
  })

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => getSemesters(),
  })

  const {
    data: sectionsData,
    isLoading: isSectionsLoading,
    error: sectionsError,
  } = useQuery({
    queryKey: ['course-sections', courseId, page, limit, selectedSemesterId],
    queryFn: () =>
      getCourseSections(Number(courseId), {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        ...(selectedSemesterId && { semesterId: selectedSemesterId }),
      }),
    enabled: !!courseId,
  })

  const sections = sectionsData?.data || []
  const totalPages = sectionsData?.totalPages || 1
  const currentPage = sectionsData?.page || 1

  const handleRowClick = (sectionId: number) => {
    navigate({ 
      to: '/admin/sections/$sectionId/students', 
      params: { sectionId: String(sectionId) },
      search: { courseId: courseId }
    })
  }

  const handleSemesterChange = (value: string) => {
    setSelectedSemesterId(value === 'all' ? undefined : Number(value))
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Không thể tải thông tin môn học
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/courses' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Chi tiết môn học</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Thông tin môn học</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Mã môn học</div>
              <div className="text-lg font-semibold">{course.code}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Tên môn học</div>
              <div className="text-lg font-semibold">{course.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Số tín chỉ</div>
              <div className="text-lg font-semibold">{course.credits}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold">Danh sách lớp học phần</CardTitle>
            <div className="flex items-center gap-4">
              {sectionsData && (
                <div className="text-sm text-muted-foreground">
                  Tổng: {sectionsData.total} lớp học phần
                </div>
              )}
              <Select
                value={selectedSemesterId?.toString() || 'all'}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả học kỳ</SelectItem>
                  {semesters?.map((semester) => (
                    <SelectItem key={semester.semesterId} value={semester.semesterId.toString()}>
                      Học kỳ {semester.semesterId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isSectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sectionsError ? (
            <div className="text-center text-red-500 py-8">
              Không thể tải danh sách lớp học phần
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lớp HP</TableHead>
                    <TableHead>Lịch học</TableHead>
                    <TableHead>Sĩ số</TableHead>
                    <TableHead>Đã đăng ký</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections && sections.length > 0 ? (
                    sections.map((section) => (
                      <TableRow 
                        key={section.sectionId} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(section.sectionId)}
                      >
                        <TableCell className="font-medium">{section.sectionCode}</TableCell>
                        <TableCell>{section.schedule || 'Chưa có lịch'}</TableCell>
                        <TableCell>{section.maxStudents}</TableCell>
                        <TableCell>{section.currentStudents || 0}</TableCell>
                        <TableCell>
                          <Badge variant={section.status === 'open' ? 'default' : 'secondary'}>
                            {section.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        Chưa có lớp học phần nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1 || isSectionsLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          disabled={isSectionsLoading}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages || isSectionsLoading}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

