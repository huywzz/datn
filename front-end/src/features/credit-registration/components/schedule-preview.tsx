import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, User, X } from 'lucide-react'

// Mock data for schedule
const scheduleData = {
  'T2': [
    { id: '1', subject: 'CS101', name: 'Nhập môn lập trình', teacher: 'Nguyễn Văn A', room: 'A101', time: '7:30-9:00', color: 'bg-blue-100 text-blue-800' },
    { id: '2', subject: 'CS301', name: 'Phát triển web', teacher: 'Hoàng Văn E', room: 'C301', time: '13:30-15:00', color: 'bg-green-100 text-green-800' }
  ],
  'T3': [
    { id: '3', subject: 'CS102', name: 'Cấu trúc dữ liệu', teacher: 'Trần Thị B', room: 'A102', time: '9:30-11:00', color: 'bg-purple-100 text-purple-800' },
    { id: '4', subject: 'CS302', name: 'Trí tuệ nhân tạo', teacher: 'Vũ Thị F', room: 'C302', time: '15:30-17:00', color: 'bg-orange-100 text-orange-800' }
  ],
  'T4': [
    { id: '5', subject: 'CS101', name: 'Nhập môn lập trình', teacher: 'Nguyễn Văn A', room: 'A101', time: '7:30-9:00', color: 'bg-blue-100 text-blue-800' },
    { id: '6', subject: 'CS301', name: 'Phát triển web', teacher: 'Hoàng Văn E', room: 'C301', time: '13:30-15:00', color: 'bg-green-100 text-green-800' }
  ],
  'T5': [
    { id: '7', subject: 'CS102', name: 'Cấu trúc dữ liệu', teacher: 'Trần Thị B', room: 'A102', time: '9:30-11:00', color: 'bg-purple-100 text-purple-800' },
    { id: '8', subject: 'CS302', name: 'Trí tuệ nhân tạo', teacher: 'Vũ Thị F', room: 'C302', time: '15:30-17:00', color: 'bg-orange-100 text-orange-800' }
  ],
  'T6': [
    { id: '9', subject: 'CS101', name: 'Nhập môn lập trình', teacher: 'Nguyễn Văn A', room: 'A101', time: '7:30-9:00', color: 'bg-blue-100 text-blue-800' },
    { id: '10', subject: 'CS103', name: 'Thuật toán', teacher: 'Phạm Thị D', room: 'B202', time: '9:30-11:00', color: 'bg-red-100 text-red-800' }
  ],
  'T7': [],
  'CN': []
}

const timeSlots = [
  '7:30-9:00',
  '9:30-11:00', 
  '11:30-13:00',
  '13:30-15:00',
  '15:30-17:00',
  '17:30-19:00'
]

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

interface SchedulePreviewProps {
  registeredSubjects: string[]
  onRemoveSubject: (subjectCode: string) => void
}

export function SchedulePreview({ registeredSubjects, onRemoveSubject }: SchedulePreviewProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  const getSubjectInSlot = (day: string, timeSlot: string) => {
    return scheduleData[day as keyof typeof scheduleData]?.find(subject => subject.time === timeSlot)
  }

  const isSubjectRegistered = (subjectCode: string) => {
    return registeredSubjects.includes(subjectCode)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Thời khóa biểu đã đăng ký
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="p-2 text-center font-medium text-sm text-muted-foreground">Giờ</div>
              {days.map(day => (
                <div key={day} className="p-2 text-center font-medium text-sm bg-muted/50 rounded">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-8 gap-2 mb-2">
                <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30 rounded">
                  {timeSlot}
                </div>
                {days.map(day => {
                  const subject = getSubjectInSlot(day, timeSlot)
                  const isRegistered = subject ? isSubjectRegistered(subject.subject) : false
                  
                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      className={`min-h-[60px] p-2 rounded border-2 border-dashed border-muted-foreground/20 transition-all duration-200 ${
                        hoveredSlot === `${day}-${timeSlot}` ? 'border-primary/50 bg-primary/5' : ''
                      } ${subject ? 'border-solid' : ''}`}
                      onMouseEnter={() => setHoveredSlot(`${day}-${timeSlot}`)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      {subject && (
                        <div className={`p-2 rounded text-xs ${subject.color} ${!isRegistered ? 'opacity-50' : ''}`}>
                          <div className="font-medium">{subject.subject}</div>
                          <div className="text-xs opacity-80">{subject.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs">{subject.teacher}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{subject.room}</span>
                          </div>
                          {isRegistered && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full mt-2 h-6 text-xs"
                              onClick={() => onRemoveSubject(subject.subject)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Hủy
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2">Chú thích:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              CS101 - Nhập môn lập trình
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              CS102 - Cấu trúc dữ liệu
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              CS301 - Phát triển web
            </Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              CS302 - Trí tuệ nhân tạo
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              CS103 - Thuật toán
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
