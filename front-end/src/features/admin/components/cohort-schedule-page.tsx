import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { createCohortRegistrationSchedule } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

const formSchema = z.object({
    startTime: z.date({
        required_error: 'Vui lòng chọn ngày bắt đầu.',
    }),
    endTime: z.date({
        required_error: 'Vui lòng chọn ngày kết thúc.',
    }),
})

export function CohortSchedulePage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) =>
            createCohortRegistrationSchedule({
                startTime: values.startTime.toISOString(),
                endTime: values.endTime.toISOString(),
            }),
        onSuccess: () => {
            toast.success('Tạo lịch đăng ký thành công')
            form.reset()
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values)
    }

    return (
        <div className='max-w-lg mx-auto'>
            <h2 className='text-xl font-semibold mb-4'>Tạo lịch đăng ký tín chỉ</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                    <FormField
                        control={form.control}
                        name='startTime'
                        render={({ field }) => (
                            <FormItem className='flex flex-col'>
                                <FormLabel>Thời gian bắt đầu</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full pl-3 text-left font-normal',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, 'PPP')
                                                ) : (
                                                    <span>Chọn ngày</span>
                                                )}
                                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0' align='start'>
                                        <Calendar
                                            mode='single'
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date('1900-01-01')
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Thời điểm mở đăng ký.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='endTime'
                        render={({ field }) => (
                            <FormItem className='flex flex-col'>
                                <FormLabel>Thời gian kết thúc</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full pl-3 text-left font-normal',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, 'PPP')
                                                ) : (
                                                    <span>Chọn ngày</span>
                                                )}
                                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0' align='start'>
                                        <Calendar
                                            mode='single'
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date('1900-01-01')
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Thời điểm đóng đăng ký.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type='submit' disabled={mutation.isPending}>
                        {mutation.isPending ? 'Đang tạo...' : 'Tạo lịch đăng ký'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

