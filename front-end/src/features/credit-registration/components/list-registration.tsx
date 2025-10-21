import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, Plus, X, Search, Filter, BookOpen } from 'lucide-react'

// Mock data for subjects
const subjects = [
  { id: '1', code: 'CS101', name: 'Nhập môn lập trình', credits: 3, type: 'Bắt buộc', semester: 'HK1', available: true },
  { id: '2', code: 'CS102', name: 'Cấu trúc dữ liệu', credits: 3, type: 'Bắt buộc', semester: 'HK1', available: true },
  { id: '3', code: 'CS103', name: 'Thuật toán', credits: 3, type: 'Bắt buộc', semester: 'HK2', available: true },
  { id: '4', code: 'CS201', name: 'Cơ sở dữ liệu', credits: 3, type: 'Bắt buộc', semester: 'HK2', available: false },
  { id: '5', code: 'CS301', name: 'Phát triển web', credits: 4, type: 'Tự chọn', semester: 'HK1', available: true },
  { id: '6', code: 'CS302', name: 'Trí tuệ nhân tạo', credits: 3, type: 'Tự chọn', semester: 'HK1', available: true },
]

// Mock data for class sections
const classSections: Record<string, Array<{ id: string; classCode: string; teacher: string; time: string; room: string; capacity: number; enrolled: number }>> = {
  'CS101': [
    { id: '1', classCode: 'CS101-01', teacher: 'Nguyễn Văn A', time: 'T2,T4,T6 7:30-9:00', room: 'A101', capacity: 40, enrolled: 35 },
    { id: '2', classCode: 'CS101-02', teacher: 'Trần Thị B', time: 'T3,T5 9:30-11:00', room: 'A102', capacity: 40, enrolled: 28 },
  ],
  'CS102': [
    { id: '3', classCode: 'CS102-01', teacher: 'Lê Văn C', time: 'T2,T4 7:30-9:00', room: 'B201', capacity: 35, enrolled: 32 },
  ],
  'CS103': [
    { id: '4', classCode: 'CS103-01', teacher: 'Phạm Thị D', time: 'T3,T5,T6 9:30-11:00', room: 'B202', capacity: 40, enrolled: 25 },
  ],
  'CS301': [
    { id: '5', classCode: 'CS301-01', teacher: 'Hoàng Văn E', time: 'T2,T4 13:30-15:00', room: 'C301', capacity: 30, enrolled: 22 },
  ],
  'CS302': [
    { id: '6', classCode: 'CS302-01', teacher: 'Vũ Thị F', time: 'T3,T5 15:30-17:00', room: 'C302', capacity: 35, enrolled: 18 },
  ],
}

interface ListRegistrationProps {
  registeredSubjects: string[]
  onUpdateRegisteredSubjects: (subjects: string[]) => void
}

export function ListRegistration({ registeredSubjects, onUpdateRegisteredSubjects }: ListRegistrationProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [_selectedClassDialog, setSelectedClassDialog] = useState<{ subjectCode: string; classId: string } | null>(null)

  // Filter subjects based on search and filters
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSemester = semesterFilter === 'all' || subject.semester === semesterFilter
    const matchesType = typeFilter === 'all' || subject.type === typeFilter
    
    return matchesSearch && matchesSemester && matchesType && subject.available
  })

  const handleRegisterClass = (subjectCode: string, _classId: string) => {
    if (!registeredSubjects.includes(subjectCode)) {
      onUpdateRegisteredSubjects([...registeredSubjects, subjectCode])
    }
    setSelectedClassDialog(null)
    // Here you would typically call an API to register for the specific class
  }

  const handleCancelRegistration = (subjectCode: string) => {
    onUpdateRegisteredSubjects(registeredSubjects.filter(code => code !== subjectCode))
    // Here you would typically call an API to cancel the registration
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
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
        {filteredSubjects.length === 0 ? (
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="flex items-center gap-1">
                              <Plus className="h-4 w-4" />
                              Đăng ký
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Chọn lớp cho {subject.name}</DialogTitle>
                              <DialogDescription>
                                Chọn lớp phù hợp với thời gian biểu của bạn
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {classSections[subject.code]?.map((section) => (
                                <div key={section.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{section.classCode}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <div>👨‍🏫 {section.teacher}</div>
                                      <div>🕒 {section.time}</div>
                                      <div>📍 {section.room}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs">
                                      {section.enrolled}/{section.capacity}
                                    </Badge>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleRegisterClass(subject.code, section.id)}
                                      className="min-w-[80px]"
                                    >
                                      Chọn
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
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
