# Hướng dẫn Docker cho Frontend

Tài liệu này hướng dẫn cách build, run và push Docker image cho ứng dụng Frontend.

## 1. Build Image

Chạy lệnh sau tại thư mục gốc của dự án (nơi chứa `Dockerfile`):

```bash
docker build -t frontend-app:latest .
```

*Lưu ý: Không cần truyền `--build-arg` cho các biến môi trường nữa vì chúng sẽ được xử lý khi chạy container.*

## 2. Run Container (Quan trọng)

Bạn cần truyền các biến môi trường bằng cờ `-e` khi chạy container. Script khởi động sẽ tự động tạo file cấu hình để React đọc được.

```bash
docker run -d -p 8080:80 \
  -e VITE_URL_API="http://api.example.com" \
  -e VITE_GOOGLE_CLIENT_ID="your-google-client-id" \
  -e VITE_FIREBASE_API_KEY="your-firebase-key" \
  -e VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  -e VITE_FIREBASE_PROJECT_ID="your-project-id" \
  -e VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app" \
  -e VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  -e VITE_FIREBASE_APP_ID="your-app-id" \
  -e VITE_CLERK_PUBLISHABLE_KEY="your-clerk-key" \
  --name frontend-container \
  frontend-app:latest
```

### Sử dụng Docker Compose (Khuyên dùng)

Tạo file `docker-compose.yml`:

```yaml
services:
  frontend:
    image: frontend-app:latest
    ports:
      - "8080:80"
    env_file:
      - .env
```

Sau đó tạo file `.env` chứa các giá trị thực tế và chạy:

```bash
docker-compose up -d
```

## 3. Push lên Docker Hub

1.  **Login**: `docker login`
2.  **Tag**: `docker tag frontend-app:latest <username>/frontend-app:latest`
3.  **Push**: `docker push <username>/frontend-app:latest`
