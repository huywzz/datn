"""
Test script for Timetable Suggest API
"""
import requests
import json

API_URL = "http://localhost:5000"


def test_health_check():
    """Test health check endpoint"""
    print("Testing health check endpoint...")
    response = requests.get(f"{API_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    print("-" * 50)
    return response.status_code == 200


def test_suggest_timetable():
    """Test suggest-timetable endpoint with sample data"""
    print("Testing suggest-timetable endpoint...")
    
    # Sample data matching the structure from findAll() of course section
    sample_data = {
        "courseSections": [
            {
                "sectionId": 1,
                "sectionCode": "CS101-01",
                "courseId": 1,
                "instructorId": 1,
                "maxStudents": 50,
                "currentStudents": 30,
                "status": "open",
                "semesterId": 1,
                "schedule": "Thứ 2 (Tiết 1-3) - A101; Thứ 4 (Tiết 1-3) - A101",
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z",
                "course": {
                    "courseId": 1,
                    "code": "CS101",
                    "name": "Introduction to Computer Science",
                    "credits": 3,
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z"
                },
                "instructor": {
                    "instructorId": 1,
                    "fullName": "Nguyễn Văn A",
                    "department": "Computer Science",
                    "title": "Professor",
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z"
                },
                "classSchedules": [
                    {
                        "scheduleId": 1,
                        "sectionId": 1,
                        "dayOfWeek": "1",
                        "startPeriod": 1,
                        "endPeriod": 3,
                        "room": "A101",
                        "createdAt": "2024-01-01T00:00:00.000Z",
                        "updatedAt": "2024-01-01T00:00:00.000Z"
                    },
                    {
                        "scheduleId": 2,
                        "sectionId": 1,
                        "dayOfWeek": "3",
                        "startPeriod": 1,
                        "endPeriod": 3,
                        "room": "A101",
                        "createdAt": "2024-01-01T00:00:00.000Z",
                        "updatedAt": "2024-01-01T00:00:00.000Z"
                    }
                ]
            },
            {
                "sectionId": 2,
                "sectionCode": "MATH201-02",
                "courseId": 2,
                "instructorId": 2,
                "maxStudents": 40,
                "currentStudents": 25,
                "status": "open",
                "semesterId": 1,
                "schedule": "Thứ 3 (Tiết 4-6) - B202",
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z",
                "course": {
                    "courseId": 2,
                    "code": "MATH201",
                    "name": "Calculus I",
                    "credits": 4,
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z"
                },
                "instructor": {
                    "instructorId": 2,
                    "fullName": "Trần Thị B",
                    "department": "Mathematics",
                    "title": "Associate Professor",
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z"
                },
                "classSchedules": [
                    {
                        "scheduleId": 3,
                        "sectionId": 2,
                        "dayOfWeek": "2",
                        "startPeriod": 4,
                        "endPeriod": 6,
                        "room": "B202",
                        "createdAt": "2024-01-01T00:00:00.000Z",
                        "updatedAt": "2024-01-01T00:00:00.000Z"
                    }
                ]
            }
        ],
        "studentPreferences": "Tôi muốn học vào buổi sáng, không học thứ 7, và muốn đăng ký các môn CS101, MATH201"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/suggest-timetable",
            json=sample_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print("-" * 50)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Successfully processed {result.get('count', 0)} course sections")
            return True
        else:
            print(f"✗ Request failed with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Error: Cannot connect to API. Make sure the Flask server is running.")
        return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False


def test_suggest_timetable_empty():
    """Test suggest-timetable endpoint with empty data"""
    print("Testing suggest-timetable endpoint with empty data...")
    
    try:
        response = requests.post(
            f"{API_URL}/suggest-timetable",
            json={"courseSections": []},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print("-" * 50)
        return response.status_code == 200
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False


def test_suggest_timetable_invalid():
    """Test suggest-timetable endpoint with invalid data"""
    print("Testing suggest-timetable endpoint with invalid data...")
    
    try:
        response = requests.post(
            f"{API_URL}/suggest-timetable",
            json={"invalid": "data"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        print("-" * 50)
        return response.status_code == 400
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("Timetable Suggest API Test Suite")
    print("=" * 50)
    print()
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health_check()))
    print()
    results.append(("Suggest Timetable (Valid)", test_suggest_timetable()))
    print()
    results.append(("Suggest Timetable (Empty)", test_suggest_timetable_empty()))
    print()
    results.append(("Suggest Timetable (Invalid)", test_suggest_timetable_invalid()))
    print()
    
    # Summary
    print("=" * 50)
    print("Test Summary")
    print("=" * 50)
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")

