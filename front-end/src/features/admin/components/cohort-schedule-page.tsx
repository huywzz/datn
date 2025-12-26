import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { createCourseRegistrationPeriod, getCourseRegistrationPeriod } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { useEffect } from 'react'

const formSchema = z.object({
    startDate: z.date(),
    startTime: z.string().min(1, { message: 'Vui lòng chọn giờ bắt đầu.' }),
    endDate: z.date(),
    endTime: z.string().min(1, { message: 'Vui lòng chọn giờ kết thúc.' }),
})

function combineDateAndTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map((v) => Number(v) || 0)
    const result = new Date(date)
    result.setHours(hours, minutes, 0, 0)
    return result.toISOString()
}

function isPastDate(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

function parseISOToDateAndTime(isoString: string): { date: Date; time: string } | null {
    if (!isoString) return null
    
    const date = new Date(isoString)
    
    // Kiểm tra Date hợp lệ
    if (isNaN(date.getTime())) {
        return null
    }
    
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    // Tạo Date object mới chỉ với ngày (không có giờ)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Kiểm tra Date hợp lệ sau khi tạo
    if (isNaN(dateOnly.getTime())) {
        return null
    }
    
    return {
        date: dateOnly,
        time: `${hours}:${minutes}`,
    }
}

export function CohortSchedulePage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    const queryClient = useQueryClient()

    const { data: registrationPeriod } = useQuery({
        queryKey: ['course-registration-period', 1],
        queryFn: () => getCourseRegistrationPeriod(1),
    })

    useEffect(() => {
        if (registrationPeriod?.startTime && registrationPeriod?.endTime) {
            const startDateTime = parseISOToDateAndTime(registrationPeriod.startTime)
            const endDateTime = parseISOToDateAndTime(registrationPeriod.endTime)

            if (startDateTime && endDateTime) {
                form.reset({
                    startDate: startDateTime.date,
                    startTime: startDateTime.time,
                    endDate: endDateTime.date,
                    endTime: endDateTime.time,
                })
            }
        }
    }, [registrationPeriod, form])

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) =>
            createCourseRegistrationPeriod({
                startTime: combineDateAndTime(values.startDate, values.startTime),
                endTime: combineDateAndTime(values.endDate, values.endTime),
            }),
        onSuccess: () => {
            toast.success('Lưu lịch đăng ký thành công')
            form.reset()
            // Refetch lại dữ liệu sau khi lưu thành công
            queryClient.invalidateQueries({ queryKey: ['course-registration-period', 1] })
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values)
    }

    return (
        <div className='max-w-3xl mx-auto'>
            <Card className='border border-border/60 shadow-sm'>
                <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <CardTitle className='text-xl font-semibold'>Mở đợt đăng ký tín chỉ</CardTitle>
                            <CardDescription>
                                Chọn khoảng thời gian mở/đóng đăng ký tín chỉ cho sinh viên.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                                <FormField
                        control={form.control}
                        name='startDate'
                        render={({ field }) => (
                            <FormItem className='flex flex-col'>
                                <FormLabel>Ngày bắt đầu</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant='outline'
                                            className={cn(
                                                'w-full justify-start gap-2 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className='h-4 w-4 text-primary' />
                                            {field.value && !isNaN(field.value.getTime()) ? (
                                                format(field.value, 'dd/MM/yyyy')
                                            ) : (
                                                <span>Chọn ngày</span>
                                            )}
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0' align='start'>
                                        <Calendar
                                            mode='single'
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={isPastDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>Ngày hệ thống bắt đầu cho phép sinh viên đăng ký tín chỉ.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                                <FormField
                        control={form.control}
                        name='endDate'
                        render={({ field }) => (
                            <FormItem className='flex flex-col'>
                                <FormLabel>Ngày kết thúc</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant='outline'
                                            className={cn(
                                                'w-full justify-start gap-2 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className='h-4 w-4 text-primary' />
                                            {field.value && !isNaN(field.value.getTime()) ? (
                                                format(field.value, 'dd/MM/yyyy')
                                            ) : (
                                                <span>Chọn ngày</span>
                                            )}
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                        mode='single'
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={isPastDate}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>Ngày hệ thống dừng cho phép đăng ký tín chỉ.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                            </div>

                            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                                <FormField
                                    control={form.control}
                                    name='startTime'
                                    render={({ field }) => {
                                        const [h = '', m = ''] = (field.value || '').split(':')
                                        const selectedHour = h.padStart(2, '0')
                                        const selectedMinute = m.padStart(2, '0')
                                        const hours = Array.from({ length: 24 }, (_, i) =>
                                            String(i).padStart(2, '0')
                                        )
                                        const minutes = ['00', '15', '30', '45']

                                        const updateTime = (hour: string, minute: string) => {
                                            field.onChange(`${hour}:${minute}`)
                                        }

                                        return (
                                            <FormItem>
                                                <FormLabel>Giờ bắt đầu</FormLabel>
                                                <div className='flex items-center gap-3'>
                                                    <Clock className='h-4 w-4 text-muted-foreground' />
                                                    <div className='flex flex-1 items-center gap-2'>
                                                        <FormControl>
                                                            <Input className='hidden' value={field.value} readOnly />
                                                        </FormControl>
                                                        <select
                                                            className='h-9 rounded-md border bg-background px-3 text-sm'
                                                            value={selectedHour}
                                                            onChange={(e) =>
                                                                updateTime(e.target.value, selectedMinute || '00')
                                                            }
                                                        >
                                                            <option value='' disabled>
                                                                HH
                                                            </option>
                                                            {hours.map((hour) => (
                                                                <option key={hour} value={hour}>
                                                                    {hour}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <span className='text-muted-foreground'>:</span>
                                                        <select
                                                            className='h-9 rounded-md border bg-background px-3 text-sm'
                                                            value={selectedMinute}
                                                            onChange={(e) =>
                                                                updateTime(selectedHour || '00', e.target.value)
                                                            }
                                                        >
                                                            <option value='' disabled>
                                                                MM
                                                            </option>
                                                            {minutes.map((minute) => (
                                                                <option key={minute} value={minute}>
                                                                    {minute}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <FormDescription>Giờ mở đăng ký trong ngày đã chọn.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                                <FormField
                                    control={form.control}
                                    name='endTime'
                                    render={({ field }) => {
                                        const [h = '', m = ''] = (field.value || '').split(':')
                                        const selectedHour = h.padStart(2, '0')
                                        const selectedMinute = m.padStart(2, '0')
                                        const hours = Array.from({ length: 24 }, (_, i) =>
                                            String(i).padStart(2, '0')
                                        )
                                        const minutes = ['00', '15', '30', '45']

                                        const updateTime = (hour: string, minute: string) => {
                                            field.onChange(`${hour}:${minute}`)
                                        }

                                        return (
                                            <FormItem>
                                                <FormLabel>Giờ kết thúc</FormLabel>
                                                <div className='flex items-center gap-3'>
                                                    <Clock className='h-4 w-4 text-muted-foreground' />
                                                    <div className='flex flex-1 items-center gap-2'>
                                                        <FormControl>
                                                            <Input className='hidden' value={field.value} readOnly />
                                                        </FormControl>
                                                        <select
                                                            className='h-9 rounded-md border bg-background px-3 text-sm'
                                                            value={selectedHour}
                                                            onChange={(e) =>
                                                                updateTime(e.target.value, selectedMinute || '00')
                                                            }
                                                        >
                                                            <option value='' disabled>
                                                                HH
                                                            </option>
                                                            {hours.map((hour) => (
                                                                <option key={hour} value={hour}>
                                                                    {hour}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <span className='text-muted-foreground'>:</span>
                                                        <select
                                                            className='h-9 rounded-md border bg-background px-3 text-sm'
                                                            value={selectedMinute}
                                                            onChange={(e) =>
                                                                updateTime(selectedHour || '00', e.target.value)
                                                            }
                                                        >
                                                            <option value='' disabled>
                                                                MM
                                                            </option>
                                                            {minutes.map((minute) => (
                                                                <option key={minute} value={minute}>
                                                                    {minute}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <FormDescription>Giờ đóng đăng ký trong ngày đã chọn.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>

                            <div className='flex items-center justify-end pt-2'>
                                <Button type='submit' disabled={mutation.isPending} className='min-w-[160px]'>
                                    {mutation.isPending ? 'Đang tạo...' : 'Lưu lịch đăng ký'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

