"""
Data models for Timetable Suggest API
"""
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field


@dataclass
class Course:
    """Course model"""
    courseId: int
    code: str
    name: str
    credits: int
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Optional['Course']:
        """Create Course from dictionary"""
        if not data:
            return None
        return cls(
            courseId=data.get('courseId'),
            code=data.get('code', ''),
            name=data.get('name', ''),
            credits=data.get('credits', 0)
        )


@dataclass
class Instructor:
    """Instructor model"""
    instructorId: int
    fullName: str
    department: str
    title: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Optional['Instructor']:
        """Create Instructor from dictionary"""
        if not data:
            return None
        return cls(
            instructorId=data.get('instructorId'),
            fullName=data.get('fullName', ''),
            department=data.get('department', ''),
            title=data.get('title')
        )


@dataclass
class ClassSchedule:
    """Class schedule model"""
    dayOfWeek: str
    startPeriod: int
    endPeriod: int
    room: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Optional['ClassSchedule']:
        """Create ClassSchedule from dictionary"""
        if not data:
            return None
        return cls(
            dayOfWeek=str(data.get('dayOfWeek', '')),
            startPeriod=data.get('startPeriod', 0),
            endPeriod=data.get('endPeriod', 0),
            room=data.get('room')
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'dayOfWeek': self.dayOfWeek,
            'startPeriod': self.startPeriod,
            'endPeriod': self.endPeriod,
            'room': self.room
        }


@dataclass
class CourseSection:
    """Course section model"""
    sectionId: int
    sectionCode: str
    courseId: int
    instructorId: int
    maxStudents: int
    currentStudents: int
    status: str
    semesterId: Optional[int] = None
    course: Optional[Course] = None
    instructor: Optional[Instructor] = None
    classSchedules: List[ClassSchedule] = field(default_factory=list)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Optional['CourseSection']:
        """Create CourseSection from dictionary"""
        if not data:
            return None
        
        # Parse nested objects
        course = Course.from_dict(data.get('course', {}))
        instructor = Instructor.from_dict(data.get('instructor', {}))
        class_schedules = [
            ClassSchedule.from_dict(schedule)
            for schedule in data.get('classSchedules', [])
            if ClassSchedule.from_dict(schedule) is not None
        ]
        
        return cls(
            sectionId=data.get('sectionId'),
            sectionCode=data.get('sectionCode', ''),
            courseId=data.get('courseId'),
            instructorId=data.get('instructorId'),
            maxStudents=data.get('maxStudents', 0),
            currentStudents=data.get('currentStudents', 0),
            status=data.get('status', 'open'),
            semesterId=data.get('semesterId'),
            course=course,
            instructor=instructor,
            classSchedules=class_schedules
        )


@dataclass
class CourseFlatten:
    """Flattened course section model for Gemini API"""
    sectionId: int
    sectionCode: str
    courseName: str
    credits: int
    # Instructor
    instructorName: str
    # Schedules
    schedules: List[Dict[str, Any]] = field(default_factory=list)
    
    @classmethod
    def from_course_section(cls, section: CourseSection) -> 'CourseFlatten':
        """Create CourseFlatten from CourseSection"""
        return cls(
            sectionId=section.sectionId,
            sectionCode=section.sectionCode,
            courseName=section.course.name if section.course else '',
            credits=section.course.credits if section.course else 0,
            instructorName=section.instructor.fullName if section.instructor else '',
            schedules=[schedule.to_dict() for schedule in section.classSchedules]
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'sectionId': self.sectionId,
            'sectionCode': self.sectionCode,
            'courseName': self.courseName,
            'credits': self.credits,
            'instructorName': self.instructorName,
            'schedules': self.schedules
        }

