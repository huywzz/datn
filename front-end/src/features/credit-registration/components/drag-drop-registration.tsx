import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, GripVertical, ChevronDown } from 'lucide-react'
import { fetchSectionsBySubject, fetchSubjects, type Section, type Subject } from './mock-api'

// Runtime state for subjects and sections (mocked APIs)
const subjectColor: Record<string, string> = {
  CS101: 'bg-blue-100 text-blue-800',
  CS102: 'bg-purple-100 text-purple-800',
  CS103: 'bg-red-100 text-red-800',
  CS301: 'bg-green-100 text-green-800',
  CS302: 'bg-orange-100 text-orange-800',
}

// Tiết học thay vì giờ cụ thể
const periods = Array.from({ length: 10 }, (_, i) => i + 1) // Tiết 1 -> 10

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

interface DragDropRegistrationProps {
  registeredSubjects: string[]
  onUpdateRegisteredSubjects: (subjects: string[]) => void
}

export function DragDropRegistration({ registeredSubjects, onUpdateRegisteredSubjects }: DragDropRegistrationProps) {
  type ScheduledCell = { subject: Subject; color: string; isHead: boolean; length: number } | null
  const [schedule, setSchedule] = useState<Record<string, Record<number, ScheduledCell>>>({})
  const [draggedSection, setDraggedSection] = useState<Section | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sectionsBySubject, setSectionsBySubject] = useState<Record<string, Section[]>>({})
  const [loadingSubject, setLoadingSubject] = useState<string | null>(null)

  // Load subjects once
  if (subjects.length === 0) {
    // fire and forget (component is client-only)
    fetchSubjects().then(setSubjects)
  }


  const handleDragStart = (e: React.DragEvent, section: Section) => {
    setDraggedSection(section)
    // Some browsers require dataTransfer to be set for drop to fire
    try {
      e.dataTransfer.setData('text/plain', section.id)
    } catch (_err) {
      // ignore
    }
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, _day: string, _period: number) => {
    e.preventDefault()
    
    if (!draggedSection) return

    const subjectInfo = subjects.find((s: Subject) => s.code === draggedSection.subjectCode) as Subject

    // Validate all meetings: boundary and conflicts
    for (const m of draggedSection.meetings) {
      const endP = m.period + m.length - 1
      if (endP > periods.length) {
        setDraggedSection(null)
        return
      }
      const dayMap = schedule[m.day] ?? {}
      for (let p = m.period; p <= endP; p++) {
        if (dayMap[p]) {
          setDraggedSection(null)
          return
        }
      }
    }

    // Place all meetings
    const newSchedule: typeof schedule = { ...schedule }
    for (const m of draggedSection.meetings) {
      const endP = m.period + m.length - 1
      const dayMap: Record<number, ScheduledCell> = { ...(newSchedule[m.day] ?? {}) }
      for (let p = m.period; p <= endP; p++) {
        dayMap[p] = {
          subject: subjectInfo,
          color: subjectColor[draggedSection.subjectCode] ?? 'bg-muted text-foreground',
          isHead: p === m.period,
          length: p === m.period ? m.length : 0,
        }
      }
      newSchedule[m.day] = dayMap
    }

    setSchedule(newSchedule)

    // Add to registered subjects if not already
    const subjectCode = draggedSection.subjectCode
    if (!registeredSubjects.includes(subjectCode)) {
      onUpdateRegisteredSubjects([...registeredSubjects, subjectCode])
    }

    setDraggedSection(null)
  }

  const removeFromSchedule = (day: string, period: number) => {
    const cell = schedule[day]?.[period]
    if (!cell) return

    // Determine the head cell
    let headPeriod = period
    if (cell && !cell.isHead) {
      // scan backwards to find head
      for (let p = period - 1; p >= 1; p--) {
        const prevCell = schedule[day]?.[p]
        if (prevCell?.isHead) {
          headPeriod = p
          break
        }
        if (!prevCell) break
      }
    }

    const headCell = schedule[day]?.[headPeriod]
    if (!headCell) return

    const len = headCell.isHead ? headCell.length : 1
    const newDayMap: Record<number, ScheduledCell> = { ...(schedule[day] ?? {}) }
    for (let p = headPeriod; p < headPeriod + len; p++) {
      newDayMap[p] = null
    }
    setSchedule(prev => ({ ...prev, [day]: newDayMap }))

    // Remove from registered subjects
    onUpdateRegisteredSubjects(registeredSubjects.filter(code => code !== headCell.subject.code))
  }

  const getRegisteredCredits = () => {
    return registeredSubjects.reduce((total, subjectCode) => {
      const subject = subjects.find((s) => s.code === subjectCode)
      return total + (subject?.credits || 0)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Đăng ký bằng kéo thả</h3>
              <p className="text-green-700">Kéo các môn học vào thời khóa biểu</p>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {getRegisteredCredits()} tín chỉ
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Subjects */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Môn học có sẵn
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-3">
                {subjects.map((subject) => {
                  const sections = sectionsBySubject[subject.code] ?? []
                  const isLoading = loadingSubject === subject.code
                  return (
                    <div key={subject.code} className={`rounded-lg border p-3 ${subjectColor[subject.code] ?? 'bg-muted'}`}>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 opacity-50" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{subject.name}</div>
                          <div className="text-xs opacity-80">{subject.code} • {subject.credits} tín chỉ</div>
                          <Badge variant="outline" className="text-xs mt-1">{subject.type}</Badge>
                        </div>
                        <button
                          className="inline-flex items-center h-8 px-2 text-xs rounded border bg-white"
                          onClick={async () => {
                            if (sectionsBySubject[subject.code]) return
                            setLoadingSubject(subject.code)
                            const data = await fetchSectionsBySubject(subject.code)
                            setSectionsBySubject((prev) => ({ ...prev, [subject.code]: data }))
                            setLoadingSubject(null)
                          }}
                        >
                          {isLoading ? 'Đang tải...' : 'Xem nhóm học phần'} <ChevronDown className="ml-1 h-3 w-3" />
                        </button>
                      </div>
                      {sections.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {sections.map((sec) => (
                            <div
                              key={sec.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, sec)}
                              className="p-2 rounded border cursor-grab active:cursor-grabbing bg-white"
                            >
                              <div className="text-sm font-medium">{sec.classCode}</div>
                              <div className="text-xs opacity-80">{sec.teacher} • {sec.room}</div>
                              <div className="text-[11px] mt-1 text-muted-foreground">
                                {sec.meetings.map(m => `${m.day} tiết ${m.period}-${m.period + m.length - 1}`).join(' • ')}
                              </div>
                              <div className="text-[11px] text-blue-700 mt-1">Kéo học phần vào tiết bắt đầu tương ứng</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thời khóa biểu
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Header */}
                  <div className="grid grid-cols-8 gap-2 mb-4">
                    <div className="p-2 text-center font-medium text-sm text-muted-foreground">Tiết</div>
                    {days.map(day => (
                      <div key={day} className="p-2 text-center font-medium text-sm bg-muted/50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Period rows */}
                  {periods.map(period => (
                    <div key={period} className="grid grid-cols-8 gap-2 mb-2">
                      <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30 rounded">
                        Tiết {period}
                      </div>
                      {days.map(day => {
                        const cell = schedule[day]?.[period]
                        return (
                          <div
                            key={`${day}-${period}`}
                            className={`min-h-[60px] p-2 rounded border-2 ${cell ? 'border-solid' : 'border-dashed border-muted-foreground/20 hover:border-primary/30'} transition-all duration-200`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day, period)}
                          >
                            {cell ? (
                              cell.isHead ? (
                                <div className={`p-2 rounded text-xs ${cell.color}`}>
                                  <div className="font-medium">{cell.subject.code}</div>
                                  <div className="text-xs opacity-80">{cell.subject.name}</div>
                                  <div className="text-[10px] opacity-70 mt-1">{`Tiết ${period} - ${period + cell.length - 1}`}</div>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full mt-1 h-5 text-xs"
                                    onClick={() => removeFromSchedule(day, period)}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-muted-foreground/60 text-center pt-2">Đã chiếm</div>
                              )
                            ) : (
                              <div className="text-xs text-muted-foreground/50 text-center pt-2">
                                Kéo môn học vào đây
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn sử dụng:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Bấm “Xem nhóm học phần”, chọn 1 lớp học phần và kéo sang thời khóa biểu.</li>
            <li>• Lịch sẽ tự động đặt theo thông tin của lớp học phần (ngày, tiết bắt đầu, số tiết).</li>
            <li>• Không thể thả nếu trùng lịch với các lớp đã có.</li>
            <li>• Nhấn "Xóa" tại ô đầu để hủy đăng ký môn (sẽ giải phóng toàn bộ các tiết đã chiếm).</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}