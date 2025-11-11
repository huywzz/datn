import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, Plus, X, Search, BookOpen, Loader2, AlertCircle, User, MapPin, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { getCourseSections, registerSection, type CourseSection } from '@/lib/api'
import { useAvailableCourses, type Subject } from '../hooks/use-available-courses'

// Map dayOfWeek (0-6) to day format (CN, T2-T7)
const mapDayOfWeek = (dayOfWeek: string): 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN' => {
  const dayMap: Record<string, 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN'> = {
    '0': 'CN',
    '1': 'T2',
    '2': 'T3',
    '3': 'T4',
    '4': 'T5',
    '5': 'T6',
    '6': 'T7',
  }
  return dayMap[dayOfWeek] || 'T2'
}

interface ListRegistrationProps {
  registeredSubjects: string[]
  onUpdateRegisteredSubjects: (subjects: string[]) => void
}

export function ListRegistration({ registeredSubjects, onUpdateRegisteredSubjects }: ListRegistrationProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [sections, setSections] = useState<CourseSection[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [registeringSectionId, setRegisteringSectionId] = useState<number | null>(null)

  // Use shared hook with React Query caching
  const { subjects, isLoading, error } = useAvailableCourses()

  // Filter subjects based on search and filters
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSemester = semesterFilter === 'all' || subject.semester === semesterFilter
    const matchesType = typeFilter === 'all' || subject.type === typeFilter
    
    return matchesSearch && matchesSemester && matchesType && (subject.available !== false)
  })

  const handleOpenDialog = async (subject: Subject) => {
    setSelectedSubject(subject)
    setDialogOpen(true)
    setIsLoadingSections(true)
    setSections([])
    
    try {
      const courseSections = await getCourseSections(subject.courseId)
      setSections(courseSections)
      
      if (courseSections.length === 0) {
        toast.info('Không có lớp học phần nào cho môn học này')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách lớp học phần'
      toast.error(errorMessage)
    } finally {
      setIsLoadingSections(false)
    }
  }

  const handleRegisterClass = async (subjectCode: string, sectionId?: number) => {
    if (!sectionId) {
      toast.error('Không tìm thấy ID lớp học phần')
      return
    }

    if (registeredSubjects.includes(subjectCode)) {
      toast.info('Môn học này đã được đăng ký')
      return
    }

    try {
      setRegisteringSectionId(sectionId)
      await registerSection(sectionId)
      
      if (!registeredSubjects.includes(subjectCode)) {
        onUpdateRegisteredSubjects([...registeredSubjects, subjectCode])
      }
      toast.success(`Đã đăng ký môn học ${subjectCode}`)
      setDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng ký lớp học phần thất bại'
      toast.error(errorMessage)
    } finally {
      setRegisteringSectionId(null)
    }
  }

  const handleCancelRegistration = (subjectCode: string) => {
    onUpdateRegisteredSubjects(registeredSubjects.filter(code => code !== subjectCode))
    toast.success(`Đã hủy đăng ký môn học ${subjectCode}`)
    // TODO: Call API to cancel the registration when API is available
    // Note: This would require a DELETE endpoint like DELETE /registrations/:registrationId
  }

  const registeredCredits = registeredSubjects.reduce((total, subjectCode) => {
    const subject = subjects.find(s => s.code === subjectCode)
    return total + (subject?.credits || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Đăng ký theo danh sách</h3>
              <p className="text-blue-700">Chọn môn học từ danh sách có sẵn</p>
            </div>
            <div className="text-4xl font-bold text-blue-600">{registeredCredits}</div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc mã môn..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={semesterFilter}
              onChange={e => setSemesterFilter(e.target.value)}
              className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value="Bắt buộc">Bắt buộc</option>
              <option value="Tự chọn">Tự chọn</option>
            </select>
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="px-3 py-1">
                {filteredSubjects.length} môn học
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Đang tải danh sách môn học...</h3>
                  <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Lỗi tải dữ liệu</h3>
                  <p className="text-muted-foreground">
                    {error instanceof Error ? error.message : 'Không thể tải danh sách môn học'}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Tải lại
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredSubjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted/50 rounded-full">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Không tìm thấy môn học</h3>
                  <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSubjects.map(subject => {
            const isRegistered = registeredSubjects.includes(subject.code)
            return (
              <Card key={subject.id} className={`transition-all duration-200 hover:shadow-md ${isRegistered ? 'ring-2 ring-green-200 bg-green-50/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {subject.code}
                          </Badge>
                          <Badge variant={subject.type === 'Bắt buộc' ? 'default' : 'secondary'} className="text-xs">
                            {subject.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {subject.credits} tín chỉ
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {subject.semester}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mô tả môn học đang được cập nhật...
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {isRegistered ? (
                        <>
                          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã đăng ký
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex items-center gap-1"
                            onClick={() => handleCancelRegistration(subject.code)}
                          >
                            <X className="h-4 w-4" />
                            Hủy đăng ký
                          </Button>
                        </>
                      ) : (
                        <Dialog open={dialogOpen && selectedSubject?.code === subject.code} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => handleOpenDialog(subject)}
                            >
                              <Plus className="h-4 w-4" />
                              Đăng ký
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Chọn lớp học phần cho {subject.name}</DialogTitle>
                              <DialogDescription>
                                Chọn lớp học phần phù hợp với thời khóa biểu của bạn
                              </DialogDescription>
                            </DialogHeader>
                            {isLoadingSections ? (
                              <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Đang tải danh sách lớp học phần...</p>
                              </div>
                            ) : sections.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12">
                                <BookOpen className="h-8 w-8 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Không có lớp học phần nào</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {sections.map((section) => (
                                  <div
                                    key={section.sectionId}
                                    className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {section.sectionCode || `Lớp ${section.sectionId}`}
                                      </div>
                                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                        {section.instructor?.fullName && (
                                          <div className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            <span>{section.instructor.fullName}</span>
                                            {section.instructor.title && (
                                              <span className="text-xs">({section.instructor.title})</span>
                                            )}
                                          </div>
                                        )}
                                        {section.classSchedules && section.classSchedules.length > 0 && (
                                          <>
                                            {section.classSchedules.map((schedule, idx) => (
                                              <div key={schedule.scheduleId || idx} className="flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                  {mapDayOfWeek(schedule.dayOfWeek)} tiết {schedule.startPeriod}-{schedule.endPeriod}
                                                </span>
                                                {schedule.room && (
                                                  <>
                                                    <span className="mx-1">•</span>
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{schedule.room}</span>
                                                  </>
                                                )}
                                              </div>
                                            ))}
                                          </>
                                        )}
                                        {section.schedule && (
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                                            <span>{section.schedule}</span>
                                          </div>
                                        )}
                                        {section.maxStudents !== undefined && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                              Sức chứa: {section.maxStudents}
                                            </Badge>
                                            {section.status && (
                                              <Badge 
                                                variant={section.status === 'open' ? 'default' : 'secondary'} 
                                                className="text-xs"
                                              >
                                                {section.status === 'open' ? 'Mở đăng ký' : section.status}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                      <Button
                                        size="sm"
                                        onClick={() => handleRegisterClass(subject.code, section.sectionId)}
                                        className="min-w-[80px]"
                                        disabled={section.status !== 'open' || registeringSectionId === section.sectionId || registeredSubjects.includes(subject.code)}
                                      >
                                        {registeringSectionId === section.sectionId ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Đang đăng ký...
                                          </>
                                        ) : registeredSubjects.includes(subject.code) ? (
                                          'Đã đăng ký'
                                        ) : (
                                          'Chọn'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
