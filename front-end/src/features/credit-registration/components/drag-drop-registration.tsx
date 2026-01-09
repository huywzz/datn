import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, GripVertical, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  getCourseSections,
  registerSection,
  type CourseSection as ApiCourseSection,
  getMySchedule,
  deleteRegistration,
} from '@/lib/api'
import type { MyScheduleItem } from '@/lib/interface'
import { useAvailableCourses, type Subject } from '../hooks/use-available-courses'

// Runtime state for subjects and sections
const subjectColor: Record<string, string> = {
  CS101: 'bg-blue-100 text-blue-800',
  CS102: 'bg-purple-100 text-purple-800',
  CS103: 'bg-red-100 text-red-800',
  CS301: 'bg-green-100 text-green-800',
  CS302: 'bg-orange-100 text-orange-800',
}

// Generate color for subject code if not in predefined list
const getSubjectColor = (code: string): string => {
  if (subjectColor[code]) {
    return subjectColor[code]
  }
  // Generate a consistent color based on code
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-red-100 text-red-800',
    'bg-green-100 text-green-800',
    'bg-orange-100 text-orange-800',
    'bg-yellow-100 text-yellow-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
  ]
  const index = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

// Subject interface is now imported from use-available-courses hook

interface Section {
  id: string
  classCode: string
  subjectCode: string
  teacher: string
  room: string
  meetings: Array<{ day: 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN'; period: number; length: number }>
  maxStudents?: number
  currentStudents?: number
}

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

// Map API CourseSection to internal Section format
const mapApiSectionToSection = (apiSection: ApiCourseSection, subjectCode: string): Section => {
  // Parse classSchedules from API response
  const classSchedules = apiSection.classSchedules || []

  // Convert classSchedules to meetings format
  const meetings = classSchedules
    .filter(schedule => schedule && schedule.dayOfWeek && schedule.startPeriod && schedule.endPeriod)
    .map(schedule => ({
      day: mapDayOfWeek(schedule.dayOfWeek),
      period: schedule.startPeriod,
      length: schedule.endPeriod - schedule.startPeriod + 1,
    }))

  // Get room from first schedule or use schedule string
  const room = classSchedules.length > 0
    ? classSchedules[0].room
    : apiSection.schedule?.split(' - ')[1] || 'Chưa có thông tin'

  // Get instructor name
  const teacher = apiSection.instructor?.fullName || 'Chưa có thông tin'

  return {
    id: apiSection.sectionId?.toString() || `section-${Date.now()}`,
    classCode: apiSection.sectionCode || `SECTION-${apiSection.sectionId}`,
    subjectCode,
    teacher,
    room,
    meetings,
    maxStudents: apiSection.maxStudents,
    currentStudents: apiSection.currentStudents,
  }
}

// Tiết học thay vì giờ cụ thể
const periods = Array.from({ length: 10 }, (_, i) => i + 1) // Tiết 1 -> 10

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

interface DragDropRegistrationProps {
  registeredSubjects: string[]
  onUpdateRegisteredSubjects: (subjects: string[]) => void
}

export function DragDropRegistration({ registeredSubjects, onUpdateRegisteredSubjects }: DragDropRegistrationProps) {
  type ScheduledCell = {
    subject: Subject
    sectionId: string // Add sectionId to track which section this cell belongs to
    sectionCode: string // Section code from API (e.g., DTDM-05)
    color: string
    isHead: boolean
    length: number
    registrationId?: number
  } | null
  const [schedule, setSchedule] = useState<Record<string, Record<number, ScheduledCell>>>({})
  const [draggedSection, setDraggedSection] = useState<Section | null>(null)
  const [sectionsBySubject, setSectionsBySubject] = useState<Record<string, Section[]>>({})
  const [loadingSubject, setLoadingSubject] = useState<string | null>(null)
  const [registeringSectionIds, setRegisteringSectionIds] = useState<Set<number>>(new Set())
  const [removingRegistrationIds, setRemovingRegistrationIds] = useState<Set<number>>(new Set())
  const [hasSyncedInitialSchedule, setHasSyncedInitialSchedule] = useState(false)
  const [subjectsCardHeight, setSubjectsCardHeight] = useState<number | undefined>(undefined)
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set())
  const [conflictedCells, setConflictedCells] = useState<Set<string>>(new Set())

  // Refs to measure schedule card height
  const scheduleCardRef = useRef<HTMLDivElement>(null)

  // Use shared hook with React Query caching
  const { subjects, isLoading, error } = useAvailableCourses()

  const syncScheduleFromServer = useCallback(async () => {
    if (!subjects || subjects.length === 0) return
    try {
      const mySchedule = await getMySchedule()
      const apiSchedules: MyScheduleItem[] = mySchedule?.schedules ?? []
      const newSchedule: typeof schedule = {}
      const newRegisteredSubjects = new Set<string>()

      for (const s of apiSchedules) {
        const day = mapDayOfWeek(s.dayOfWeek)
        const start = s.startPeriod
        const end = s.endPeriod
        const length = end - start + 1
        const subjectCode = s.section.courseCode

        const subjectInfo = subjects.find((sub) => sub.code === subjectCode)
        if (!subjectInfo) continue

        const dayMap: Record<number, ScheduledCell> = { ...(newSchedule[day] ?? {}) }
        for (let p = start; p <= end; p++) {
          dayMap[p] = {
            subject: subjectInfo,
            sectionId: String(s.section.sectionId),
            sectionCode: s.section.sectionCode,
            color: getSubjectColor(subjectCode),
            isHead: p === start,
            length: p === start ? length : 0,
            registrationId: s.registrationId,
          }
        }
        newSchedule[day] = dayMap
        newRegisteredSubjects.add(subjectCode)
      }

      setSchedule(newSchedule)
      onUpdateRegisteredSubjects(Array.from(newRegisteredSubjects))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      toast.error('Không thể đồng bộ thời khóa biểu')
    }
  }, [subjects, onUpdateRegisteredSubjects])

  // Hydrate current timetable from API on mount (after subjects are loaded)
  useEffect(() => {
    if (hasSyncedInitialSchedule) return
    if (!subjects || subjects.length === 0) return
      ; (async () => {
        await syncScheduleFromServer()
        setHasSyncedInitialSchedule(true)
      })()
  }, [subjects, hasSyncedInitialSchedule, syncScheduleFromServer])

  // Sync subjects card height with schedule card height
  useEffect(() => {
    const updateHeight = () => {
      if (scheduleCardRef.current) {
        setSubjectsCardHeight(scheduleCardRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [isLoading])

  const handleDragStart = (e: React.DragEvent, section: Section) => {
    setDraggedSection(section)
    setHighlightedCells(new Set())
    // Some browsers require dataTransfer to be set for drop to fire
    try {
      e.dataTransfer.setData('text/plain', section.id)
    } catch (_err) {
      // ignore
    }
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, day: string, period: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Calculate which cells will be occupied based on draggedSection's meetings
    if (draggedSection && draggedSection.meetings && draggedSection.meetings.length > 0) {
      const cellsToHighlight = new Set<string>()
      const cellsWithConflict = new Set<string>()
      
      // Add all cells that will be occupied by this section's meetings
      for (const m of draggedSection.meetings) {
        const endP = m.period + m.length - 1
        
        // Check boundary
        if (m.period < 1 || endP > periods.length) {
          // Out of bounds - mark all cells as conflicted
          for (let p = m.period; p <= endP; p++) {
            if (p >= 1 && p <= periods.length) {
              cellsToHighlight.add(`${m.day}-${p}`)
              cellsWithConflict.add(`${m.day}-${p}`)
            }
          }
          continue
        }
        
        // Check conflicts with existing schedule
        const dayMap = schedule[m.day] ?? {}
        let hasConflict = false
        
        for (let p = m.period; p <= endP; p++) {
          const cellKey = `${m.day}-${p}`
          cellsToHighlight.add(cellKey)
          
          // Check if this cell is already occupied
          const existingCell = dayMap[p]
          if (existingCell) {
            hasConflict = true
            cellsWithConflict.add(cellKey)
          }
        }
      }
      
      setHighlightedCells(cellsToHighlight)
      setConflictedCells(cellsWithConflict)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear highlight if leaving the schedule area entirely
    const target = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!target.contains(relatedTarget)) {
      setHighlightedCells(new Set())
      setConflictedCells(new Set())
    }
  }

  const handleDragEnd = () => {
    setDraggedSection(null)
    setHighlightedCells(new Set())
    setConflictedCells(new Set())
  }

  const handleDrop = async (e: React.DragEvent, _dropDay: string, _dropPeriod: number) => {
    e.preventDefault()
    setHighlightedCells(new Set())
    setConflictedCells(new Set())

    if (!draggedSection) {
      return
    }

    if (!draggedSection.meetings || draggedSection.meetings.length === 0) {
      toast.error('Lớp học phần này không có lịch học')
      setDraggedSection(null)
      return
    }

    const subjectInfo = subjects.find((s: Subject) => s.code === draggedSection.subjectCode)
    if (!subjectInfo) {
      toast.error('Không tìm thấy thông tin môn học')
      setDraggedSection(null)
      return
    }

    // Check if this section is already in the schedule
    for (const day of Object.keys(schedule)) {
      const dayMap = schedule[day]
      if (!dayMap) continue
      for (const periodKey of Object.keys(dayMap)) {
        const cell = dayMap[Number(periodKey)]
        if (cell && cell.sectionId === draggedSection.id) {
          toast.info('Lớp học phần này đã được thêm vào thời khóa biểu')
          setDraggedSection(null)
          return
        }
      }
    }

    // Note: When a section has multiple meetings, we place ALL meetings at their API-defined positions
    // regardless of where the user drops. This is correct behavior since the schedule is fixed.
    // The drop location is only used to trigger the placement - actual positions come from API.

    // Validate all meetings: boundary and conflicts
    const conflicts: Array<{ day: string; period: number }> = []
    for (const m of draggedSection.meetings) {
      const endP = m.period + m.length - 1

      // Check boundary
      if (m.period < 1 || endP > periods.length) {
        toast.error(`Lịch học vượt quá giới hạn: ${m.day} tiết ${m.period}-${endP}`)
        setDraggedSection(null)
        return
      }

      // Check conflicts
      const dayMap = schedule[m.day] ?? {}
      for (let p = m.period; p <= endP; p++) {
        const existingCell = dayMap[p]
        if (existingCell) {
          conflicts.push({ day: m.day, period: p })
        }
      }
    }

    // If there are conflicts, show error and don't place
    if (conflicts.length > 0) {
      const conflictDetails = conflicts
        .map(c => `${c.day} tiết ${c.period}`)
        .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
        .join(', ')
      toast.error(`Xung đột lịch học tại: ${conflictDetails}`)
      setDraggedSection(null)
      return
    }

    // Place all meetings at their correct positions (from API data)
    const newSchedule: typeof schedule = { ...schedule }
    const placedMeetings: string[] = []
    const sectionIdNum = Number(draggedSection.id)

    for (const m of draggedSection.meetings) {
      const endP = m.period + m.length - 1
      const dayMap: Record<number, ScheduledCell> = { ...(newSchedule[m.day] ?? {}) }

      // Place all periods for this meeting
      for (let p = m.period; p <= endP; p++) {
        dayMap[p] = {
          subject: subjectInfo,
          sectionId: draggedSection.id, // Store sectionId to track all cells of this section
          sectionCode: draggedSection.classCode,
          color: getSubjectColor(draggedSection.subjectCode),
          isHead: p === m.period,
          length: p === m.period ? m.length : 0,
        }
      }

      newSchedule[m.day] = dayMap
      placedMeetings.push(`${m.day} tiết ${m.period}-${endP}`)
    }

    // Optimistically update the UI
    setSchedule(newSchedule)
    const subjectCode = draggedSection.subjectCode
    if (!registeredSubjects.includes(subjectCode)) {
      onUpdateRegisteredSubjects([...registeredSubjects, subjectCode])
    }

    // Register with API
    setRegisteringSectionIds(prev => new Set(prev).add(sectionIdNum))
    try {
      await registerSection(sectionIdNum)

      // Update currentStudents count for this section (optimistic update)
      setSectionsBySubject((prev) => {
        const newState = { ...prev }
        const subjectCode = draggedSection.subjectCode
        const sections = newState[subjectCode]
        if (sections) {
          newState[subjectCode] = sections.map((sec) => {
            if (sec.id === draggedSection.id) {
              const current = sec.currentStudents ?? 0
              const max = sec.maxStudents ?? 0
              return {
                ...sec,
                currentStudents: Math.min(current + 1, max),
              }
            }
            return sec
          })
        }
        return newState
      })

      // Show success message with meeting details
      if (placedMeetings.length > 1) {
        toast.success(
          `Đã đăng ký ${subjectInfo.name} vào ${placedMeetings.length} buổi học: ${placedMeetings.join(', ')}`,
          { duration: 4000 }
        )
      } else {
        toast.success(`Đã đăng ký ${subjectInfo.name} vào thời khóa biểu: ${placedMeetings[0]}`)
      }

      await syncScheduleFromServer()
    } catch (error) {
      // Revert optimistic update on error
      setSchedule(schedule)
      if (!registeredSubjects.includes(subjectCode)) {
        onUpdateRegisteredSubjects(registeredSubjects.filter(code => code !== subjectCode))
      }

      const errorMessage = error instanceof Error ? error.message : 'Đăng ký lớp học phần thất bại'
      toast.error(errorMessage)
    } finally {
      setRegisteringSectionIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(sectionIdNum)
        return newSet
      })
    }

    setDraggedSection(null)
  }

  const removeFromSchedule = async (day: string, period: number) => {
    const cell = schedule[day]?.[period]
    if (!cell) return

    // Get the sectionId from the cell
    const sectionIdToRemove = cell.sectionId
    const subjectCodeToRemove = cell.subject.code
    const registrationId = cell.registrationId

    // Gọi API nếu có registrationId hoặc sectionId
    if (registrationId || sectionIdToRemove) {
      const sectionIdNum = sectionIdToRemove ? Number(sectionIdToRemove) : undefined
      const loadingKey = registrationId || sectionIdNum || 0

      setRemovingRegistrationIds((prev) => new Set(prev).add(loadingKey))
      try {
        await deleteRegistration(registrationId, sectionIdNum)
        
        // Update currentStudents count for this section (optimistic update)
        if (sectionIdToRemove) {
          setSectionsBySubject((prev) => {
            const newState = { ...prev }
            const subjectCode = subjectCodeToRemove
            const sections = newState[subjectCode]
            if (sections) {
              newState[subjectCode] = sections.map((sec) => {
                if (sec.id === sectionIdToRemove) {
                  const current = sec.currentStudents ?? 0
                  return {
                    ...sec,
                    currentStudents: Math.max(current - 1, 0),
                  }
                }
                return sec
              })
            }
            return newState
          })
        }
        
        toast.success(`Đã xóa ${cell.subject.name} khỏi thời khóa biểu`)
        await syncScheduleFromServer()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể xóa lớp học phần'
        toast.error(errorMessage)
      } finally {
        setRemovingRegistrationIds((prev) => {
          const next = new Set(prev)
          next.delete(loadingKey)
          return next
        })
      }
      return
    }

    if (!sectionIdToRemove) {
      // Fallback: remove only this day's meeting if sectionId is not available
      let headPeriod = period
      if (!cell.isHead) {
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
      const newSchedule = { ...schedule }
      const newDayMap: Record<number, ScheduledCell> = { ...(newSchedule[day] ?? {}) }

      for (let p = headPeriod; p < headPeriod + len; p++) {
        delete newDayMap[p]
      }

      if (Object.keys(newDayMap).length === 0) {
        delete newSchedule[day]
      } else {
        newSchedule[day] = newDayMap
      }

      setSchedule(newSchedule)
      onUpdateRegisteredSubjects(registeredSubjects.filter(code => code !== subjectCodeToRemove))
      return
    }

    // Remove all cells with the same sectionId across all days
    const newSchedule: typeof schedule = { ...schedule }
    let hasRemovedCells = false

    // Iterate through all days and periods to find and remove cells with matching sectionId
    for (const scheduleDay of Object.keys(newSchedule)) {
      const dayMap = newSchedule[scheduleDay]
      if (!dayMap) continue

      const updatedDayMap: Record<number, ScheduledCell> = {}
      let dayHasChanges = false

      for (const periodKey of Object.keys(dayMap)) {
        const periodNum = Number(periodKey)
        const cellToCheck = dayMap[periodNum]

        if (cellToCheck && cellToCheck.sectionId === sectionIdToRemove) {
          // Skip this cell (remove it)
          dayHasChanges = true
          hasRemovedCells = true
        } else {
          // Keep this cell
          updatedDayMap[periodNum] = cellToCheck
        }
      }

      if (dayHasChanges) {
        if (Object.keys(updatedDayMap).length === 0) {
          delete newSchedule[scheduleDay]
        } else {
          newSchedule[scheduleDay] = updatedDayMap
        }
      }
    }

    if (hasRemovedCells) {
      setSchedule(newSchedule)
      // Remove from registered subjects
      onUpdateRegisteredSubjects(registeredSubjects.filter(code => code !== subjectCodeToRemove))
      toast.success(`Đã xóa ${cell.subject.name} khỏi thời khóa biểu`)
    }
  }

  const getRegisteredCredits = () => {
    return registeredSubjects.reduce((total, subjectCode) => {
      const subject = subjects.find((s) => s.code === subjectCode)
      return total + (subject?.credits || 0)
    }, 0)
  }

  if (isLoading) {
    return (
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
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-white-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Đăng ký bằng kéo thả</h3>
              <p className="text-black">Kéo các môn học vào thời khóa biểu</p>
            </div>
            <div className="text-2xl font-bold text-black">
              {getRegisteredCredits()} tín chỉ
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:items-start">
        {/* Available Subjects - height synced with schedule card */}
        <Card
          className="lg:col-span-1 flex flex-col"
          style={{ height: subjectsCardHeight ? `${subjectsCardHeight}px` : 'auto' }}
        >
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Môn học có sẵn
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-3">
              {subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Không có môn học nào</p>
                </div>
              ) : (
                subjects.map((subject) => {
                  const sections = sectionsBySubject[subject.code] ?? []
                  return (
                    <div key={subject.code} className={`rounded-lg border p-3 ${getSubjectColor(subject.code)}`}>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 opacity-50" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{subject.name}</div>
                          <div className="text-xs opacity-80">{subject.code} • {subject.credits} tín chỉ</div>
                          {/* <Badge variant="outline" className="text-xs mt-1">{subject.type}</Badge> */}
                        </div>
                        <button
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={loadingSubject === subject.code}
                          onClick={async () => {
                            if (sectionsBySubject[subject.code]) {
                              // Toggle: hide sections if already loaded
                              setSectionsBySubject((prev) => {
                                const newState = { ...prev }
                                delete newState[subject.code]
                                return newState
                              })
                              return
                            }

                            setLoadingSubject(subject.code)
                            try {
                              const apiSectionsData = await getCourseSections(subject.courseId)
                              const apiSections = apiSectionsData.data || []
                              const mappedSections = apiSections.map((apiSection) =>
                                mapApiSectionToSection(apiSection, subject.code)
                              )
                              setSectionsBySubject((prev) => ({ ...prev, [subject.code]: mappedSections }))

                              if (mappedSections.length === 0) {
                                toast.info('Không có lớp học phần nào cho môn học này')
                              }
                            } catch (err) {
                              const errorMessage = err instanceof Error ? err.message : 'Không thể tải nhóm học phần'
                              toast.error(errorMessage)
                            } finally {
                              setLoadingSubject(null)
                            }
                          }}
                          title={sectionsBySubject[subject.code] ? 'Ẩn nhóm học phần' : 'Xem nhóm học phần'}
                        >
                          {loadingSubject === subject.code ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : sectionsBySubject[subject.code] ? (
                            <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                          ) : (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                          )}
                        </button>
                      </div>
                      {sections.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {sections.map((sec) => {
                            const sectionIdNum = Number(sec.id)
                            const isRegistering = registeringSectionIds.has(sectionIdNum)
                            const isRegistered = Object.values(schedule).some(dayMap =>
                              Object.values(dayMap || {}).some(cell => cell?.sectionId === sec.id)
                            )

                            return (
                              <div
                                key={sec.id}
                                draggable={!isRegistering && !isRegistered}
                                onDragStart={(e) => !isRegistering && !isRegistered && handleDragStart(e, sec)}
                                onDragEnd={handleDragEnd}
                                className={`p-2 rounded border bg-white transition-opacity space-y-1 ${isRegistering || isRegistered
                                  ? 'opacity-60 cursor-not-allowed'
                                  : 'cursor-grab active:cursor-grabbing'
                                  }`}
                              >
                                {/* Mã */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-semibold">{sec.classCode}</span>
                                  <span className="text-xs font-semibold">SL:</span>
                                  <span className="text-xs font-semibold">{sec.currentStudents}/{sec.maxStudents}</span>
                                  {isRegistering && (
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                  )}
                                </div>

                                {/* Giáo viên */}
                                <div className="text-[11px] text-gray-600">
                                  GV: {sec.teacher}
                                </div>

                                {/* Phòng */}
                                <div className="text-[11px] text-gray-600">
                                  Phòng: {sec.room}
                                </div>

                                {/* Lịch học */}
                                <div className="text-[11px] text-gray-600">
                                  {sec.meetings.map(m => `${m.day} tiết ${m.period}-${m.period + m.length - 1}`).join(' • ')}
                                </div>

                                {/* Trạng thái - Đẩy xuống dưới cùng */}
                                <div className="pt-1 border-t">
                                  {isRegistering ? (
                                    <span className="text-[10px] text-blue-600">Đang đăng ký...</span>
                                  ) : isRegistered ? (
                                    <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800 px-2 py-0">
                                      Đã đăng ký
                                    </Badge>
                                  ) : (
                                    <span className="text-[10px] text-gray-500 italic">
                                      {sec.meetings.length > 1
                                        ? `Kéo vào ô trống - ${sec.meetings.length} buổi học`
                                        : `Kéo vào ${sec.meetings[0]?.day} tiết ${sec.meetings[0]?.period}`
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card ref={scheduleCardRef} className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thời khóa biểu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" onDragLeave={handleDragLeave}>
              <div className="min-w-[600px]">
                {/* Header */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 mb-4">
                  <div className="p-2 text-center font-medium text-sm text-muted-foreground">Tiết</div>
                  {days.map(day => (
                    <div key={day} className="p-2 text-center font-medium text-sm bg-muted/50 rounded">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Period rows */}
                {periods.map(period => (
                  <div key={period} className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 mb-2">
                    <div className="p-2 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded">
                      Tiết {period}
                    </div>
                    {days.map(day => {
                      const cell = schedule[day]?.[period]
                      const isDropZone = !cell
                      const cellKey = `${day}-${period}`
                      const isHighlighted = highlightedCells.has(cellKey)
                      const isConflicted = conflictedCells.has(cellKey)
                      return (
                        <div
                          key={cellKey}
                          className={`min-h-[70px] p-2 rounded border-2 transition-all duration-200 ${
                            cell
                              ? 'border-solid'
                              : isHighlighted
                                ? isConflicted
                                  ? 'border-dashed border-red-500/70 bg-red-500/15'
                                  : 'border-dashed border-primary/50 bg-primary/10'
                                : 'border-dashed border-muted-foreground/20 hover:border-primary/30 hover:bg-primary/5'
                          }`}
                          onDragOver={isDropZone ? (e) => handleDragOver(e, day, period) : undefined}
                          onDrop={isDropZone ? (e) => handleDrop(e, day, period) : undefined}
                        >
                          {cell ? (
                            cell.isHead ? (
                              <div className={`relative p-3 rounded-lg shadow-sm ${cell.color} border transition-all hover:shadow-md flex items-center justify-center ${
                                cell.sectionId && registeringSectionIds.has(Number(cell.sectionId)) ? 'opacity-60' : ''
                              }`}>
                                {!(cell.sectionId && registeringSectionIds.has(Number(cell.sectionId))) && (
                                  <button
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-md transition-all hover:scale-110 z-20"
                                    onClick={() => removeFromSchedule(day, period)}
                                    disabled={
                                      Boolean(
                                        (cell.registrationId && removingRegistrationIds.has(cell.registrationId)) ||
                                        (cell.sectionId && removingRegistrationIds.has(Number(cell.sectionId)))
                                      )
                                    }
                                    title="Xóa môn học"
                                  >
                                    {(cell.registrationId && removingRegistrationIds.has(cell.registrationId)) ||
                                      (cell.sectionId && removingRegistrationIds.has(Number(cell.sectionId))) ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                                <div className="font-bold text-sm !text-gray-900 text-center drop-shadow-sm">
                                  {cell.sectionCode || `${cell.subject.code} (no sectionCode)`}
                                </div>
                              </div>
                            ) : (
                              <div className={`p-3 rounded-lg shadow-sm ${cell.color} border min-h-[46px] transition-all ${
                                cell.sectionId && registeringSectionIds.has(Number(cell.sectionId)) ? 'opacity-60' : ''
                              }`}></div>
                            )
                          ) : (
                            <div className="text-xs text-muted-foreground/50 text-center pt-2">
                              {isDropZone ? 'Kéo vào đây' : ''}
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