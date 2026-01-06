@echo off
REM Test script using curl for Timetable Suggest API (Windows)

set API_URL=http://localhost:5000

echo ==========================================
echo Testing Timetable Suggest API with curl
echo ==========================================
echo.

REM Test 1: Health Check
echo 1. Testing Health Check Endpoint
echo -----------------------------------
curl -X GET "%API_URL%/health" -H "Content-Type: application/json"
echo.
echo.

REM Test 2: Suggest Timetable with example data
echo 2. Testing Suggest Timetable Endpoint
echo -----------------------------------
curl -X POST "%API_URL%/suggest-timetable" -H "Content-Type: application/json" -d @example_request.json
echo.
echo.

REM Test 3: Suggest Timetable with empty data
echo 3. Testing Suggest Timetable with Empty Data
echo -----------------------------------
curl -X POST "%API_URL%/suggest-timetable" -H "Content-Type: application/json" -d "{\"courseSections\": []}"
echo.
echo.

REM Test 4: Suggest Timetable with invalid data
echo 4. Testing Suggest Timetable with Invalid Data
echo -----------------------------------
curl -X POST "%API_URL%/suggest-timetable" -H "Content-Type: application/json" -d "{\"invalid\": \"data\"}"
echo.
echo.

echo ==========================================
echo Tests completed
echo ==========================================
pause

