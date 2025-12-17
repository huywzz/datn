import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useMemo, useState } from 'react'
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  MapPin, 
  BookOpen, 
  User, 
  Calendar,
  Loader2,
  Inbox
} from 'lucide-react'
import { getAllExchangeTransactions, type ExchangeTransaction } from '@/lib/api'
import type { CourseSection } from '@/lib/interface'

type SectionInfo = {
  sectionId: number
  courseCode: string
  courseName: string
  dayLabel: string
  timeLabel: string
  room?: string
  scheduleInfo?: Array<{ dayLabel: string; timeLabel: string; room?: string }>
}

type UiExchangeRequest = {
  id: string
  studentCode: string
  studentName: string
  currentSections: SectionInfo[] // Mảng các lớp cần bỏ
  targetSections: SectionInfo[] // Mảng các lớp muốn thêm
  status: string
  createdAt: string
}

function mapDayOfWeek(dayOfWeek: string) {
  const map: Record<string, string> = {
    '0': 'Chủ Nhật',
    '1': 'Thứ Hai',
    '2': 'Thứ Ba',
    '3': 'Thứ Tư',
    '4': 'Thứ Năm',
    '5': 'Thứ Sáu',
    '6': 'Thứ Bảy',
  }
  return map[dayOfWeek] || 'Thứ Hai'
}

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return (
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3 mr-1.5" />
          Đang chờ
        </Badge>
      )
    case 'MATCHED':
    case 'COMPLETED':
    case 'ACCEPTED':
      return (
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Đã chấp nhận
        </Badge>
      )
    case 'REJECTED':
    case 'CANCELLED':
      return (
        <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
          Đã từ chối
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function parseSchedule(scheduleString?: string): { dayLabel: string; timeLabel: string; room?: string }[] {
  if (!scheduleString) return []
  
  // Parse schedule string như "Thứ 2 (Tiết 4-7) - V.A104; Thứ 5 (Tiết 2-4) - K.A108"
  const parts = scheduleString.split(';').map(s => s.trim()).filter(s => s.length > 0)
  
  return parts.map(part => {
    // Extract day number từ "Thứ 2" -> "2"
    const dayMatch = part.match(/Thứ\s+(\d+)/)
    const timeMatch = part.match(/Tiết\s+(\d+)-(\d+)/)
    // Extract room từ "- V.A104" hoặc " - V.A104"
    const roomMatch = part.match(/[-–]\s*([A-Z0-9.]+)(?:\s*;|$)/) || part.match(/[-–]\s*([A-Z0-9.]+)$/)
    
    const dayNumber = dayMatch ? dayMatch[1] : null
    const dayLabel = dayNumber ? mapDayOfWeek(dayNumber) : 'Chưa rõ'
    const timeLabel = timeMatch ? `Tiết ${timeMatch[1]}-${timeMatch[2]}` : ''
    const room = roomMatch ? roomMatch[1].trim() : undefined
    
    return { dayLabel, timeLabel, room }
  })
}

function mapTransactionToUi(tx: ExchangeTransaction): UiExchangeRequest {
  const removeItems = tx.items.filter((i) => i.action === 'REMOVE')
  const addItems = tx.items.filter((i) => i.action === 'ADD')

  const buildSectionInfo = (item: ExchangeTransaction['items'][number]): SectionInfo | null => {
    if (!item || !item.section) return null

    const section = item.section as CourseSection
    const course = section.course
    const schedules = section.classSchedules || []
    
    // Nếu có classSchedules, ưu tiên dùng nó
    let scheduleInfo: { dayLabel: string; timeLabel: string; room?: string }[] = []
    
    if (schedules.length > 0) {
      scheduleInfo = schedules.map(s => ({
        dayLabel: mapDayOfWeek(s.dayOfWeek),
        timeLabel: `Tiết ${s.startPeriod}-${s.endPeriod}`,
        room: s.room,
      }))
    } else if (section.schedule) {
      // Parse từ schedule string
      scheduleInfo = parseSchedule(section.schedule)
    } else {
      scheduleInfo = [{ dayLabel: 'Chưa rõ', timeLabel: '', room: undefined }]
    }

    return {
      sectionId: section.sectionId,
      courseCode: course?.code || section.sectionCode || '',
      courseName: course?.name || '',
      dayLabel: scheduleInfo.map(s => s.dayLabel).join(', ') || 'Chưa rõ',
      timeLabel: scheduleInfo.map(s => `${s.dayLabel} (${s.timeLabel}${s.room ? ` - ${s.room}` : ''})`).join('; ') || section.schedule || '',
      room: scheduleInfo.map(s => s.room).filter(Boolean).join(', ') || undefined,
      scheduleInfo,
    }
  }

  return {
    id: tx.transactionId.toString(),
    studentCode: tx.student?.studentCode || '',
    studentName: tx.student?.fullName || '',
    currentSections: removeItems.map(buildSectionInfo).filter((s): s is SectionInfo => s !== null),
    targetSections: addItems.map(buildSectionInfo).filter((s): s is SectionInfo => s !== null),
    status: tx.status,
    createdAt: (tx.createdAt as unknown as string) || new Date().toISOString(),
  }
}

export function AllExchangeRequestsPage() {
  const [requests, setRequests] = useState<UiExchangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const allTxs = await getAllExchangeTransactions()
        setRequests(Array.isArray(allTxs) ? allTxs.map(mapTransactionToUi) : [])
      } catch (error) {
        console.error(error)
        alert('Không thể tải danh sách yêu cầu đổi lớp.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const uniqueSubjects = useMemo(() => {
    return Array.from(
      new Set(
        requests.flatMap((r) => [
          ...r.currentSections.map(s => s.courseCode),
          ...r.targetSections.map(s => s.courseCode),
        ]).filter(Boolean) as string[],
      ),
    ).sort()
  }, [requests])

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSubject =
        subjectFilter === 'all' ||
        request.currentSections.some(s => s.courseCode === subjectFilter) ||
        request.targetSections.some(s => s.courseCode === subjectFilter)
      const matchesStatus =
        statusFilter === 'all' ||
        request.status.toUpperCase() === statusFilter.toUpperCase()

      return matchesSubject && matchesStatus
    })
  }, [requests, subjectFilter, statusFilter])

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className='overflow-y-auto'>
        <div className='flex flex-col gap-6 p-6'>
          <div className="space-y-2">
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <Inbox className="w-8 h-8 text-primary" />
              Danh sách yêu cầu đổi lớp
            </h1>
            <p className='text-muted-foreground text-base'>
              Xem và quản lý tất cả yêu cầu đổi lớp của sinh viên trong hệ thống.
            </p>
          </div>

          <div className="space-y-6">
            {/* Filters */}
            <Card className="border-2 shadow-sm">
              {/* <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-primary" />
                  Bộ lọc
                </CardTitle>
              </CardHeader> */}
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Môn học
                    </label>
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn môn học" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả môn học</SelectItem>
                        {uniqueSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Trạng thái
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="PENDING">Đang chờ</SelectItem>
                        <SelectItem value="MATCHED">Đã ghép</SelectItem>
                        <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requests List */}
            {isLoading ? (
              <Card className="border-2">
                <CardContent className="text-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground text-lg font-medium">Đang tải dữ liệu...</p>
                  <p className="text-sm text-muted-foreground mt-2">Vui lòng đợi trong giây lát</p>
                </CardContent>
              </Card>
            ) : currentRequests.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-16">
                  <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-semibold text-muted-foreground mb-2">Không có yêu cầu nào</p>
                  <p className="text-sm text-muted-foreground">
                    {filteredRequests.length === 0 && requests.length > 0
                      ? 'Không tìm thấy yêu cầu phù hợp với bộ lọc'
                      : 'Chưa có yêu cầu đổi lớp nào trong hệ thống'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {currentRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6 pb-4 border-b">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              {request.studentName}
                              {request.studentCode && (
                                <span className="text-sm font-normal text-muted-foreground">
                                  ({request.studentCode})
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Tạo lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lớp hiện tại - Các lớp cần bỏ */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                            Lớp cần bỏ ({request.currentSections.length})
                          </h4>
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-sm">
                            {request.currentSections.length > 0 ? (
                              <div className="space-y-4">
                                {request.currentSections.map((section, idx) => (
                                  <div key={section.sectionId} className={idx > 0 ? "pt-4 border-t border-slate-200 dark:border-slate-700" : ""}>
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="font-bold text-base text-slate-900 dark:text-slate-100">
                                            {section.courseName || section.courseCode || 'Chưa có tên môn học'}
                                          </p>
                                          {section.courseCode && section.courseName && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                                              {section.courseCode}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {section.scheduleInfo && section.scheduleInfo.length > 0 ? (
                                        <div className="space-y-1.5 pt-2">
                                          {section.scheduleInfo.map((schedule, sIdx) => (
                                            <div key={sIdx} className="flex items-start gap-2 text-sm">
                                              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">{schedule.dayLabel}</span>
                                                {schedule.timeLabel && (
                                                  <>
                                                    {' '}
                                                    <span className="text-slate-600 dark:text-slate-400">({schedule.timeLabel}</span>
                                                    {schedule.room && (
                                                      <>
                                                        {' - '}
                                                        <span className="inline-flex items-center gap-1">
                                                          <MapPin className="w-3 h-3" />
                                                          {schedule.room}
                                                        </span>
                                                      </>
                                                    )}
                                                    <span className="text-slate-600 dark:text-slate-400">)</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : section.timeLabel ? (
                                        <div className="pt-2">
                                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line flex items-start gap-2">
                                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{section.timeLabel}</span>
                                          </p>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                                Không có lớp nào cần bỏ
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Lớp muốn đổi - Các lớp muốn thêm */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            Lớp muốn thêm ({request.targetSections.length})
                          </h4>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-2 border-blue-200 dark:border-blue-800 p-5 rounded-xl shadow-sm">
                            {request.targetSections.length > 0 ? (
                              <div className="space-y-4">
                                {request.targetSections.map((section, idx) => (
                                  <div key={section.sectionId} className={idx > 0 ? "pt-4 border-t border-blue-200 dark:border-blue-800" : ""}>
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="font-bold text-base text-blue-900 dark:text-blue-100">
                                            {section.courseName || section.courseCode || 'Chưa có tên môn học'}
                                          </p>
                                          {section.courseCode && section.courseName && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                              {section.courseCode}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {section.scheduleInfo && section.scheduleInfo.length > 0 ? (
                                        <div className="space-y-1.5 pt-2">
                                          {section.scheduleInfo.map((schedule, sIdx) => (
                                            <div key={sIdx} className="flex items-start gap-2 text-sm">
                                              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <span className="font-semibold text-blue-900 dark:text-blue-100">{schedule.dayLabel}</span>
                                                {schedule.timeLabel && (
                                                  <>
                                                    {' '}
                                                    <span className="text-blue-700 dark:text-blue-300">({schedule.timeLabel}</span>
                                                    {schedule.room && (
                                                      <>
                                                        {' - '}
                                                        <span className="inline-flex items-center gap-1">
                                                          <MapPin className="w-3 h-3" />
                                                          {schedule.room}
                                                        </span>
                                                      </>
                                                    )}
                                                    <span className="text-blue-700 dark:text-blue-300">)</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : section.timeLabel ? (
                                        <div className="pt-2">
                                          <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-line flex items-start gap-2">
                                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{section.timeLabel}</span>
                                          </p>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-blue-500 dark:text-blue-400 italic text-center py-4">
                                Không có lớp nào muốn thêm
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Card className="border-2">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground font-medium">
                          Hiển thị <span className="font-bold text-foreground">{startIndex + 1}</span>-
                          <span className="font-bold text-foreground">{Math.min(endIndex, filteredRequests.length)}</span> trong{' '}
                          <span className="font-bold text-foreground">{filteredRequests.length}</span> yêu cầu
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="h-9 px-4"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Trước
                          </Button>
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                            <span className="text-sm font-semibold">
                              Trang {currentPage} / {totalPages}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages),
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="h-9 px-4"
                          >
                            Sau
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}

export default AllExchangeRequestsPage


