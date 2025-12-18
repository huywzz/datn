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
                  
                  // Check if this is the head cell (start period)
                  const isHead = schedule && slot === schedule.startPeriod
                  
                  return (
                    <div
                      key={`${day}-${slot}`}
                      className={`min-h-[70px] p-2 rounded border-2 border-dashed border-muted-foreground/20 transition-all duration-200 ${
                        hoveredSlot === `${day}-${slot}` ? 'border-primary/50 bg-primary/5' : ''
                      } ${schedule ? 'border-solid' : ''}`}
                      onMouseEnter={() => setHoveredSlot(`${day}-${slot}`)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      {schedule && (
                        isHead ? (
                          // Head cell - show full info with X button on top right
                          <div className={`relative p-3 rounded-lg shadow-sm text-xs bg-blue-100 text-blue-800 border border-blue-200 transition-all hover:shadow-md ${!isRegistered ? 'opacity-50' : ''}`}>
                            {isRegistered && (
                              <button
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-md transition-all hover:scale-110 z-20"
                                onClick={() => subjectCode && onRemoveSubject(subjectCode)}
                                title="Hủy môn học"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            <div className="font-bold text-sm mb-1">{subjectCode}</div>
                            <div className="text-xs font-medium opacity-90 line-clamp-2 leading-tight mb-2">{schedule.section.courseName}</div>
                            <div className="flex items-center gap-1 text-[10px] opacity-75">
                              <User className="h-3 w-3" />
                              <span>GV: {schedule.section.instructorId}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-75">
                              <MapPin className="h-3 w-3" />
                              <span>{schedule.room}</span>
                            </div>
                          </div>
                        ) : (
                          // Continuation cell - just show color
                          <div className={`p-3 rounded-lg shadow-sm bg-blue-100 border border-blue-200 min-h-[46px] transition-all ${!isRegistered ? 'opacity-50' : ''}`}></div>
                        )
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
