import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { Plus, CheckCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

type ExchangeRequest = {
  id: string
  studentId: string
  studentName: string
  currentClass: {
    id: string
    subjectCode: string
    subjectName: string
    semester: string
    day: number
    startSlot: number
    endSlot: number
    room: string
    lecturer: string
  }
  targetClass: {
    id: string
    subjectCode: string
    subjectName: string
    semester: string
    day: number
    startSlot: number
    endSlot: number
    room: string
    lecturer: string
  }
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

const mockExchangeRequests: ExchangeRequest[] = [
  {
    id: 'ER001',
    studentId: 'SV001',
    studentName: 'Nguyễn Văn A',
    currentClass: {
      id: 'CLC101-1',
      subjectCode: 'CLC101',
      subjectName: 'Cơ sở lập trình',
      semester: 'HK1',
      day: 1,
      startSlot: 1,
      endSlot: 3,
      room: 'A1-201',
      lecturer: 'Nguyễn Văn A'
    },
    targetClass: {
      id: 'CLC101-2',
      subjectCode: 'CLC101',
      subjectName: 'Cơ sở lập trình',
      semester: 'HK1',
      day: 3,
      startSlot: 1,
      endSlot: 3,
      room: 'A1-202',
      lecturer: 'Trần Thị B'
    },
    status: 'PENDING',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'ER002',
    studentId: 'SV002',
    studentName: 'Trần Thị B',
    currentClass: {
      id: 'THCS201-2',
      subjectCode: 'THCS201',
      subjectName: 'Cấu trúc dữ liệu',
      semester: 'HK1',
      day: 3,
      startSlot: 6,
      endSlot: 8,
      room: 'A2-305',
      lecturer: 'Trần Thị B'
    },
    targetClass: {
      id: 'THCS201-1',
      subjectCode: 'THCS201',
      subjectName: 'Cấu trúc dữ liệu',
      semester: 'HK1',
      day: 1,
      startSlot: 6,
      endSlot: 8,
      room: 'A2-304',
      lecturer: 'Lê Văn C'
    },
    status: 'ACCEPTED',
    createdAt: '2024-01-14T10:30:00Z'
  },
  {
    id: 'ER003',
    studentId: 'SV003',
    studentName: 'Lê Văn C',
    currentClass: {
      id: 'WEB301-1',
      subjectCode: 'WEB301',
      subjectName: 'Lập trình Web',
      semester: 'HK2',
      day: 5,
      startSlot: 1,
      endSlot: 2,
      room: 'LAB-404',
      lecturer: 'Lê Văn C'
    },
    targetClass: {
      id: 'WEB301-2',
      subjectCode: 'WEB301',
      subjectName: 'Lập trình Web',
      semester: 'HK2',
      day: 5,
      startSlot: 3,
      endSlot: 4,
      room: 'LAB-405',
      lecturer: 'Nguyễn Thị E'
    },
    status: 'PENDING',
    createdAt: '2024-01-10T14:20:00Z'
  },
  {
    id: 'ER004',
    studentId: 'SV004',
    studentName: 'Phạm Văn D',
    currentClass: {
      id: 'CS101-1',
      subjectCode: 'CS101',
      subjectName: 'Nhập môn lập trình',
      semester: 'HK1',
      day: 2,
      startSlot: 1,
      endSlot: 3,
      room: 'A1-101',
      lecturer: 'Hoàng Văn E'
    },
    targetClass: {
      id: 'CS101-2',
      subjectCode: 'CS101',
      subjectName: 'Nhập môn lập trình',
      semester: 'HK1',
      day: 4,
      startSlot: 1,
      endSlot: 3,
      room: 'A1-102',
      lecturer: 'Vũ Thị F'
    },
    status: 'REJECTED',
    createdAt: '2024-01-08T09:15:00Z'
  },
  {
    id: 'ER005',
    studentId: 'SV005',
    studentName: 'Nguyễn Thị E',
    currentClass: {
      id: 'CS102-1',
      subjectCode: 'CS102',
      subjectName: 'Cấu trúc dữ liệu',
      semester: 'HK2',
      day: 1,
      startSlot: 6,
      endSlot: 8,
      room: 'A2-201',
      lecturer: 'Trần Văn G'
    },
    targetClass: {
      id: 'CS102-2',
      subjectCode: 'CS102',
      subjectName: 'Cấu trúc dữ liệu',
      semester: 'HK2',
      day: 3,
      startSlot: 6,
      endSlot: 8,
      room: 'A2-202',
      lecturer: 'Lê Thị H'
    },
    status: 'PENDING',
    createdAt: '2024-01-12T11:30:00Z'
  }
]

const availableClasses = [
  {
    id: 'CLC101-1',
    subjectCode: 'CLC101',
    subjectName: 'Cơ sở lập trình',
    semester: 'HK1',
    day: 1,
    startSlot: 1,
    endSlot: 3,
    room: 'A1-201',
    lecturer: 'Nguyễn Văn A',
    availableSlots: 5
  },
  {
    id: 'CLC101-2',
    subjectCode: 'CLC101',
    subjectName: 'Cơ sở lập trình',
    semester: 'HK1',
    day: 3,
    startSlot: 1,
    endSlot: 3,
    room: 'A1-202',
    lecturer: 'Trần Thị B',
    availableSlots: 3
  },
  {
    id: 'THCS201-1',
    subjectCode: 'THCS201',
    subjectName: 'Cấu trúc dữ liệu',
    semester: 'HK1',
    day: 1,
    startSlot: 6,
    endSlot: 8,
    room: 'A2-304',
    lecturer: 'Lê Văn C',
    availableSlots: 2
  },
  {
    id: 'THCS201-2',
    subjectCode: 'THCS201',
    subjectName: 'Cấu trúc dữ liệu',
    semester: 'HK1',
    day: 3,
    startSlot: 6,
    endSlot: 8,
    room: 'A2-305',
    lecturer: 'Trần Thị B',
    availableSlots: 4
  },
  {
    id: 'WEB301-1',
    subjectCode: 'WEB301',
    subjectName: 'Lập trình Web',
    semester: 'HK2',
    day: 5,
    startSlot: 1,
    endSlot: 2,
    room: 'LAB-404',
    lecturer: 'Lê Văn C',
    availableSlots: 1
  },
  {
    id: 'WEB301-2',
    subjectCode: 'WEB301',
    subjectName: 'Lập trình Web',
    semester: 'HK2',
    day: 5,
    startSlot: 3,
    endSlot: 4,
    room: 'LAB-405',
    lecturer: 'Nguyễn Thị E',
    availableSlots: 3
  },
  {
    id: 'CS101-1',
    subjectCode: 'CS101',
    subjectName: 'Nhập môn lập trình',
    semester: 'HK1',
    day: 2,
    startSlot: 1,
    endSlot: 3,
    room: 'A1-101',
    lecturer: 'Hoàng Văn E',
    availableSlots: 2
  },
  {
    id: 'CS101-2',
    subjectCode: 'CS101',
    subjectName: 'Nhập môn lập trình',
    semester: 'HK1',
    day: 4,
    startSlot: 1,
    endSlot: 3,
    room: 'A1-102',
    lecturer: 'Vũ Thị F',
    availableSlots: 4
  },
  {
    id: 'CS102-1',
    subjectCode: 'CS102',
    subjectName: 'Cấu trúc dữ liệu',
    semester: 'HK2',
    day: 1,
    startSlot: 6,
    endSlot: 8,
    room: 'A2-201',
    lecturer: 'Trần Văn G',
    availableSlots: 3
  },
  {
    id: 'CS102-2',
    subjectCode: 'CS102',
    subjectName: 'Cấu trúc dữ liệu',
    semester: 'HK2',
    day: 3,
    startSlot: 6,
    endSlot: 8,
    room: 'A2-202',
    lecturer: 'Lê Thị H',
    availableSlots: 2
  }
]

const daysOfWeek = [
  { name: 'HAI', fullName: 'Thứ Hai' },
  { name: 'BA', fullName: 'Thứ Ba' },
  { name: 'TƯ', fullName: 'Thứ Tư' },
  { name: 'NĂM', fullName: 'Thứ Năm' },
  { name: 'SÁU', fullName: 'Thứ Sáu' },
  { name: 'BẢY', fullName: 'Thứ Bảy' },
  { name: 'CN', fullName: 'Chủ Nhật' },
]

export function ExchangeRequest() {
  const [requests, setRequests] = useState<ExchangeRequest[]>(mockExchangeRequests)
  const [selectedCurrentClass, setSelectedCurrentClass] = useState<string>('')
  const [selectedTargetClass, setSelectedTargetClass] = useState<string>('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Filter state
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [semesterFilter, setSemesterFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const getStatusBadge = (status: ExchangeRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Đang chờ</Badge>
      case 'ACCEPTED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Đã chấp nhận</Badge>
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Đã từ chối</Badge>
    }
  }

  const handleCreateRequest = () => {
    if (!selectedCurrentClass || !selectedTargetClass) {
      alert('Vui lòng chọn lớp hiện tại và lớp muốn đổi')
      return
    }

    const currentClass = availableClasses.find(c => c.id === selectedCurrentClass)
    const targetClass = availableClasses.find(c => c.id === selectedTargetClass)

    if (!currentClass || !targetClass) return

    const newRequest: ExchangeRequest = {
      id: `ER${Date.now()}`,
      studentId: 'SV001',
      studentName: 'Nguyễn Văn A',
      currentClass,
      targetClass,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }

    setRequests(prev => [newRequest, ...prev])
    setSelectedCurrentClass('')
    setSelectedTargetClass('')
  }

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'ACCEPTED' as const }
        : req
    ))
  }

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSubject = subjectFilter === 'all' || 
      request.currentClass.subjectCode === subjectFilter ||
      request.targetClass.subjectCode === subjectFilter
    const matchesSemester = semesterFilter === 'all' || 
      request.currentClass.semester === semesterFilter ||
      request.targetClass.semester === semesterFilter
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSubject && matchesSemester && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  // Get unique subjects and semesters for filters
  const uniqueSubjects = Array.from(new Set([
    ...requests.map(r => r.currentClass.subjectCode),
    ...requests.map(r => r.targetClass.subjectCode)
  ])).sort()

  const uniqueSemesters = Array.from(new Set([
    ...requests.map(r => r.currentClass.semester),
    ...requests.map(r => r.targetClass.semester)
  ])).sort()

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          {/* <ConfigDrawer /> */}
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className='overflow-y-auto'>
        <div className='flex flex-col gap-6 p-6'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Yêu cầu đổi lớp</h1>
            <p className='text-muted-foreground'>Quản lý các yêu cầu đổi lớp của sinh viên.</p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Tạo yêu cầu</TabsTrigger>
              <TabsTrigger value="list">Danh sách yêu cầu ({filteredRequests.length})</TabsTrigger>
            </TabsList>

            {/* Tạo yêu cầu đổi lớp */}
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Tạo yêu cầu đổi lớp mới
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lớp hiện tại */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lớp hiện tại</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedCurrentClass}
                        onChange={(e) => setSelectedCurrentClass(e.target.value)}
                      >
                        <option value="">Chọn lớp hiện tại</option>
                        {availableClasses.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.subjectCode} - {cls.subjectName} ({cls.semester}, {daysOfWeek[cls.day - 1].fullName}, Tiết {cls.startSlot}-{cls.endSlot}, {cls.room})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lớp muốn đổi */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lớp muốn đổi</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedTargetClass}
                        onChange={(e) => setSelectedTargetClass(e.target.value)}
                      >
                        <option value="">Chọn lớp muốn đổi</option>
                        {availableClasses
                          .filter(cls => cls.id !== selectedCurrentClass)
                          .map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.subjectCode} - {cls.subjectName} ({cls.semester}, {daysOfWeek[cls.day - 1].fullName}, Tiết {cls.startSlot}-{cls.endSlot}, {cls.room})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <Button onClick={handleCreateRequest} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo yêu cầu đổi lớp
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Danh sách yêu cầu */}
            <TabsContent value="list">
              <div className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Bộ lọc
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Môn học</label>
                        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn môn học" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả môn học</SelectItem>
                            {uniqueSubjects.map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Học kì</label>
                        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn học kì" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả học kì</SelectItem>
                            {uniqueSemesters.map(semester => (
                              <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Trạng thái</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="PENDING">Đang chờ</SelectItem>
                            <SelectItem value="ACCEPTED">Đã chấp nhận</SelectItem>
                            <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Requests List */}
                {currentRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">Không có yêu cầu nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {currentRequests.map(request => (
                      <Card key={request.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">{request.studentName}</h3>
                              <p className="text-sm text-gray-500">Tạo lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Lớp hiện tại</h4>
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="font-medium">{request.currentClass.subjectName}</p>
                                <p className="text-sm text-gray-600">({request.currentClass.subjectCode}) - {request.currentClass.semester}</p>
                                <p className="text-sm text-gray-600">
                                  {daysOfWeek[request.currentClass.day - 1].fullName}, Tiết {request.currentClass.startSlot}-{request.currentClass.endSlot}
                                </p>
                                <p className="text-sm text-gray-600">{request.currentClass.room} - {request.currentClass.lecturer}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Lớp muốn đổi</h4>
                              <div className="bg-blue-50 p-3 rounded-md">
                                <p className="font-medium">{request.targetClass.subjectName}</p>
                                <p className="text-sm text-gray-600">({request.targetClass.subjectCode}) - {request.targetClass.semester}</p>
                                <p className="text-sm text-gray-600">
                                  {daysOfWeek[request.targetClass.day - 1].fullName}, Tiết {request.targetClass.startSlot}-{request.targetClass.endSlot}
                                </p>
                                <p className="text-sm text-gray-600">{request.targetClass.room} - {request.targetClass.lecturer}</p>
                              </div>
                            </div>
                          </div>

                          {request.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleAcceptRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Chấp nhận
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} trong {filteredRequests.length} yêu cầu
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <span className="text-sm">
                                Trang {currentPage} / {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}

export default ExchangeRequest
