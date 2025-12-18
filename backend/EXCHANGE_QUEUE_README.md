# Hệ thống Queue Trao đổi Tín chỉ

## Tổng quan

Hệ thống queue tự động xử lý các giao dịch trao đổi tín chỉ giữa sinh viên. Khi một transaction trao đổi được tạo, nó sẽ được thêm vào queue và được xử lý tự động theo chu kỳ.

## Cấu hình

### Biến môi trường

Thêm vào file `.env`:

```env
EXCHANGE_QUEUE_INTERVAL_TIME=60
```

- **EXCHANGE_QUEUE_INTERVAL_TIME**: Thời gian interval (tính bằng giây) giữa các lần xử lý queue
- Giá trị mặc định: 60 giây (1 phút)
- Khuyến nghị: 30-300 giây tùy vào tải hệ thống

## Quy trình hoạt động

### 1. Tạo Transaction

Khi sinh viên tạo một exchange transaction:
- Transaction được lưu vào database với status `PENDING`
- Transaction ID được tự động thêm vào queue (Redis List)

### 2. Xử lý Queue (Tự động)

Mỗi `EXCHANGE_QUEUE_INTERVAL_TIME` giây, hệ thống sẽ:

#### Bước 1: Lấy transaction từ queue
- Lấy transaction đầu tiên từ queue (FIFO - First In First Out)
- Kiểm tra transaction còn tồn tại và ở trạng thái `PENDING`

#### Bước 2: Thử thực hiện độc lập
- Gọi `executeSingleTransaction(transactionId)`
- Nếu thành công:
  - Transaction status → `COMPLETED`
  - Các thao tác REMOVE và ADD được thực hiện
  - Kết thúc xử lý

#### Bước 3: Thử ghép đôi (nếu bước 2 thất bại)
- Lặp qua tất cả transactions còn lại trong queue
- Với mỗi transaction khác, thử gọi `executeTransaction(tx1, tx2)`
- Nếu ghép thành công:
  - Cả 2 transactions status → `COMPLETED`
  - Thao tác trao đổi được thực hiện
  - Xóa transaction đã ghép khỏi queue
  - Kết thúc xử lý

#### Bước 4: Thêm lại vào queue (nếu không thành công)
- Nếu không thể thực hiện độc lập và không ghép được với bất kỳ transaction nào
- Transaction được thêm lại vào cuối queue
- Sẽ được xử lý lại trong lần chạy tiếp theo

## API Endpoints

### 1. Tạo Exchange Transaction

```http
POST /exchange-transactions
```

**Body:**
```json
{
  "items": [
    {
      "sectionId": 1,
      "action": "REMOVE",
      "note": "Xóa lớp này"
    },
    {
      "sectionId": 2,
      "action": "ADD",
      "note": "Thêm lớp này"
    }
  ],
  "description": "Trao đổi lớp học phần"
}
```

**Response:** Transaction được tạo và tự động thêm vào queue

### 2. Thực hiện thủ công (Manual Trigger)

```http
POST /exchange-transactions/queue/process
```

Trigger xử lý queue ngay lập tức (không cần đợi interval)

### 3. Xem thông tin Queue

```http
GET /exchange-transactions/queue/info
```

**Response:**
```json
{
  "size": 5,
  "transactionIds": [101, 102, 103, 104, 105],
  "isProcessing": false
}
```

### 4. Thực hiện Transaction độc lập

```http
POST /exchange-transactions/:id/execute-single
```

Thực hiện một transaction cụ thể mà không cần queue

### 5. Thực hiện cặp Transactions

```http
POST /exchange-transactions/execute-pair
```

**Body:**
```json
{
  "transaction1Id": 101,
  "transaction2Id": 102
}
```

Thực hiện 2 transactions cùng nhau (trao đổi giữa 2 sinh viên)

## Kiến trúc

### Services

1. **ExchangeQueueService**
   - Quản lý queue với Redis
   - Thêm/xóa/lấy transactions từ queue
   - Đánh dấu trạng thái processing

2. **ExchangeProcessorService**
   - Xử lý queue theo chu kỳ với Cron job
   - Logic matching transactions
   - Thử thực hiện độc lập và ghép đôi

3. **ExchangeTransactionService**
   - Tạo/cập nhật/xóa transactions
   - `executeSingleTransaction()`: Thực hiện 1 transaction
   - `executeTransaction()`: Thực hiện 2 transactions

4. **ExchangeValidationService**
   - Validate điều kiện trao đổi
   - Kiểm tra lịch học, capacity, môn học

### Database Transaction

Tất cả thao tác execute đều sử dụng database transaction với:
- **Pessimistic locking** để tránh race condition
- **ACID compliance** đảm bảo tính toàn vẹn dữ liệu
- Thứ tự: REMOVE trước, ADD sau
- Kiểm tra capacity trước khi ADD

## Monitoring & Debugging

### Logs

Hệ thống ghi log chi tiết:
- Khi bắt đầu/kết thúc xử lý queue
- Khi thử thực hiện transaction
- Khi ghép thành công/thất bại
- Các lỗi xảy ra

### Redis Keys

- `exchange:queue`: List chứa transaction IDs
- `exchange:processing:{transactionId}`: Đánh dấu transaction đang được xử lý

### Kiểm tra Queue

```bash
# Redis CLI
redis-cli

# Xem tất cả transactions trong queue
LRANGE exchange:queue 0 -1

# Xem số lượng
LLEN exchange:queue

# Kiểm tra transaction đang xử lý
KEYS exchange:processing:*
```

## Best Practices

1. **Interval Time**
   - Không nên quá ngắn (< 10s) để tránh overload
   - Không nên quá dài (> 300s) để đảm bảo trải nghiệm người dùng

2. **Queue Size**
   - Theo dõi queue size thường xuyên
   - Nếu queue tăng liên tục → cần giảm interval hoặc tối ưu logic

3. **Error Handling**
   - Transactions không hợp lệ sẽ tự động bị xóa khỏi queue
   - Transactions không thể thực hiện sẽ được thử lại trong lần chạy sau

4. **Manual Intervention**
   - Sử dụng manual trigger khi cần xử lý khẩn cấp
   - Sử dụng execute-single/execute-pair khi biết chắc transaction sẽ thành công

## Troubleshooting

### Queue không được xử lý
- Kiểm tra cron job có chạy không
- Kiểm tra Redis connection
- Xem logs để tìm lỗi

### Transaction bị stuck trong queue
- Kiểm tra transaction status trong database
- Kiểm tra validation errors
- Thử execute thủ công để xem lỗi cụ thể

### Performance issues
- Giảm interval time nếu queue xử lý chậm
- Tăng interval time nếu system overload
- Optimize validation logic

