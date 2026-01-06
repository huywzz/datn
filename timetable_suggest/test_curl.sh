#!/bin/bash

# Test script using curl for Timetable Suggest API

API_URL="http://localhost:5000"

echo "=========================================="
echo "Testing Timetable Suggest API with curl"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check Endpoint"
echo "-----------------------------------"
curl -X GET "${API_URL}/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n"
echo ""
echo ""

# Test 2: Suggest Timetable with example data
echo "2. Testing Suggest Timetable Endpoint"
echo "-----------------------------------"
curl -X POST "${API_URL}/suggest-timetable" \
  -H "Content-Type: application/json" \
  -d @example_request.json \
  -w "\nStatus Code: %{http_code}\n"
echo ""
echo ""

# Test 3: Suggest Timetable with empty data
echo "3. Testing Suggest Timetable with Empty Data"
echo "-----------------------------------"
curl -X POST "${API_URL}/suggest-timetable" \
  -H "Content-Type: application/json" \
  -d '{"courseSections": []}' \
  -w "\nStatus Code: %{http_code}\n"
echo ""
echo ""

# Test 4: Suggest Timetable with invalid data
echo "4. Testing Suggest Timetable with Invalid Data"
echo "-----------------------------------"
curl -X POST "${API_URL}/suggest-timetable" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' \
  -w "\nStatus Code: %{http_code}\n"
echo ""
echo ""

echo "=========================================="
echo "Tests completed"
echo "=========================================="

