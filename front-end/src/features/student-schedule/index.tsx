import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ClassSchedule = {
  id: string
  subjectCode: string
  subjectName: string
  credits: number
  type: 'Bắt buộc' | 'Tự chọn'
  day: number // 1-7 (Thứ 2 = 1, Chủ nhật = 7)
  startSlot: number // 1-10
  endSlot: number // 1-10
  room: string
  lecturer: string
}

const registeredClasses: ClassSchedule[] = [
  {
    id: 'CLC101-1',
    subjectCode: 'CLC101',
    subjectName: 'Cơ sở lập trình',
    credits: 3,
    type: 'Bắt buộc',
    day: 1, // Thứ 2
    startSlot: 1,
    endSlot: 3,
    room: 'A1-201',
    lecturer: 'Nguyễn Văn A',
  },
  {
    id: 'THCS201-2',
    subjectCode: 'THCS201',
    subjectName: 'Cấu trúc dữ liệu',
    credits: 3,
    type: 'Bắt buộc',
    day: 3, // Thứ 4
    startSlot: 6,
    endSlot: 8,
    room: 'A2-305',
    lecturer: 'Trần Thị B',
  },
  {
    id: 'WEB301-1',
    subjectCode: 'WEB301',
    subjectName: 'Lập trình Web',
    credits: 3,
    type: 'Tự chọn',
    day: 5, // Thứ 6
    startSlot: 1,
    endSlot: 2,
    room: 'LAB-404',
    lecturer: 'Lê Văn C',
  },
  {
    id: 'TEST-1',
    subjectCode: 'TEST',
    subjectName: 'Lớp 1 tiết',
    credits: 1,
    type: 'Tự chọn',
    day: 2, // Thứ 3
    startSlot: 3,
    endSlot: 3,
    room: 'A1-101',
    lecturer: 'Test GV',
  },
]

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

export function StudentSchedule() {

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
          {/* <ConfigDrawer /> */}
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className='overflow-y-auto'>
        <div className='flex flex-col gap-6 p-6'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Thời khóa biểu tạm thời</h1>
            <p className='text-muted-foreground'>Xem thời khóa biểu các lớp bạn đã đăng ký.</p>
          </div>

          {/* Schedule Preview */}
          <Card>
            <CardHeader className='pb-4'>
              <h2 className='text-lg font-semibold'>THỜI KHÓA BIỂU TUẦN</h2>
            </CardHeader>
            <CardContent>
              {/* Schedule Table */}
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse border border-gray-300'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='border border-gray-300 p-2 text-center font-medium'>TIẾT</th>
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
            </CardContent>
          </Card>

        </div>
      </Main>
    </>
  )
}

export default StudentSchedule


