import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, User, X } from 'lucide-react'
import { getMySchedule } from '@/lib/api'
import type { MyScheduleData, MyScheduleItem } from '@/lib/interface'

const timeSlots = Array.from({ length: 10 }).map((_, i) => i + 1) // 1..10 periods

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

interface SchedulePreviewProps {
  registeredSubjects: string[]
  onRemoveSubject: (subjectCode: string) => void
}

export function SchedulePreview({ registeredSubjects, onRemoveSubject }: SchedulePreviewProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [data, setData] = useState<MyScheduleData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await getMySchedule()
        if (!mounted) return
        setData(res)
      } catch (e) {
        if (!mounted) return
        setError((e as Error).message || 'Không thể tải thời khóa biểu.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const schedules: MyScheduleItem[] = useMemo(() => data?.schedules ?? [], [data])

  const getScheduleAt = (day: string, period: number) => {
    const dayIndex = day === 'CN' ? 0 : days.indexOf(day) + 1 // API uses 0..6
    return schedules.find(
      (s) => Number(s.dayOfWeek) === dayIndex && period >= s.startPeriod && period <= s.endPeriod
    )
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
        {loading && (
          <div className="p-4 text-center text-muted-foreground">Đang tải thời khóa biểu...</div>
        )}
        {error && !loading && (
          <div className="p-4 text-center text-red-600">{error}</div>
        )}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="p-2 text-center font-medium text-sm text-muted-foreground">Tiết</div>
              {days.map(day => (
                <div key={day} className="p-2 text-center font-medium text-sm bg-muted/50 rounded">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {timeSlots.map(slot => (
              <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30 rounded">
                  Tiết {slot}
                </div>
                {days.map(day => {
                  const schedule = getScheduleAt(day, slot)
                  const subjectCode = schedule?.section.courseCode
                  const isRegistered = subjectCode ? isSubjectRegistered(subjectCode) : false
                  
                  return (
                    <div
                      key={`${day}-${slot}`}
                      className={`min-h-[60px] p-2 rounded border-2 border-dashed border-muted-foreground/20 transition-all duration-200 ${
                        hoveredSlot === `${day}-${slot}` ? 'border-primary/50 bg-primary/5' : ''
                      } ${schedule ? 'border-solid' : ''}`}
                      onMouseEnter={() => setHoveredSlot(`${day}-${slot}`)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      {schedule && (
                        <div className={`p-2 rounded text-xs bg-blue-100 text-blue-800 ${!isRegistered ? 'opacity-50' : ''}`}>
                          <div className="font-medium">{subjectCode}</div>
                          <div className="text-xs opacity-80">{schedule.section.courseName}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs">GV: {schedule.section.instructorId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{schedule.room}</span>
                          </div>
                          {isRegistered && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full mt-2 h-6 text-xs"
                              onClick={() => subjectCode && onRemoveSubject(subjectCode)}
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
            {Array.from(new Set((data?.schedules ?? []).map(s => `${s.section.courseCode} - ${s.section.courseName}`))).map((label) => (
              <Badge key={label} variant="outline" className="bg-blue-100 text-blue-800">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
