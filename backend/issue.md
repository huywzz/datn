# Lỗi Migration trên Production K8s

## Mô tả lỗi

Khi chạy migration trên môi trường production K8s, gặp lỗi:

```
Error: Unable to open file: "/app/src/config/typeorm-migration.config.ts". Cannot find module '/app/src/config/typeorm-migration.config.ts'
```

## Nguyên nhân

### 1. **File TypeScript không tồn tại trong production image**

Dockerfile của bạn sử dụng **multi-stage build** và chỉ copy thư mục `dist` (JavaScript đã compile) vào production image:

```dockerfile
# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Chỉ cài dependency production
RUN npm ci --omit=dev

# CHỈ COPY DIST - KHÔNG CÓ SOURCE CODE
COPY --from=builder /app/dist ./dist
```

**Vấn đề**: File `src/config/typeorm-migration.config.ts` không được copy vào production image, chỉ có file đã compile trong `dist/`.

### 2. **Migration script yêu cầu file .ts**

Script trong `package.json` đang chạy:

```json
"migration:up": "typeorm-ts-node-commonjs migration:run -d src/config/typeorm-migration.config.ts"
```

Command này sử dụng `typeorm-ts-node-commonjs` để chạy file TypeScript trực tiếp, nhưng:
- File `.ts` không tồn tại trong production image
- `ts-node` là devDependency và không được cài trong production (`npm ci --omit=dev`)

### 3. **DevDependencies bị loại bỏ**

Các package cần thiết để chạy TypeScript đều là devDependencies:
- `ts-node`
- `typescript`
- `tsconfig-paths`

Những package này bị loại bỏ khi chạy `npm ci --omit=dev` trong production.

## Giải pháp

### **Giải pháp 1: Sử dụng file JavaScript đã compile (Khuyến nghị)**

Thay đổi cách chạy migration để sử dụng file `.js` đã compile:

#### Bước 1: Tạo script migration mới cho production

Thêm vào `package.json`:

```json
"scripts": {
  "migration:up:prod": "typeorm migration:run -d dist/config/typeorm-migration.config.js"
}
```

#### Bước 2: Cập nhật Dockerfile

Đảm bảo copy cả file config đã compile:

```dockerfile
# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copy dist và đảm bảo có config
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

#### Bước 3: Chạy migration trong K8s

```bash
# Trong K8s pod
npm run migration:up:prod
```

Hoặc trực tiếp:

```bash
node_modules/.bin/typeorm migration:run -d dist/config/typeorm-migration.config.js
```

---

### **Giải pháp 2: Copy source code vào production (Không khuyến nghị)**

Nếu muốn giữ nguyên script hiện tại, cần:

#### Bước 1: Cập nhật Dockerfile

```dockerfile
# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Cài CẢ devDependencies để có ts-node
RUN npm ci

# Copy cả source code
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

**Nhược điểm**:
- Image size lớn hơn
- Chứa source code không cần thiết trong production
- Cài thêm devDependencies (security risk)

---

### **Giải pháp 3: Chạy migration trong init container**

Tách migration ra khỏi main application:

#### Bước 1: Tạo Dockerfile riêng cho migration

`Dockerfile.migration`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

CMD ["npm", "run", "migration:up"]
```

#### Bước 2: Cập nhật K8s deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      initContainers:
      - name: migration
        image: your-registry/backend-migration:latest
        env:
        - name: DB_HOST
          value: "mysql-service"
        # ... other env vars
      containers:
      - name: backend
        image: your-registry/backend:latest
        # ... main app config
```

---

## Khuyến nghị

**Sử dụng Giải pháp 1** vì:
- ✅ Image nhỏ gọn
- ✅ Không chứa source code trong production
- ✅ Không cần devDependencies
- ✅ Bảo mật tốt hơn
- ✅ Build time nhanh hơn

## Checklist thực hiện

- [ ] Tạo script `migration:up:prod` trong package.json
- [ ] Test migration script với file .js locally
- [ ] Cập nhật K8s deployment/job để sử dụng script mới
- [ ] Verify migration chạy thành công trong K8s
- [ ] Cập nhật documentation cho team

## Lưu ý bổ sung

### Về file config

File `typeorm-migration.config.ts` sử dụng:
- `__dirname` - sẽ trỏ đến `dist/config` sau khi compile
- Đường dẫn tương đối đến entities và migrations

Đảm bảo các đường dẫn này vẫn đúng sau khi compile sang JavaScript.

### Về environment variables

Migration cần các biến môi trường:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Đảm bảo K8s ConfigMap/Secret được mount đúng cách.
