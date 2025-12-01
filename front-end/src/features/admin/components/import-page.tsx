import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileSpreadsheet, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { importCourseSections, getCourses, getSemesters, getCohorts } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

const sectionImportSchema = z.object({
    file: z.instanceof(FileList).refine((files) => files.length > 0, 'Vui lòng chọn file'),
    semesterId: z.string().refine((val) => !isNaN(Number(val)), 'Vui lòng chọn học kỳ'),
    cohortId: z.string().min(1, 'Vui lòng chọn khóa'),
})

export function ImportPage() {
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput.trim())
            setPage(1)
        }, 400)
        return () => clearTimeout(handler)
    }, [searchInput])

    const { data: coursesData, isLoading } = useQuery({
        queryKey: ['courses', page, limit, debouncedSearch],
        queryFn: () =>
            getCourses({
                page,
                limit,
                sortBy: 'createdAt',
                sortOrder: 'DESC',
                search: debouncedSearch || undefined,
            }),
    })

    const courses = coursesData?.data || []
    const totalPages = coursesData?.totalPages || 1
    const currentPage = coursesData?.page || 1

    return (
        <div className='p-6 space-y-6'>
            <div className='flex justify-between items-center'>
                <h2 className='text-2xl font-bold tracking-tight'>Danh sách môn học</h2>
                <ImportDialog />
            </div>

            <div className='flex gap-4 items-center'>
                <div className='relative flex-1 max-w-sm'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                        placeholder='Tìm kiếm môn học...'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className='pl-10'
                    />
                </div>
                {coursesData && (
                    <div className='text-sm text-muted-foreground'>
                        Tổng: {coursesData.total} môn học
                    </div>
                )}
            </div>

            <div className='border rounded-lg'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã môn học</TableHead>
                            <TableHead>Tên môn học</TableHead>
                            <TableHead>Số tín chỉ</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead>Ngày cập nhật</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className='text-center py-8'>
                                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                                </TableCell>
                            </TableRow>
                        ) : courses && courses.length > 0 ? (
                            courses.map((course) => (
                                <TableRow key={course.courseId}>
                                    <TableCell className='font-medium'>{course.code}</TableCell>
                                    <TableCell>
                                        <Link
                                            to="/courses/$courseId"
                                            params={{ courseId: String(course.courseId) }}
                                            className="hover:text-primary hover:underline font-medium"
                                        >
                                            {course.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{course.credits}</TableCell>
                                    <TableCell>
                                        {course.createdAt ? format(new Date(course.createdAt), 'dd/MM/yyyy') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {course.updatedAt ? format(new Date(course.updatedAt), 'dd/MM/yyyy') : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className='text-center py-8'>
                                    Không có dữ liệu môn học
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className='flex items-center justify-between'>
                    <div className='text-sm text-muted-foreground'>
                        Trang {currentPage} / {totalPages}
                    </div>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            <ChevronLeft className='h-4 w-4' />
                            Trước
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size='sm'
                                    onClick={() => setPage(pageNum)}
                                    disabled={isLoading}
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            Sau
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

function ImportDialog() {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data: semesters } = useQuery({
        queryKey: ['semesters'],
        queryFn: getSemesters,
    })

    const { data: cohorts } = useQuery({
        queryKey: ['cohorts'],
        queryFn: getCohorts,
    })

    const form = useForm<z.infer<typeof sectionImportSchema>>({
        resolver: zodResolver(sectionImportSchema),
    })

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof sectionImportSchema>) =>
            importCourseSections(values.file[0], Number(values.semesterId), values.cohortId),
        onSuccess: (data) => {
            toast.custom(() => (
                <div className='rounded-md bg-background p-4 shadow-lg space-y-2 text-sm'>
                    <p className='font-semibold'>Kết quả import</p>
                    <pre className='max-h-64 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap'>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            ), { duration: Infinity })
            form.reset()
            setOpen(false)
            queryClient.invalidateQueries({ queryKey: ['courses'] })
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    function onSubmit(values: z.infer<typeof sectionImportSchema>) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <FileSpreadsheet className='mr-2 h-4 w-4' />
                    Import Excel
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Import Lớp Học Phần</DialogTitle>
                    <DialogDescription>
                        Chọn học kỳ, khóa và file Excel để import dữ liệu lớp học phần.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                        <FormField
                            control={form.control}
                            name='semesterId'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Học kỳ</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn học kỳ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {semesters?.map((semester) => (
                                                <SelectItem key={semester.semesterId} value={semester.semesterId.toString()}>
                                                    Học kỳ {semester.semesterId} ({format(new Date(semester.startDate), 'MM/yyyy')} - {format(new Date(semester.endDate), 'MM/yyyy')})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='cohortId'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Khóa</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn khóa" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cohorts?.map((cohort) => (
                                                <SelectItem key={cohort.id} value={cohort.id}>
                                                    {cohort.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='file'
                            render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                    <FormLabel>File Excel</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='file'
                                            accept='.xlsx, .xls'
                                            onChange={(e) => onChange(e.target.files)}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>Upload file Excel chứa dữ liệu lớp học phần.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='flex justify-end pt-4'>
                            <Button type='submit' disabled={mutation.isPending}>
                                {mutation.isPending ? 'Đang import...' : 'Import'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

