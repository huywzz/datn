## TypeORM Migration & Seed — Quick Guide

### Migration
- **Tạo từ thay đổi entity**
```bash
npm run migration:generate --name=<TenMigration>
```
- **Chạy**
```bash
npm run migration:up
```
- **Revert 1 bước**
```bash
npm run migration:revert
```
- **Xem trạng thái**
```bash
npm run migration:show
```

Ghi chú: cấu hình CLI ở `src/config/typeorm-migration.config.ts`. File migration nằm tại `src/provider/mysql/migrations/`.

### Seed
- **Tạo file seed**
```bash
npm run seed:create --name=<ten-seed> --env=<local|dev|stag|prod>
```
- **Chạy seed theo môi trường**
```bash
npm run seed:local
npm run seed:dev
npm run seed:stag
npm run seed:prod
```

Seed được tạo tại `src/provider/mysql/seeds/<env>/`.
