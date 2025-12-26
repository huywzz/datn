"""
File cấu hình cho Stress Test
Có thể chỉnh sửa các giá trị này hoặc override bằng command line arguments
"""

# Base URL của backend API
BASE_URL = "http://localhost:3004"

# Thông tin đăng nhập (có thể override bằng command line)
EMAIL = "student1@gmail.com"
PASSWORD = "password"

# Số lần lặp lại test (mỗi lần = 1 flow đăng ký + 1 hủy)
NUM_ITERATIONS = 300

# Số thread chạy đồng thời (1 = tuần tự, >1 = song song)
NUM_THREADS = 16

# Tên file CSV để lưu kết quả
OUTPUT_FILE = "distribution.csv"
