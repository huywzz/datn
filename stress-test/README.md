# Stress Test cho Flow Đăng ký Tín chỉ

Module này chứa chương trình Python để stress test flow đăng ký tín chỉ của hệ thống.

## Mô tả

Chương trình thực hiện stress test theo flow đăng ký tín chỉ được mô tả trong `backend/summary.md`:

1. **Bước 1**: Xem lịch học hiện tại (`GET /registrations/my-schedule`)
2. **Bước 2**: Xem các môn học có sẵn (`GET /temporaries/available-courses`)
3. **Bước 3**: Chọn môn học và xem các lớp học phần (`GET /course-sections/course/:courseId`)
4. **Bước 4**: Đăng ký học phần (`POST /registrations`)
5. **Hủy đăng ký**: Hủy đăng ký vừa tạo (`DELETE /registrations/:id`)

Chương trình sẽ lặp lại quá trình đăng ký và hủy nhiều lần, đo thời gian thực hiện và lưu kết quả vào file CSV.

## Cài đặt

1. Cài đặt Python dependencies:
```bash
pip install -r requirements.txt
```

## Sử dụng

### Cách 1: Sử dụng config file (Khuyến nghị)

Chỉnh sửa file `config.py` với thông tin của bạn:

```python
BASE_URL = "http://localhost:3004"
EMAIL = "student1@gmail.com"
PASSWORD = "password"
NUM_ITERATIONS = 10
NUM_THREADS = 1
OUTPUT_FILE = "distribution.csv"
```

Sau đó chạy đơn giản:

```bash
python stress_test.py
```

Hoặc override một số tham số:

```bash
python stress_test.py --iterations 50 --threads 5
```

### Cách 2: Sử dụng command line arguments hoàn toàn

```bash
python stress_test.py --url http://localhost:3000 --email student@example.com --password password123 --iterations 50 --threads 5 --output distribution.csv
```

**Lưu ý**: Nếu đã có config file, các giá trị trong config sẽ là giá trị mặc định. Command line arguments sẽ override các giá trị trong config.

### Các tham số

- `--url`: Base URL của backend API (default: `http://localhost:3000`)
- `--email`: Email để đăng nhập (required)
- `--password`: Password để đăng nhập (required)
- `--iterations`: Số lần lặp lại test (default: `10`)
- `--threads`: Số thread chạy đồng thời (default: `1`)
  - `1` = chạy tuần tự
  - `>1` = chạy song song với số thread được chỉ định
- `--output`: Tên file CSV để lưu kết quả (default: `distribution.csv`)

## Output

Kết quả được lưu vào file CSV với các cột:

- `test_start_time`: Thời gian bắt đầu test (format: YYYY-MM-DD HH:MM:SS)
- `test_end_time`: Thời gian kết thúc test (format: YYYY-MM-DD HH:MM:SS)
- `total_duration`: Tổng thời gian thực hiện test (giây)

Format CSV: `[Thời gian chạy test], [Thời gian kết thúc], [Tổng thời gian]`

## Ví dụ

### Test tuần tự 20 lần:
```bash
python stress_test.py --email student@example.com --password password123 --iterations 20 --threads 1
```

### Test song song với 5 thread, mỗi thread 10 lần (tổng 50 requests):
```bash
python stress_test.py --email student@example.com --password password123 --iterations 50 --threads 5
```

### Test với backend ở port khác:
```bash
python stress_test.py --url http://localhost:4000 --email student@example.com --password password123 --iterations 30
```

## Lưu ý

1. **Đảm bảo backend đang chạy** trước khi chạy stress test
2. **Tài khoản test** phải có quyền student và đã được tạo trong hệ thống
3. **Số thread cao** có thể gây quá tải server, nên bắt đầu với số nhỏ và tăng dần
4. **Kiểm tra kết quả CSV** để phân tích hiệu suất và phát hiện các vấn đề

## Thư viện được sử dụng

- **requests**: Thư viện HTTP client để gọi API
- **concurrent.futures**: Để chạy song song với ThreadPoolExecutor
- **csv**: Để lưu kết quả vào file CSV
- **argparse**: Để xử lý command line arguments

## Troubleshooting

### Lỗi đăng nhập
- Kiểm tra email và password có đúng không
- Kiểm tra backend có đang chạy không
- Kiểm tra URL có đúng không

### Không có môn học nào có sẵn
- Đảm bảo đã có Temporary records với status='active' cho cohort của student
- Kiểm tra student có cohortId hợp lệ không

### Không có lớp học phần nào
- Đảm bảo đã có CourseSection với status='open' hoặc 'full'
- Kiểm tra CourseSection có liên kết với Course không

### Lỗi đăng ký (lớp đã đầy, trùng lịch, etc.)
- Đây là các lỗi hợp lệ từ validation của hệ thống
- Script sẽ ghi nhận và tiếp tục với lần test tiếp theo

















