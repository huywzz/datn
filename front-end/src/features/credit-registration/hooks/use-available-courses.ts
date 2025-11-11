import { useQuery } from '@tanstack/react-query'
import { getAvailableCourses } from '@/lib/api'
import type { AvailableCourse } from '@/lib/api'

export interface Subject {
  id: string
  code: string
  name: string
  credits: number
  type: string
  semester: string
  courseId: number
  cohortId?: string
  available?: boolean
}

/**
 * Custom hook to fetch available courses with React Query caching
 * This ensures the API is only called once, even if multiple components use it
 */
export function useAvailableCourses() {
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery<AvailableCourse[], Error>({
    queryKey: ['availableCourses'],
    queryFn: getAvailableCourses,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes - data is considered fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })

  // Map API response to Subject format
  const subjects: Subject[] =
    courses
      ?.filter(
        (course) =>
          course && course.status === 'active' && course.course && course.courseId,
      )
      .map((course) => ({
        id: course.id ? course.id.toString() : `course-${course.courseId}`,
        code: course.course?.code || '',
        name: course.course?.name || 'Chưa có tên',
        credits: course.course?.credits || 0,
        type: 'Bắt buộc', // Default value since API doesn't provide this
        semester: 'HK1', // Default value since API doesn't provide this
        courseId: course.courseId,
        cohortId: course.cohortId,
        available: course.status === 'active',
      }))
      .filter((subject) => subject.code && subject.courseId) || []

  return {
    subjects,
    isLoading,
    error: error || null,
    rawCourses: courses || [],
  }
}

