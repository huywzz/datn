import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  createExchangeTransaction,
  getSectionOfStudent,
  getAllCourseSections,
  type ExchangeAction,
} from '@/lib/api'
import type { CourseSection } from '@/lib/interface'

function mapDayOfWeek(dayOfWeek: string) {
  const map: Record<string, string> = {
    '0': 'Chủ Nhật',
    '1': 'Thứ Hai',
    '2': 'Thứ Ba',
    '3': 'Thứ Tư',
    '4': 'Thứ Năm',
    '5': 'Thứ Sáu',
    '6': 'Thứ Bảy',
  }
  return map[dayOfWeek] || 'Thứ Hai'
}

type ExchangeItem = {
  id: string
  action: ExchangeAction
  sectionId: string
  note: string
}

export function CreateExchangeRequestPage() {
  const navigate = useNavigate()
  const [allSections, setAllSections] = useState<CourseSection[]>([]) // Tất cả các lớp học phần
  const [registeredSectionIds, setRegisteredSectionIds] = useState<Set<number>>(new Set()) // ID các lớp đã đăng ký
  const [items, setItems] = useState<ExchangeItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Sử dụng ref để đảm bảo luôn có state mới nhất khi submit
  const itemsRef = useRef<ExchangeItem[]>([])
  // Thêm một state để force re-render khi cần
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  // Đồng bộ ref với state và log để debug
  useEffect(() => {
    itemsRef.current = items
    console.log('Items state updated:', JSON.stringify(items, null, 2))
    console.log('Items ref updated:', JSON.stringify(itemsRef.current, null, 2))
  }, [items])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load tất cả các lớp học phần
        const allSectionsList = await getAllCourseSections()
        console.log('Loaded all sections:', allSectionsList.length)
        setAllSections(allSectionsList)
        
        // Load các lớp học phần đã đăng ký
        const registeredSectionsData = await getSectionOfStudent()
        const registeredSections = Array.isArray(registeredSectionsData) ? registeredSectionsData : []
        console.log('Loaded registered sections:', registeredSections.length)
        
        // Tạo Set các ID đã đăng ký để dễ check
        const registeredIds = new Set<number>()
        registeredSections.forEach((sec) => {
          if (sec.sectionId) {
            registeredIds.add(typeof sec.sectionId === 'number' ? sec.sectionId : Number(sec.sectionId))
          }
        })
        setRegisteredSectionIds(registeredIds)
        
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Không thể tải dữ liệu lớp học phần.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const handleAddItem = useCallback(() => {
    setItems((prev) => {
      const newItem: ExchangeItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        action: 'ADD',
        sectionId: '',
        note: '',
      }
      return [...prev, newItem]
    })
  }, [])

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const loadAllSections = useCallback(async () => {
    try {
      // Load lại tất cả các lớp học phần
      const allSectionsList = await getAllCourseSections()
      setAllSections(allSectionsList)
      
      // Load lại các lớp đã đăng ký
      const registeredSectionsData = await getSectionOfStudent()
      const registeredSections = Array.isArray(registeredSectionsData) ? registeredSectionsData : []
      
      const registeredIds = new Set<number>()
      registeredSections.forEach((sec) => {
        if (sec.sectionId) {
          registeredIds.add(typeof sec.sectionId === 'number' ? sec.sectionId : Number(sec.sectionId))
        }
      })
      setRegisteredSectionIds(registeredIds)
    } catch (error) {
      console.error('Không thể tải danh sách lớp học phần:', error)
    }
  }, [])

  const handleUpdateItem = useCallback((itemId: string, updates: Partial<ExchangeItem>) => {
    console.log('handleUpdateItem called:', { itemId, updates })
    
    // Load lại sections từ API khi action thay đổi để đảm bảo data luôn mới nhất
    if (updates.action !== undefined) {
      void loadAllSections()
    }
    
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates }
          // Đảm bảo sectionId là string (giữ nguyên giá trị nếu đã có)
          if (updatedItem.sectionId !== undefined && updatedItem.sectionId !== null) {
            updatedItem.sectionId = String(updatedItem.sectionId)
          }
          console.log('Updated item:', JSON.stringify(updatedItem, null, 2))
          return updatedItem
        }
        return item
      })
      console.log('Updated items array:', JSON.stringify(updated, null, 2))
      // Force update trigger để đảm bảo re-render
      setUpdateTrigger(prev => prev + 1)
      return updated
    })
  }, [loadAllSections])

  const handleCreateRequest = useCallback(async () => {
    // Sử dụng cả state và ref để đảm bảo có dữ liệu mới nhất
    // Đợi một chút để đảm bảo state đã được cập nhật
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Lấy từ ref để đảm bảo có state mới nhất (ref luôn được sync với state)
    const currentItems = itemsRef.current
    
    console.log('=== SUBMIT DEBUG ===')
    console.log('Current items from ref:', JSON.stringify(currentItems, null, 2))
    console.log('Current items from state:', JSON.stringify(items, null, 2))
    console.log('Items count from ref:', currentItems?.length)
    console.log('Items count from state:', items.length)
    
    // Validate: Kiểm tra có items không
    if (!currentItems || currentItems.length === 0) {
      console.warn('No items found')
      toast.error('Vui lòng thêm ít nhất một môn học')
      return
    }
    
    // Chỉ lấy những items có sectionId hợp lệ và không rỗng
    const validItems = currentItems.filter((item, index) => {
      // Convert sectionId sang string và trim
      const sectionIdStr = item.sectionId 
        ? (typeof item.sectionId === 'string' ? item.sectionId : String(item.sectionId)).trim()
        : ''
      
      console.log(`Checking item ${index + 1}:`, {
        id: item.id,
        sectionId: item.sectionId,
        sectionIdType: typeof item.sectionId,
        sectionIdStr,
        sectionIdNumber: Number(sectionIdStr),
        action: item.action,
      })
      
      // Kiểm tra sectionId hợp lệ - phải là số dương
      const sectionIdNum = Number(sectionIdStr)
      const hasSectionId = sectionIdStr !== '' && 
                          sectionIdStr !== 'undefined' && 
                          sectionIdStr !== 'null' &&
                          !isNaN(sectionIdNum) &&
                          isFinite(sectionIdNum) &&
                          sectionIdNum > 0
      
      // Kiểm tra action hợp lệ
      const hasValidAction = item.action === 'ADD' || item.action === 'REMOVE'
      
      const isValid = hasSectionId && hasValidAction
      
      if (!isValid) {
        console.warn(`Item ${index + 1} is invalid:`, {
          hasSectionId,
          hasValidAction,
          sectionIdStr,
          sectionIdNum,
          action: item.action,
          fullItem: item
        })
      }
      
      return isValid
    })
    
    console.log('All items:', JSON.stringify(currentItems, null, 2))
    console.log('Valid items:', JSON.stringify(validItems, null, 2))
    console.log('Valid items count:', validItems.length)
    
    if (validItems.length === 0) {
      console.error('No valid items found')
      toast.error('Vui lòng chọn lớp học phần cho ít nhất một môn học')
      return
    }

    // Validate và chuyển đổi sang format API
    const apiItems = validItems.map((item, index) => {
      const sectionIdStr = String(item.sectionId).trim()
      const sectionId = Number(sectionIdStr)
      
      console.log(`Item ${index + 1}:`, {
        originalSectionId: item.sectionId,
        sectionIdStr,
        sectionId,
        action: item.action,
        note: item.note
      })
      
      if (!Number.isFinite(sectionId) || sectionId <= 0 || isNaN(sectionId)) {
        throw new Error(`Section ID không hợp lệ cho môn học #${index + 1}: ${item.sectionId}`)
      }
      
      if (item.action !== 'ADD' && item.action !== 'REMOVE') {
        throw new Error(`Hành động không hợp lệ cho môn học #${index + 1}: ${item.action}`)
      }
      
      return {
        sectionId,
        action: item.action,
        note: item.note?.trim() || (item.action === 'REMOVE' ? 'Remove this section' : 'Add this section'),
      }
    })
    
    console.log('API items to send:', JSON.stringify(apiItems, null, 2))

    try {
      setIsSubmitting(true)
      const result = await createExchangeTransaction({
        items: apiItems,
        description: 'Exchange course sections',
        status: 'pending',
      })

      console.log('Create exchange transaction success:', result)
      toast.success('Tạo yêu cầu đổi lớp thành công')
      // Navigate back to list page
      void navigate({ to: '/exchange-request' })
    } catch (error) {
      console.error('Create exchange transaction error:', error)
      toast.error(error instanceof Error ? error.message : 'Tạo yêu cầu đổi lớp thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }, [navigate, items])

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
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/exchange-request' })}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </div>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <Plus className="w-8 h-8 text-primary" />
              Tạo yêu cầu đổi lớp mới
            </h1>
            <p className='text-muted-foreground text-base'>
              Thêm hoặc bỏ lớp học phần để tạo yêu cầu đổi lớp.
            </p>
          </div>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-primary" />
                Thông tin yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Danh sách items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Danh sách môn học</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm môn học
                    </Button>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                      <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Chưa có môn học nào. Nhấn "Thêm môn học" để bắt đầu.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        // Sử dụng tất cả các lớp học phần
                        const sectionsToShow = allSections
                        const validSections = sectionsToShow.filter((sec) => sec.sectionCode && sec.sectionId)
                        console.log('sectionsToShow:', sectionsToShow.length, 'validSections:', validSections.length)
                        const selectedSection = sectionsToShow.find(
                          (sec) => sec.sectionId.toString() === item.sectionId,
                        )

                        return (
                          <div
                            key={item.id}
                            className="p-5 border-2 rounded-lg bg-card space-y-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-primary">
                                Môn học #{index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Lớp học phần</label>
                                <Select
                                  key={`section-select-${item.id}-${updateTrigger}`}
                                  value={item.sectionId && String(item.sectionId).trim() !== '' ? String(item.sectionId) : undefined}
                                  onValueChange={(value) => {
                                    console.log('=== SELECT CHANGE ===')
                                    console.log('Selected value:', value, 'Type:', typeof value)
                                    console.log('For item:', item.id)
                                    console.log('Current item state:', JSON.stringify(item, null, 2))
                                    
                                    // Đảm bảo value là string hợp lệ
                                    const sectionIdValue = String(value).trim()
                                    
                                    if (sectionIdValue && sectionIdValue !== 'undefined' && sectionIdValue !== 'null' && sectionIdValue !== '') {
                                      console.log('Updating item with sectionId:', sectionIdValue)
                                      // Cập nhật ngay lập tức không cần setTimeout
                                      handleUpdateItem(item.id, { sectionId: sectionIdValue })
                                    } else {
                                      console.warn('Invalid sectionId value:', value)
                                    }
                                  }}
                                  disabled={isLoading || sectionsToShow.length === 0}
                                >
                                  <SelectTrigger className="w-full h-10">
                                    <SelectValue 
                                      placeholder={
                                        isLoading 
                                          ? "Đang tải..." 
                                          : sectionsToShow.length === 0 
                                          ? "Không có lớp học phần" 
                                          : "Chọn lớp học phần"
                                      } 
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {isLoading ? (
                                      <SelectItem value="" disabled>
                                        Đang tải dữ liệu...
                                      </SelectItem>
                                    ) : sectionsToShow.length === 0 ? (
                                      <SelectItem value="" disabled>
                                        Không có lớp học phần nào
                                      </SelectItem>
                                    ) : (
                                      sectionsToShow
                                        .filter((sec) => {
                                          // Lọc các section hợp lệ: chỉ cần có sectionCode và sectionId
                                          return sec.sectionCode && sec.sectionId
                                        })
                                        .map((sec) => {
                                          // Đảm bảo sectionId là number và hợp lệ
                                          const sectionId = typeof sec.sectionId === 'number' ? sec.sectionId : Number(sec.sectionId)
                                          
                                          if (!Number.isFinite(sectionId) || sectionId <= 0) {
                                            console.warn('Invalid sectionId:', sec.sectionId, sec)
                                            return null
                                          }
                                          
                                          // Kiểm tra xem lớp này đã được đăng ký chưa
                                          const isRegistered = registeredSectionIds.has(sectionId)
                                          
                                          const schedules = sec.classSchedules || []
                                          const firstSchedule = schedules[0]
                                          const dayLabel = firstSchedule
                                            ? mapDayOfWeek(firstSchedule.dayOfWeek)
                                            : null
                                          const timeLabel = firstSchedule
                                            ? `Tiết ${firstSchedule.startPeriod}-${firstSchedule.endPeriod}`
                                            : sec.schedule || null
                                          const room = firstSchedule?.room
                                          
                                          // Tạo label đẹp và gọn gàng
                                          // API có thể không trả về course object, chỉ có courseId
                                          const courseName = sec.course?.name || `Môn học #${sec.courseId}` || ''
                                          const sectionCode = sec.sectionCode
                                          
                                          // Tạo phần hiển thị thông tin
                                          const infoParts: string[] = []
                                          if (dayLabel) infoParts.push(dayLabel)
                                          if (timeLabel) infoParts.push(timeLabel)
                                          if (room) infoParts.push(room)
                                          
                                          const displayText = infoParts.length > 0
                                            ? `${sectionCode}${courseName ? ` - ${courseName}` : ''} (${infoParts.join(', ')})`
                                            : `${sectionCode}${courseName ? ` - ${courseName}` : ''}`
                                          
                                          return (
                                            <SelectItem
                                              key={sectionId}
                                              value={sectionId.toString()}
                                              className={isRegistered ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 font-medium hover:bg-green-100 dark:hover:bg-green-900/50' : ''}
                                            >
                                              <span className="flex items-center gap-2 w-full">
                                                {isRegistered && (
                                                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                                )}
                                                <span className="flex-1">{displayText}</span>
                                                {isRegistered && (
                                                  <span className="text-xs text-green-600 dark:text-green-400 font-normal flex-shrink-0">(Đã đăng ký)</span>
                                                )}
                                              </span>
                                            </SelectItem>
                                          )
                                        })
                                        .filter(Boolean)
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Action */}
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Hành động</label>
                                <Select
                                  value={item.action}
                                  onValueChange={(value) => {
                                    console.log('Action changed to:', value, 'for item:', item.id)
                                    // Chỉ cập nhật action, giữ nguyên sectionId đã chọn
                                    handleUpdateItem(item.id, {
                                      action: value as ExchangeAction,
                                    })
                                  }}
                                >
                                  <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Chọn hành động" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ADD">Thêm (ADD)</SelectItem>
                                    <SelectItem value="REMOVE">Bỏ (REMOVE)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleCreateRequest} 
                  className="flex-1" 
                  disabled={isSubmitting || items.length === 0}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo yêu cầu...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo yêu cầu đổi lớp
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate({ to: '/exchange-request' })}
                  size="lg"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

export default CreateExchangeRequestPage

