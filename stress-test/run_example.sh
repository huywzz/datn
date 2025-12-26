#!/bin/bash
# Ví dụ chạy stress test

# Test tuần tự 10 lần
python stress_test.py \
  --url http://localhost:3000 \
  --email student@example.com \
  --password password123 \
  --iterations 10 \
  --threads 1 \
  --output distribution.csv

# Test song song với 5 thread, mỗi thread 10 lần (tổng 50 requests)
# python stress_test.py \
#   --url http://localhost:3000 \
#   --email student@example.com \
#   --password password123 \
#   --iterations 50 \
#   --threads 5 \
#   --output distribution.csv














