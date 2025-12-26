import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import {
  getSectionStudents,
  deleteRegistration,
  getCohorts,
  searchStudents,
  registerSection,
  getCourseSectionDetail,
} from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { StudentInfo, PaginatedSectionStudentsData } from '@/lib/interface'

export function SectionStudentsPage() {
  const { sectionId } = useParams({ from: '/_authenticated/admin/sections/$sectionId/students' })
  const search = useSearch({ from: '/_authenticated/admin/sections/$sectionId/students' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const courseId = search?.courseId
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput])

  const {
    data: studentsData,
    isLoading,
    error,
    isFetching,
  } = useQuery<PaginatedSectionStudentsData>({
    queryKey: ['section-students', sectionId, page, limit, debouncedSearch],
    queryFn: () =>
      getSectionStudents(Number(sectionId), {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
    placeholderData: keepPreviousData,
  })

  const students = studentsData?.data || []
  const totalPages = studentsData?.totalPages || 1
  const currentPage = studentsData?.page || 1

  const {
    data: sectionInfo,
    isLoading: isSectionInfoLoading,
    error: sectionInfoError,
  } = useQuery({
    queryKey: ['course-section-detail', sectionId],
    queryFn: () => getCourseSectionDetail(Number(sectionId)),
  })

  const deleteMutation = useMutation({
    mutationFn: (registrationId: number) => deleteRegistration(registrationId),
    onSuccess: () => {
      toast.success('Đã xóa sinh viên khỏi lớp học phần')
      queryClient.invalidateQueries({ queryKey: ['section-students', sectionId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể xóa sinh viên')
    },
  })

  const handleDelete = (registrationId: number) => {
    deleteMutation.mutate(registrationId)
  }

  const initialLoading = isLoading && !studentsData

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Không thể tải danh sách sinh viên
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (courseId) {
              navigate({ to: '/courses/$courseId', params: { courseId } })
            } else {
              navigate({ to: '/courses' })
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Danh sách sinh viên lớp học phần</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl font-bold">Thông tin lớp học phần</CardTitle>
            <CardDescription>Chi tiết cơ bản của lớp học phần hiện tại.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isSectionInfoLoading ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Đang tải thông tin lớp học phần...</p>
            </div>
          ) : sectionInfo ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Môn học</p>
                <p className="font-medium">
                  {sectionInfo.course?.name || 'Chưa cập nhật'}
                  {sectionInfo.course?.code ? ` (${sectionInfo.course.code})` : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mã lớp học phần</p>
                <p className="font-medium">{sectionInfo.sectionCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giảng viên</p>
                <p className="font-medium">{sectionInfo.instructor?.fullName || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sĩ số</p>
                <p className="font-medium">
                  {sectionInfo.currentStudents ?? 0}/{sectionInfo.maxStudents}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge variant="outline" className="font-medium uppercase">
                  {sectionInfo.status || 'unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Học kỳ</p>
                <p className="font-medium">{sectionInfo.semesterId ? `HK ${sectionInfo.semesterId}` : 'Chưa cập nhật'}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">Thời khóa biểu</p>
                <p className="font-medium">
                  {sectionInfo.schedule ||
                    (sectionInfo.classSchedules && sectionInfo.classSchedules.length > 0
                      ? sectionInfo.classSchedules
                          .map(
                            (schedule) =>
                              `Thứ ${schedule.dayOfWeek} (${schedule.startPeriod}-${schedule.endPeriod}) - ${schedule.room}`
                          )
                          .join('; ')
                      : 'Chưa cập nhật')}
                </p>
              </div>
            </div>
          ) : sectionInfoError ? (
            <p className="text-sm text-destructive">
              {(sectionInfoError as Error).message || 'Không thể tải thông tin lớp học phần.'}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold">
                Sinh viên đã đăng ký ({studentsData?.total || students?.length || 0})
              </CardTitle>
              {studentsData && (
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center gap-4 md:justify-end">
              <div className="relative max-w-xs flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc mã sinh viên..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="pl-10"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <AddStudentDialog
                sectionId={Number(sectionId)}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['section-students', sectionId] })
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Ngành</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead>Học kỳ</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.registrationId}>
                    <TableCell className="font-medium">{student.studentCode}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>
                      {student.classCode ? (
                        <Badge variant="outline">{student.classCode}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {student.major ? (
                        <Badge variant="secondary">{student.major.toUpperCase()}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {student.yearOfStudy ? `Năm ${student.yearOfStudy}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">HK {student.semester}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(student.registeredAt), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa sinh viên <strong>{student.fullName}</strong> ({student.studentCode}) khỏi lớp học phần này?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(student.registrationId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                    {debouncedSearch
                      ? 'Không tìm thấy sinh viên phù hợp với từ khóa.'
                      : 'Chưa có sinh viên nào đăng ký lớp học phần này'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {isFetching && studentsData ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : null}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {students.length} / {studentsData?.total || 0} sinh viên
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
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
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface AddStudentDialogProps {
  sectionId: number
  onSuccess: () => void
}

function AddStudentDialog({ sectionId, onSuccess }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)

  const { data: cohorts, isLoading: isCohortsLoading } = useQuery({
    queryKey: ['cohorts'],
    queryFn: getCohorts,
    enabled: open,
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed.length >= 2) {
        setDebouncedSearch(trimmed)
      } else {
        setDebouncedSearch('')
      }
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput])

  const {
    data: studentsSearchData,
    isFetching: isSearching,
    isError: isSearchError,
    error: searchError,
  } = useQuery<StudentInfo[]>({
    queryKey: ['students-search', selectedCohort, debouncedSearch],
    queryFn: () =>
      searchStudents({
        cohortId: selectedCohort,
        search: debouncedSearch,
      }),
    enabled: Boolean(open && selectedCohort && debouncedSearch.length >= 2),
  })
  const studentResults = useMemo(() => (studentsSearchData ?? []) as StudentInfo[], [studentsSearchData])
  const dropdownRows = useMemo(() => {
    return studentResults.map((student) => {
      const currentId = student.id ?? student.studentId ?? student.studentCode
      const selectedId =
        selectedStudent?.id ?? selectedStudent?.studentId ?? selectedStudent?.studentCode
      const isSelected = selectedId === currentId

      return (
        <TableRow
          key={currentId}
          className="cursor-pointer hover:bg-muted data-[selected=true]:bg-muted"
          data-selected={isSelected || undefined}
          onClick={() => {
            setSelectedStudent(student)
            setSearchInput('')
            setDebouncedSearch('')
          }}
        >
          <TableCell>{student.studentCode}</TableCell>
          <TableCell>{student.fullName}</TableCell>
          <TableCell>{student.classCode || '-'}</TableCell>
          <TableCell>{student.major?.toUpperCase() || '-'}</TableCell>
          <TableCell className="text-right text-sm font-semibold">
            {isSelected ? 'Đã chọn' : 'Chọn'}
          </TableCell>
        </TableRow>
      )
    })
  }, [studentResults, selectedStudent])

  const resetState = () => {
    setSelectedStudent(null)
    setSearchInput('')
    setDebouncedSearch('')
    setSelectedCohort('')
  }

  const handleDialogChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

  const addMutation = useMutation({
    mutationFn: (studentId: number) => registerSection(sectionId, studentId),
    onSuccess: () => {
      toast.success('Đã thêm sinh viên vào lớp học phần')
      onSuccess()
      handleDialogChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể thêm sinh viên')
    },
  })

  const handleAddStudent = () => {
    const studentId = selectedStudent?.id ?? selectedStudent?.studentId
    if (!studentId) {
      toast.error('Vui lòng chọn sinh viên cần thêm')
      return
    }
    addMutation.mutate(studentId)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button>Thêm sinh viên</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Thêm sinh viên vào lớp học phần</DialogTitle>
        <DialogDescription>
          Chọn khóa và tìm kiếm sinh viên cần thêm vào lớp học phần này.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Khóa</p>
          <Select
            value={selectedCohort}
            onValueChange={(value) => {
              setSelectedCohort(value)
              setSearchInput('')
              setDebouncedSearch('')
              setSelectedStudent(null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={isCohortsLoading ? 'Đang tải...' : 'Chọn khóa'} />
            </SelectTrigger>
            <SelectContent>
              {cohorts?.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Input
              placeholder="Nhập tối thiểu 2 ký tự để tìm kiếm"
              value={
                selectedStudent
                  ? `${selectedStudent.studentCode} · ${selectedStudent.fullName}`
                  : searchInput
              }
              onChange={(event) => {
                if (selectedStudent) {
                  setSelectedStudent(null)
                }
                setSearchInput(event.target.value)
              }}
              disabled={!selectedCohort}
            />
            {selectedStudent ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null)
                  setSearchInput('')
                  setDebouncedSearch('')
                }}
                className="absolute right-3 top-2 text-lg leading-none text-muted-foreground transition hover:text-foreground"
              >
                ×
              </button>
            ) : isSearching ? (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}

            {selectedCohort && !selectedStudent && (studentResults.length > 0 || debouncedSearch || isSearching) ? (
              <div className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-md border bg-background shadow-lg">
                {studentResults.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã SV</TableHead>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Lớp</TableHead>
                        <TableHead>Ngành</TableHead>
                        <TableHead className="text-right">Chọn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{dropdownRows}</TableBody>
                  </Table>
                ) : debouncedSearch && !isSearching ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy sinh viên phù hợp.</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {!selectedCohort && (
            <p className="text-xs text-muted-foreground">Vui lòng chọn khóa trước khi tìm kiếm sinh viên.</p>
          )}
          {isSearchError && (
            <p className="text-sm text-destructive">
              {(searchError as Error)?.message || 'Có lỗi khi tìm kiếm sinh viên.'}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" onClick={handleAddStudent} disabled={!selectedStudent || addMutation.isPending}>
          {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Thêm vào lớp học phần
        </Button>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

