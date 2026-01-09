import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useMemo, useState } from 'react'
import { suggestTimetable } from '@/lib/api'
import type { CourseSection } from '@/lib/interface'
import { Loader2 } from 'lucide-react'

type UiScheduleItem = {
  id: string
  subjectCode: string
  subjectName: string
  day: number
  startSlot: number
  endSlot: number
  room: string
  instructorName?: string
}

const timeSlots = [
  { slot: 1, time: '07h30', period: 'Sáng' },
  { slot: 2, time: '08h30', period: 'Sáng' },
  { slot: 3, time: '09h30', period: 'Sáng' },
  { slot: 4, time: '10h30', period: 'Sáng' },
  { slot: 5, time: '11h30', period: 'Sáng' },
  { slot: 6, time: '13h00', period: 'Chiều' },
  { slot: 7, time: '14h00', period: 'Chiều' },
  { slot: 8, time: '15h00', period: 'Chiều' },
  { slot: 9, time: '16h00', period: 'Chiều' },
  { slot: 10, time: '17h00', period: 'Chiều' },
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

export function SuggestTimetable() {
  const [data, setData] = useState<CourseSection[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<string>('')

  const handleSuggest = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await suggestTimetable(preferences)
      setData(res)
    } catch (e) {
      setError((e as Error).message || 'Không thể lấy đề xuất thời khóa biểu.')
    } finally {
      setLoading(false)
    }
  }

  const registeredClasses: UiScheduleItem[] = useMemo(() => {
    if (!data || data.length === 0) return []
    const result = data
      .filter(section => section.classSchedules && section.classSchedules.length > 0)
      .flatMap(section =>
        section.classSchedules!.map(schedule => {
          // API dayOfWeek mapping:
          // "0" = Chủ Nhật (CN)
          // "1" = Thứ 2 (HAI)
          // "2" = Thứ 3 (BA)
          // "3" = Thứ 4 (TƯ)
          // "4" = Thứ 5 (NĂM)
          // "5" = Thứ 6 (SÁU)
          // "6" = Thứ 7 (BẢY)
          //
          // UI day mapping (daysOfWeek array index + 1):
          // 1 = HAI (index 0)
          // 2 = BA (index 1)
          // 3 = TƯ (index 2)
          // 4 = NĂM (index 3)
          // 5 = SÁU (index 4)
          // 6 = BẢY (index 5)
          // 7 = CN (index 6)
          //
          // So: API "0" → UI 7, API "1" → UI 1, API "2" → UI 2, ..., API "6" → UI 6
          const apiDay = parseInt(schedule.dayOfWeek, 10)
          if (isNaN(apiDay) || apiDay < 0 || apiDay > 6) {
            console.error(`Invalid dayOfWeek: "${schedule.dayOfWeek}" for schedule ${schedule.scheduleId}`)
          }
          const day = apiDay === 0 ? 7 : apiDay
          
          const item = {
            id: String(schedule.scheduleId),
            subjectCode: section.course?.code || '',
            subjectName: section.course?.name || '',
            day: day,
            startSlot: schedule.startPeriod,
            endSlot: schedule.endPeriod,
            room: schedule.room,
            instructorName: section.instructor?.fullName || '',
          }
          
          // Debug log for dayOfWeek mapping
          if (import.meta.env.DEV && (schedule.scheduleId === 39 || schedule.scheduleId === 40)) {
            console.log(`[MAP] Schedule ${schedule.scheduleId}: dayOfWeek="${schedule.dayOfWeek}" (type: ${typeof schedule.dayOfWeek}) → apiDay=${apiDay} → day=${day} → dayIndex=${day - 1} → ${daysOfWeek[day - 1]?.name}`, {
              original: schedule.dayOfWeek,
              parsed: apiDay,
              mapped: day,
              dayIndex: day - 1,
              dayName: daysOfWeek[day - 1]?.name,
              item
            })
          }
          
          return item
        })
      )
    
    if (import.meta.env.DEV) {
      console.log('All registered classes:', result)
    }
    
    return result
  }, [data])

  const getClassAtSlot = (day: number, slot: number) => {
    return registeredClasses.find(
      cls => cls.day === day && slot >= cls.startSlot && slot <= cls.endSlot
    )
  }

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
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Đề xuất thời khóa biểu</h1>
            <p className='text-muted-foreground'>
              Nhập mong muốn của bạn để hệ thống gợi ý thời khóa biểu phù hợp.
            </p>
          </div>

          {/* Preferences Input Card */}
          <Card>
            <CardHeader>
              <h2 className='text-lg font-semibold'>MONG MUỐN CỦA BẠN</h2>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='preferences'>Nhập mong muốn về thời khóa biểu</Label>
                <Textarea
                  id='preferences'
                  placeholder='Ví dụ: Tôi muốn học vào buổi sáng, không học thứ 7, ưu tiên các lớp có ít tiết học...'
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  rows={4}
                  className='resize-none'
                />
                <p className='text-sm text-muted-foreground'>
                  Mô tả chi tiết mong muốn của bạn về thời khóa biểu để hệ thống đưa ra gợi ý phù hợp nhất.
                </p>
              </div>
              <Button 
                onClick={handleSuggest} 
                disabled={loading}
                className='w-full sm:w-auto'
              >
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Gợi ý
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Preview */}
          {data && data.length > 0 && (
            <Card>
              <CardHeader className='pb-4'>
                <h2 className='text-lg font-semibold'>THỜI KHÓA BIỂU ĐỀ XUẤT</h2>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className='p-6 text-center text-muted-foreground'>
                    <Loader2 className='mx-auto h-8 w-8 animate-spin mb-2' />
                    Đang tạo đề xuất thời khóa biểu...
                  </div>
                )}
                {error && !loading && (
                  <div className='p-6 text-center text-red-600'>{error}</div>
                )}
                {!loading && !error && (
                  <>
                    {/* Schedule Table */}
                    <div className='overflow-x-auto'>
                      <table className='w-full border-collapse border border-gray-300 table-fixed'>
                        <colgroup>
                          <col className='w-20' />
                          {daysOfWeek.map((_, idx) => (
                            <col key={idx} />
                          ))}
                        </colgroup>
                        <thead>
                          <tr className='bg-gray-50'>
                            <th className='border border-gray-300 p-2 text-center font-medium w-20'>TIẾT</th>
                            {daysOfWeek.map((day) => (
                              <th key={day.name} className='border border-gray-300 p-2 text-center'>
                                <div className='font-medium'>{day.name}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlots.map((timeSlot) => (
                            <tr key={timeSlot.slot}>
                              <td className='border border-gray-300 p-2 text-center font-medium'>
                                TIẾT {timeSlot.slot}
                              </td>
                              {daysOfWeek.map((_, dayIndex) => {
                                const day = dayIndex + 1
                                
                                // Check if this slot is the start of any class
                                const startClass = registeredClasses.find(
                                  cls => cls.day === day && cls.startSlot === timeSlot.slot
                                )
                                
                                // Check if this slot is part of any class (but not the start)
                                const partOfClass = getClassAtSlot(day, timeSlot.slot)
                                
                                // Only render cell if this is the start of a class or no class at all
                                if (partOfClass && !startClass) {
                                  return null
                                }

                                const spanCount = startClass ? startClass.endSlot - startClass.startSlot + 1 : 1

                                return (
                                  <td
                                    key={dayIndex}
                                    className='border border-gray-300 p-1'
                                    rowSpan={spanCount}
                                    style={{ height: `${spanCount * 60}px` }}
                                  >
                                    {startClass && (
                                      <div className='bg-blue-100 border border-blue-300 rounded p-2 text-xs h-full flex flex-col justify-center'>
                                        <div className='font-medium'>{startClass.subjectName}</div>
                                        <div className='text-gray-600'>({startClass.subjectCode})</div>
                                        {startClass.instructorName && (
                                          <div className='text-gray-600 text-[10px]'>{startClass.instructorName}</div>
                                        )}
                                        <div className='text-gray-600'>{startClass.room}</div>
                                        <div className='text-gray-500 text-[10px] mt-1'>
                                          Tiết {startClass.startSlot}-{startClass.endSlot}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Time Legend */}
                    <div className='mt-6 grid grid-cols-2 gap-4'>
                      <div>
                        <h3 className='font-medium mb-2'>Sáng</h3>
                        <div className='space-y-1 text-sm'>
                          {timeSlots.slice(0, 5).map(slot => (
                            <div key={slot.slot} className='flex justify-between'>
                              <span>Tiết {slot.slot}:</span>
                              <span>{slot.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className='font-medium mb-2'>Chiều</h3>
                        <div className='space-y-1 text-sm'>
                          {timeSlots.slice(5).map(slot => (
                            <div key={slot.slot} className='flex justify-between'>
                              <span>Tiết {slot.slot}:</span>
                              <span>{slot.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {(!data || data.length === 0) && !loading && (
            <Card>
              <CardContent className='p-6 text-center text-muted-foreground'>
                {error ? error : 'Nhập mong muốn và nhấn nút "Gợi ý" để xem đề xuất thời khóa biểu.'}
              </CardContent>
            </Card>
          )}

        </div>
      </Main>
    </>
  )
}

export default SuggestTimetable

