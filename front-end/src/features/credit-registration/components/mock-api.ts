// Simple mock API with artificial delays

export type Subject = {
  id: string
  code: string
  name: string
  credits: number
  type: 'Bắt buộc' | 'Tự chọn'
  semester: 'HK1' | 'HK2'
}

export type Section = {
  id: string
  classCode: string
  subjectCode: string
  teacher: string
  room: string
  // one or more meeting times in a week: day + start period + length
  meetings: Array<{ day: 'T2'|'T3'|'T4'|'T5'|'T6'|'T7'|'CN'; period: number; length: number }>
}

const SUBJECTS: Subject[] = [
  { id: '1', code: 'CS101', name: 'Nhập môn lập trình', credits: 3, type: 'Bắt buộc', semester: 'HK1' },
  { id: '2', code: 'CS102', name: 'Cấu trúc dữ liệu', credits: 3, type: 'Bắt buộc', semester: 'HK1' },
  { id: '3', code: 'CS103', name: 'Thuật toán', credits: 3, type: 'Bắt buộc', semester: 'HK2' },
  { id: '5', code: 'CS301', name: 'Phát triển web', credits: 4, type: 'Tự chọn', semester: 'HK1' },
  { id: '6', code: 'CS302', name: 'Trí tuệ nhân tạo', credits: 3, type: 'Tự chọn', semester: 'HK1' },
]

const SECTIONS_BY_SUBJECT: Record<string, Section[]> = {
  CS101: [
    { id: 'CS101-01', classCode: 'CS101-01', subjectCode: 'CS101', teacher: 'Nguyễn Văn A', room: 'A101', meetings: [ { day: 'T2', period: 1, length: 2 }, { day: 'T4', period: 1, length: 1 } ] },
    { id: 'CS101-02', classCode: 'CS101-02', subjectCode: 'CS101', teacher: 'Trần Thị B', room: 'A102', meetings: [ { day: 'T3', period: 2, length: 2 } ] },
  ],
  CS102: [
    { id: 'CS102-01', classCode: 'CS102-01', subjectCode: 'CS102', teacher: 'Lê Văn C', room: 'B201', meetings: [ { day: 'T2', period: 3, length: 2 } ] },
  ],
  CS301: [
    { id: 'CS301-01', classCode: 'CS301-01', subjectCode: 'CS301', teacher: 'Hoàng Văn E', room: 'C301', meetings: [ { day: 'T5', period: 1, length: 3 } ] },
  ],
  CS302: [
    { id: 'CS302-01', classCode: 'CS302-01', subjectCode: 'CS302', teacher: 'Vũ Thị F', room: 'C302', meetings: [ { day: 'T3', period: 4, length: 2 } ] },
  ],
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export async function fetchSubjects(): Promise<Subject[]> {
  await delay(300)
  return SUBJECTS
}

export async function fetchSectionsBySubject(subjectCode: string): Promise<Section[]> {
  await delay(400)
  return SECTIONS_BY_SUBJECT[subjectCode] ?? []
}


