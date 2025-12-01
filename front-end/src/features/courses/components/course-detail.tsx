import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, User, Clock, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getCourseDetails, type Course } from '@/lib/api'

// Map dayOfWeek (0-6) to day format (CN, T2-T7)
const mapDayOfWeek = (dayOfWeek: string): string => {
    const dayMap: Record<string, string> = {
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

export function CourseDetail() {
    const { courseId } = useParams({ from: '/_authenticated/courses/$courseId' })
    const navigate = useNavigate()
    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCourseDetails = async () => {
            if (!courseId) return

            setIsLoading(true)
            try {
                const data = await getCourseDetails(Number(courseId))
                setCourse(data)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Không thể tải thông tin môn học'
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseDetails()
    }, [courseId])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Đang tải thông tin môn học...</p>
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-destructive font-medium">{error || 'Không tìm thấy môn học'}</p>
                <Button variant="outline" onClick={() => navigate({ to: '..' })}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 container mx-auto p-4 max-w-5xl">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại danh sách
            </Button>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Course Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin môn học</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-primary">{course.name}</h3>
                                <p className="text-muted-foreground font-mono mt-1">{course.code}</p>
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <span className="text-sm font-medium text-muted-foreground">Số tín chỉ</span>
                                <Badge variant="secondary" className="text-lg px-3">
                                    {course.credits}
                                </Badge>
                            </div>

                            <div className="border-t pt-4">
                                <span className="text-sm font-medium text-muted-foreground block mb-2">Mô tả</span>
                                <p className="text-sm text-gray-600">
                                    Môn học cung cấp kiến thức nền tảng về {course.name.toLowerCase()}.
                                    (Mô tả chi tiết đang được cập nhật)
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sections List */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Danh sách lớp học phần</span>
                                <Badge variant="outline">{course.sections?.length || 0} lớp</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!course.sections || course.sections.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Chưa có lớp học phần nào được mở cho môn học này.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {course.sections.map((section) => (
                                        <div
                                            key={section.sectionId}
                                            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                                        {section.sectionCode}
                                                        {section.status === 'open' ? (
                                                            <Badge className="bg-green-500 hover:bg-green-600">Đang mở</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">{section.status}</Badge>
                                                        )}
                                                    </h4>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Sĩ số: <span className="font-medium text-foreground">{section.currentStudents || 0}/{section.maxStudents}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {section.instructor && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span>GV: {section.instructor.fullName}</span>
                                                    </div>
                                                )}

                                                {section.classSchedules && section.classSchedules.length > 0 ? (
                                                    section.classSchedules.map((schedule, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-gray-700 col-span-full md:col-span-1">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span>
                                                                {mapDayOfWeek(schedule.dayOfWeek)} (Tiết {schedule.startPeriod}-{schedule.endPeriod})
                                                            </span>
                                                            {schedule.room && (
                                                                <span className="flex items-center gap-1 ml-2">
                                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                    {schedule.room}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span>{section.schedule || 'Chưa có lịch'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
