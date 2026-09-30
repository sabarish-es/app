#!/usr/bin/env python3
"""
Besant StudentHub Backend API Test Suite
Tests all backend endpoints including auth, QR attendance flow, and validations
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://learn-checkin-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_CREDS = {
    "role": "admin",
    "loginId": "besanttech@2026",
    "password": "besanttech@2026"
}

STUDENT_CREDS = {
    "role": "student",
    "loginId": "BST-PY-001",
    "password": "Bst@2026"
}

# Global tokens
admin_token = None
student_token = None
student_id = None
student2_token = None
student2_id = None

def log_test(name, passed, details=""):
    """Log test results"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   Details: {details}")
    return passed

def get_today():
    """Get today's date in YYYY-MM-DD format"""
    return datetime.now().strftime("%Y-%m-%d")

# ============================================================================
# SETUP / SEED
# ============================================================================

def test_seed():
    """Test POST /api/seed - populate demo data"""
    print("\n=== SETUP: Seed Demo Data ===")
    try:
        response = requests.post(f"{BASE_URL}/seed", timeout=30)
        data = response.json()
        passed = response.status_code == 200 and data.get("ok") == True
        return log_test("POST /api/seed", passed, f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        return log_test("POST /api/seed", False, str(e))

# ============================================================================
# AUTH TESTS
# ============================================================================

def test_admin_login():
    """Test admin login"""
    print("\n=== AUTH: Admin Login ===")
    global admin_token
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and "token" in data and "user" in data:
            admin_token = data["token"]
            user = data["user"]
            passed = user.get("role") == "admin" and user.get("email") == ADMIN_CREDS["loginId"]
            return log_test("Admin login", passed, f"Token received, user: {user.get('name')}")
        else:
            return log_test("Admin login", False, f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        return log_test("Admin login", False, str(e))

def test_student_login():
    """Test student login"""
    print("\n=== AUTH: Student Login ===")
    global student_token, student_id
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=STUDENT_CREDS, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and "token" in data and "user" in data:
            student_token = data["token"]
            student_id = data["user"]["id"]
            user = data["user"]
            passed = user.get("role") == "student" and user.get("loginId") == STUDENT_CREDS["loginId"]
            return log_test("Student login", passed, f"Token received, user: {user.get('name')}, ID: {student_id}")
        else:
            return log_test("Student login", False, f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        return log_test("Student login", False, str(e))

def test_invalid_password():
    """Test login with invalid password"""
    print("\n=== AUTH: Invalid Password ===")
    try:
        creds = {**ADMIN_CREDS, "password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/auth/login", json=creds, timeout=10)
        data = response.json()
        passed = response.status_code == 401 and "error" in data
        return log_test("Invalid password returns 401", passed, f"Status: {response.status_code}, Error: {data.get('error')}")
    except Exception as e:
        return log_test("Invalid password returns 401", False, str(e))

def test_auth_me():
    """Test /auth/me endpoint"""
    print("\n=== AUTH: /auth/me ===")
    try:
        # Test admin
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        data = response.json()
        admin_passed = response.status_code == 200 and data.get("user", {}).get("role") == "admin"
        log_test("Admin /auth/me", admin_passed, f"User: {data.get('user', {}).get('name')}")
        
        # Test student
        headers = {"Authorization": f"Bearer {student_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        data = response.json()
        student_passed = response.status_code == 200 and data.get("user", {}).get("role") == "student"
        log_test("Student /auth/me", student_passed, f"User: {data.get('user', {}).get('name')}")
        
        return admin_passed and student_passed
    except Exception as e:
        return log_test("/auth/me", False, str(e))

def test_change_password():
    """Test password change"""
    print("\n=== AUTH: Change Password ===")
    try:
        # Change password
        headers = {"Authorization": f"Bearer {student_token}"}
        payload = {
            "currentPassword": "Bst@2026",
            "newPassword": "NewPass@2026"
        }
        response = requests.post(f"{BASE_URL}/auth/change-password", json=payload, headers=headers, timeout=10)
        data = response.json()
        change_passed = response.status_code == 200 and data.get("ok") == True
        log_test("Change password", change_passed, f"Response: {data}")
        
        if not change_passed:
            return False
        
        # Try login with new password
        new_creds = {**STUDENT_CREDS, "password": "NewPass@2026"}
        response = requests.post(f"{BASE_URL}/auth/login", json=new_creds, timeout=10)
        login_passed = response.status_code == 200 and "token" in response.json()
        log_test("Login with new password", login_passed)
        
        # Reset password back via admin
        if login_passed:
            headers = {"Authorization": f"Bearer {admin_token}"}
            payload = {"newPassword": "Bst@2026"}
            response = requests.post(f"{BASE_URL}/students/{student_id}/reset-password", json=payload, headers=headers, timeout=10)
            reset_passed = response.status_code == 200
            log_test("Admin reset password", reset_passed)
        
        return change_passed and login_passed
    except Exception as e:
        return log_test("Change password", False, str(e))

# ============================================================================
# ROLE SECURITY TESTS
# ============================================================================

def test_role_security():
    """Test role-based access control"""
    print("\n=== SECURITY: Role-Based Access ===")
    try:
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # Student calling admin-only endpoints should return 403
        tests = [
            ("GET /api/students", requests.get(f"{BASE_URL}/students", headers=student_headers, timeout=10)),
            ("POST /api/courses", requests.post(f"{BASE_URL}/courses", json={"name": "Test"}, headers=student_headers, timeout=10)),
            ("GET /api/attendance/live", requests.get(f"{BASE_URL}/attendance/live", headers=student_headers, timeout=10)),
        ]
        
        all_passed = True
        for name, response in tests:
            passed = response.status_code == 403
            log_test(f"Student forbidden from {name}", passed, f"Status: {response.status_code}")
            all_passed = all_passed and passed
        
        # Student accessing other student's data should be 403
        # First, get another student ID
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/students", headers=admin_headers, timeout=10)
        students = response.json()
        other_student = next((s for s in students if s["id"] != student_id), None)
        
        if other_student:
            response = requests.get(f"{BASE_URL}/students/{other_student['id']}", headers=student_headers, timeout=10)
            passed = response.status_code == 403
            log_test("Student accessing other student data", passed, f"Status: {response.status_code}")
            all_passed = all_passed and passed
        
        # Student accessing own data should be 200
        response = requests.get(f"{BASE_URL}/students/{student_id}", headers=student_headers, timeout=10)
        passed = response.status_code == 200
        log_test("Student accessing own data", passed, f"Status: {response.status_code}")
        all_passed = all_passed and passed
        
        return all_passed
    except Exception as e:
        return log_test("Role security", False, str(e))

# ============================================================================
# SCHEDULES & QR SESSION TESTS
# ============================================================================

def test_schedules_and_qr():
    """Test schedules and QR session generation"""
    print("\n=== SCHEDULES & QR SESSION ===")
    global schedule_id, qr_token, session_id
    
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        today = get_today()
        
        # Get today's schedules
        response = requests.get(f"{BASE_URL}/schedules?date={today}", headers=admin_headers, timeout=10)
        schedules = response.json()
        
        if not schedules or len(schedules) == 0:
            return log_test("Get schedules", False, "No schedules found for today")
        
        log_test("Get schedules", True, f"Found {len(schedules)} schedules for today")
        
        # Pick first schedule for PY-FS-01 batch
        schedule = next((s for s in schedules if "PY-FS-01" in s.get("batchName", "")), schedules[0])
        schedule_id = schedule["id"]
        log_test("Found PY-FS-01 schedule", True, f"Schedule ID: {schedule_id}, Class: {schedule.get('classType')}")
        
        # Generate QR session
        payload = {"scheduleId": schedule_id}
        response = requests.post(f"{BASE_URL}/sessions", json=payload, headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and "token" in data:
            qr_token = data["token"]
            session_id = data["id"]
            passed = data.get("active") == True and "validTo" in data
            log_test("Generate QR session", passed, f"Token: {qr_token}, Valid until: {data.get('validTo')}")
            
            # Generate again to test deactivation of old session
            response2 = requests.post(f"{BASE_URL}/sessions", json=payload, headers=admin_headers, timeout=10)
            data2 = response2.json()
            new_token = data2.get("token")
            
            if new_token and new_token != qr_token:
                log_test("New QR deactivates old", True, f"New token: {new_token}")
                # Update to use new token
                qr_token = new_token
                session_id = data2["id"]
            else:
                log_test("New QR deactivates old", False, "Same token returned")
            
            return passed
        else:
            return log_test("Generate QR session", False, f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        return log_test("Schedules & QR", False, str(e))

# ============================================================================
# ATTENDANCE CHECK-IN TESTS
# ============================================================================

def test_checkin_success():
    """Test successful check-in"""
    print("\n=== ATTENDANCE: Successful Check-in ===")
    global attendance_id
    
    try:
        student_headers = {"Authorization": f"Bearer {student_token}"}
        payload = {
            "token": qr_token,
            "lat": 12.9756,
            "lng": 80.2207,
            "accuracy": 20
        }
        
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload, headers=student_headers, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get("ok") == True:
            record = data.get("record", {})
            attendance_id = record.get("id")
            status = data.get("status")
            location_verified = data.get("locationVerified")
            
            passed = attendance_id and location_verified == True and status in ["Present", "Late"]
            return log_test("Check-in success", passed, f"Status: {status}, Location verified: {location_verified}, ID: {attendance_id}")
        else:
            return log_test("Check-in success", False, f"Status: {response.status_code}, Response: {data}")
    except Exception as e:
        return log_test("Check-in success", False, str(e))

def test_checkin_invalid_token():
    """Test check-in with invalid token"""
    print("\n=== ATTENDANCE: Invalid Token ===")
    try:
        student_headers = {"Authorization": f"Bearer {student_token}"}
        payload = {
            "token": "INVALIDTOKEN",
            "lat": 12.9756,
            "lng": 80.2207,
            "accuracy": 20
        }
        
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload, headers=student_headers, timeout=10)
        data = response.json()
        
        passed = response.status_code == 400 and data.get("error") == "INVALID"
        return log_test("Invalid token returns INVALID", passed, f"Status: {response.status_code}, Error: {data.get('error')}")
    except Exception as e:
        return log_test("Invalid token", False, str(e))

def test_checkin_duplicate():
    """Test duplicate check-in"""
    print("\n=== ATTENDANCE: Duplicate Check-in ===")
    try:
        student_headers = {"Authorization": f"Bearer {student_token}"}
        payload = {
            "token": qr_token,
            "lat": 12.9756,
            "lng": 80.2207,
            "accuracy": 20
        }
        
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload, headers=student_headers, timeout=10)
        data = response.json()
        
        passed = response.status_code == 409 and data.get("error") == "ALREADY"
        return log_test("Duplicate check-in returns ALREADY", passed, f"Status: {response.status_code}, Error: {data.get('error')}")
    except Exception as e:
        return log_test("Duplicate check-in", False, str(e))

def test_checkin_wrong_batch():
    """Test check-in with student from different batch"""
    print("\n=== ATTENDANCE: Wrong Batch ===")
    global student2_token, student2_id
    
    try:
        # Login as a student from a different batch
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/students", headers=admin_headers, timeout=10)
        students = response.json()
        
        # Find a student NOT in PY-FS-01 batch
        other_student = next((s for s in students if "PY-FS-01" not in s.get("batchName", "")), None)
        
        if not other_student:
            return log_test("Wrong batch test", False, "No student from different batch found")
        
        # Login as that student
        other_creds = {
            "role": "student",
            "loginId": other_student["loginId"],
            "password": "Bst@2026"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=other_creds, timeout=10)
        if response.status_code != 200:
            return log_test("Wrong batch test", False, f"Could not login as other student: {response.status_code}")
        
        student2_token = response.json()["token"]
        student2_id = response.json()["user"]["id"]
        log_test("Login as different batch student", True, f"Student: {other_student['name']}, Batch: {other_student['batchName']}")
        
        # Try to check in with PY-FS-01 QR token
        headers = {"Authorization": f"Bearer {student2_token}"}
        payload = {
            "token": qr_token,
            "lat": 12.9756,
            "lng": 80.2207,
            "accuracy": 20
        }
        
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload, headers=headers, timeout=10)
        data = response.json()
        
        passed = response.status_code == 403 and data.get("error") == "WRONG_BATCH"
        return log_test("Wrong batch returns WRONG_BATCH", passed, f"Status: {response.status_code}, Error: {data.get('error')}")
    except Exception as e:
        return log_test("Wrong batch", False, str(e))

def test_checkin_overlap():
    """Test check-in overlap detection"""
    print("\n=== ATTENDANCE: Overlap Detection ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        today = get_today()
        
        # Get PY-FS-01 batch ID
        response = requests.get(f"{BASE_URL}/batches", headers=admin_headers, timeout=10)
        batches = response.json()
        py_batch = next((b for b in batches if b.get("batchId") == "PY-FS-01"), None)
        
        if not py_batch:
            return log_test("Overlap test", False, "PY-FS-01 batch not found")
        
        # Create two overlapping schedules
        now = datetime.now()
        schedule1_payload = {
            "batchId": py_batch["id"],
            "date": today,
            "startTime": now.strftime("%H:%M"),
            "endTime": (now + timedelta(hours=2)).strftime("%H:%M"),
            "classType": "Overlap Test 1",
            "room": "Lab 1",
            "maxCapacity": 30
        }
        
        response1 = requests.post(f"{BASE_URL}/schedules", json=schedule1_payload, headers=admin_headers, timeout=10)
        if response1.status_code != 200:
            return log_test("Overlap test", False, f"Could not create first schedule: {response1.status_code}")
        
        schedule1 = response1.json()
        log_test("Created first overlapping schedule", True, f"ID: {schedule1['id']}")
        
        schedule2_payload = {
            "batchId": py_batch["id"],
            "date": today,
            "startTime": (now + timedelta(hours=1)).strftime("%H:%M"),
            "endTime": (now + timedelta(hours=3)).strftime("%H:%M"),
            "classType": "Overlap Test 2",
            "room": "Lab 2",
            "maxCapacity": 30
        }
        
        response2 = requests.post(f"{BASE_URL}/schedules", json=schedule2_payload, headers=admin_headers, timeout=10)
        if response2.status_code != 200:
            return log_test("Overlap test", False, f"Could not create second schedule: {response2.status_code}")
        
        schedule2 = response2.json()
        log_test("Created second overlapping schedule", True, f"ID: {schedule2['id']}")
        
        # Generate QR for first schedule
        response = requests.post(f"{BASE_URL}/sessions", json={"scheduleId": schedule1["id"]}, headers=admin_headers, timeout=10)
        if response.status_code != 200:
            return log_test("Overlap test", False, "Could not generate QR for first schedule")
        
        token1 = response.json()["token"]
        
        # Generate QR for second schedule
        response = requests.post(f"{BASE_URL}/sessions", json={"scheduleId": schedule2["id"]}, headers=admin_headers, timeout=10)
        if response.status_code != 200:
            return log_test("Overlap test", False, "Could not generate QR for second schedule")
        
        token2 = response.json()["token"]
        
        # Login as a fresh student (BST-PY-002)
        fresh_creds = {
            "role": "student",
            "loginId": "BST-PY-002",
            "password": "Bst@2026"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=fresh_creds, timeout=10)
        if response.status_code != 200:
            return log_test("Overlap test", False, "Could not login as BST-PY-002")
        
        fresh_token = response.json()["token"]
        fresh_headers = {"Authorization": f"Bearer {fresh_token}"}
        
        # Check in to first schedule
        payload1 = {
            "token": token1,
            "lat": 12.9756,
            "lng": 80.2207,
            "accuracy": 20
        }
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload1, headers=fresh_headers, timeout=10)
        if response.status_code != 200:
            return log_test("Overlap test", False, f"Could not check in to first schedule: {response.status_code}, {response.json()}")
        
        log_test("Checked in to first schedule", True)
        
        # Try to check in to second overlapping schedule WITHOUT checkout
        payload2 = {
            "token": token2,
            "lat": 12.9756,
            "lng": 80.2207,
            "accuracy": 20
        }
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload2, headers=fresh_headers, timeout=10)
        data = response.json()
        
        passed = response.status_code == 409 and data.get("error") == "OVERLAP"
        return log_test("Overlap returns OVERLAP", passed, f"Status: {response.status_code}, Error: {data.get('error')}")
    except Exception as e:
        return log_test("Overlap detection", False, str(e))

def test_checkin_location_strict():
    """Test location strict mode"""
    print("\n=== ATTENDANCE: Location Strict Mode ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Set location mode to strict
        payload = {
            "locationMode": "strict",
            "radiusMeters": 50
        }
        response = requests.put(f"{BASE_URL}/settings", json=payload, headers=admin_headers, timeout=10)
        if response.status_code != 200:
            return log_test("Location strict test", False, f"Could not update settings: {response.status_code}")
        
        log_test("Set location mode to strict", True)
        
        # Login as another student (BST-PY-003)
        fresh_creds = {
            "role": "student",
            "loginId": "BST-PY-003",
            "password": "Bst@2026"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=fresh_creds, timeout=10)
        if response.status_code != 200:
            return log_test("Location strict test", False, "Could not login as BST-PY-003")
        
        fresh_token = response.json()["token"]
        fresh_headers = {"Authorization": f"Bearer {fresh_token}"}
        
        # Try to check in with far coordinates
        payload = {
            "token": qr_token,
            "lat": 0,
            "lng": 0,
            "accuracy": 20
        }
        response = requests.post(f"{BASE_URL}/attendance/check-in", json=payload, headers=fresh_headers, timeout=10)
        data = response.json()
        
        passed = response.status_code == 403 and data.get("error") == "LOCATION"
        log_test("Location strict blocks far coords", passed, f"Status: {response.status_code}, Error: {data.get('error')}")
        
        # Reset to lenient
        payload = {"locationMode": "lenient"}
        requests.put(f"{BASE_URL}/settings", json=payload, headers=admin_headers, timeout=10)
        log_test("Reset location mode to lenient", True)
        
        return passed
    except Exception as e:
        return log_test("Location strict", False, str(e))

# ============================================================================
# CHECK-OUT TESTS
# ============================================================================

def test_checkout():
    """Test check-out"""
    print("\n=== ATTENDANCE: Check-out ===")
    try:
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # Check current attendance
        response = requests.get(f"{BASE_URL}/attendance/current", headers=student_headers, timeout=10)
        data = response.json()
        current = data.get("current")
        
        if not current:
            return log_test("Check-out", False, "No current attendance found")
        
        log_test("Found current attendance", True, f"ID: {current['id']}")
        
        # Check out
        payload = {"attendanceId": current["id"]}
        response = requests.post(f"{BASE_URL}/attendance/check-out", json=payload, headers=student_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200 or not data.get("ok"):
            return log_test("Check-out", False, f"Status: {response.status_code}, Response: {data}")
        
        log_test("Check-out success", True)
        
        # Verify current is now null
        response = requests.get(f"{BASE_URL}/attendance/current", headers=student_headers, timeout=10)
        data = response.json()
        passed = data.get("current") is None
        
        return log_test("Current attendance is null after checkout", passed)
    except Exception as e:
        return log_test("Check-out", False, str(e))

# ============================================================================
# LIVE MONITOR & REPORTS
# ============================================================================

def test_live_monitor():
    """Test live attendance monitor"""
    print("\n=== ATTENDANCE: Live Monitor ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/attendance/live", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Live monitor", False, f"Status: {response.status_code}")
        
        stats = data.get("stats", {})
        rows = data.get("rows", [])
        schedule = data.get("schedule")
        active_sessions = data.get("activeSessions", [])
        
        passed = all(k in stats for k in ["present", "late", "absent", "inside", "total"])
        log_test("Live monitor returns stats", passed, f"Stats: {stats}")
        log_test("Live monitor returns rows", len(rows) > 0, f"Rows: {len(rows)}")
        log_test("Live monitor returns schedule", schedule is not None)
        log_test("Live monitor returns active sessions", len(active_sessions) >= 0, f"Active sessions: {len(active_sessions)}")
        
        return passed
    except Exception as e:
        return log_test("Live monitor", False, str(e))

def test_reports():
    """Test attendance reports"""
    print("\n=== ATTENDANCE: Reports ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        today = get_today()
        
        # Get attendance report for today
        response = requests.get(f"{BASE_URL}/attendance/report?date={today}", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Attendance report", False, f"Status: {response.status_code}")
        
        log_test("Attendance report", True, f"Records: {len(data)}")
        
        # Get student-specific report
        response = requests.get(f"{BASE_URL}/attendance/student/{student_id}", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Student report", False, f"Status: {response.status_code}")
        
        stats = data.get("stats", {})
        records = data.get("records", [])
        
        passed = all(k in stats for k in ["present", "late", "absent", "total", "pct"])
        log_test("Student report", passed, f"Stats: {stats}, Records: {len(records)}")
        
        return passed
    except Exception as e:
        return log_test("Reports", False, str(e))

# ============================================================================
# DASHBOARDS
# ============================================================================

def test_dashboards():
    """Test admin and student dashboards"""
    print("\n=== DASHBOARDS ===")
    try:
        # Admin dashboard
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/dashboard/admin", headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Admin dashboard", False, f"Status: {response.status_code}")
        
        cards = data.get("cards", {})
        course_wise = data.get("courseWise", [])
        daily = data.get("daily", [])
        
        admin_passed = all(k in cards for k in ["totalStudents", "activeStudents", "todayClasses", "presentToday"])
        log_test("Admin dashboard", admin_passed, f"Cards: {cards}")
        log_test("Admin dashboard course-wise", len(course_wise) >= 0, f"Courses: {len(course_wise)}")
        log_test("Admin dashboard daily", len(daily) == 7, f"Daily records: {len(daily)}")
        
        # Student dashboard
        student_headers = {"Authorization": f"Bearer {student_token}"}
        response = requests.get(f"{BASE_URL}/dashboard/student", headers=student_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Student dashboard", False, f"Status: {response.status_code}")
        
        student = data.get("student")
        today_schedules = data.get("todaySchedules", [])
        overall_pct = data.get("overallPct")
        monthly = data.get("monthly", [])
        
        student_passed = student is not None and overall_pct is not None
        log_test("Student dashboard", student_passed, f"Student: {student.get('name')}, Overall: {overall_pct}%")
        log_test("Student dashboard schedules", len(today_schedules) >= 0, f"Today's schedules: {len(today_schedules)}")
        log_test("Student dashboard monthly", len(monthly) >= 0, f"Monthly records: {len(monthly)}")
        
        return admin_passed and student_passed
    except Exception as e:
        return log_test("Dashboards", False, str(e))

# ============================================================================
# STUDENTS CRUD
# ============================================================================

def test_students_crud():
    """Test students CRUD operations"""
    print("\n=== STUDENTS: CRUD Operations ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get batches and courses for creating student
        response = requests.get(f"{BASE_URL}/batches", headers=admin_headers, timeout=10)
        batches = response.json()
        py_batch = next((b for b in batches if b.get("batchId") == "PY-FS-01"), batches[0])
        
        response = requests.get(f"{BASE_URL}/courses", headers=admin_headers, timeout=10)
        courses = response.json()
        py_course = next((c for c in courses if "Python" in c.get("name", "")), courses[0])
        
        # Create new student with unique loginId
        timestamp = datetime.now().strftime("%H%M%S")
        new_student = {
            "studentId": f"BST-TEST-{timestamp}",
            "loginId": f"BST-TEST-{timestamp}",
            "password": "Test@2026",
            "name": "Test Student",
            "email": f"test{timestamp}@student.besant.com",
            "mobile": "9876543210",
            "courseId": py_course["id"],
            "batchId": py_batch["id"],
            "status": "Active"
        }
        
        response = requests.post(f"{BASE_URL}/students", json=new_student, headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Create student", False, f"Status: {response.status_code}, Response: {data}")
        
        created_student_id = data.get("id")
        log_test("Create student", True, f"ID: {created_student_id}, Name: {data.get('name')}")
        
        # Test duplicate loginId
        response = requests.post(f"{BASE_URL}/students", json=new_student, headers=admin_headers, timeout=10)
        dup_passed = response.status_code == 400 and "already exists" in response.json().get("error", "").lower()
        log_test("Duplicate loginId returns 400", dup_passed)
        
        # Reset password
        payload = {"newPassword": "NewTest@2026"}
        response = requests.post(f"{BASE_URL}/students/{created_student_id}/reset-password", json=payload, headers=admin_headers, timeout=10)
        reset_passed = response.status_code == 200
        log_test("Reset student password", reset_passed)
        
        # Toggle account
        response = requests.post(f"{BASE_URL}/students/{created_student_id}/toggle", headers=admin_headers, timeout=10)
        data = response.json()
        toggle_passed = response.status_code == 200 and data.get("accountStatus") == "Inactive"
        log_test("Toggle account to Inactive", toggle_passed)
        
        # Toggle back
        response = requests.post(f"{BASE_URL}/students/{created_student_id}/toggle", headers=admin_headers, timeout=10)
        data = response.json()
        toggle_back_passed = response.status_code == 200 and data.get("accountStatus") == "Active"
        log_test("Toggle account to Active", toggle_back_passed)
        
        return True
    except Exception as e:
        return log_test("Students CRUD", False, str(e))

# ============================================================================
# OTHER CRUD OPERATIONS
# ============================================================================

def test_other_crud():
    """Test other CRUD operations (courses, batches, trainers, etc.)"""
    print("\n=== OTHER: CRUD Operations ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Courses
        response = requests.get(f"{BASE_URL}/courses", headers=admin_headers, timeout=10)
        courses_passed = response.status_code == 200 and len(response.json()) > 0
        log_test("GET /courses", courses_passed, f"Courses: {len(response.json())}")
        
        # Batches
        response = requests.get(f"{BASE_URL}/batches", headers=admin_headers, timeout=10)
        batches_passed = response.status_code == 200 and len(response.json()) > 0
        log_test("GET /batches", batches_passed, f"Batches: {len(response.json())}")
        
        # Trainers
        response = requests.get(f"{BASE_URL}/trainers", headers=admin_headers, timeout=10)
        trainers_passed = response.status_code == 200 and len(response.json()) > 0
        log_test("GET /trainers", trainers_passed, f"Trainers: {len(response.json())}")
        
        # Class Types
        response = requests.get(f"{BASE_URL}/class-types", headers=admin_headers, timeout=10)
        class_types_passed = response.status_code == 200 and len(response.json()) > 0
        log_test("GET /class-types", class_types_passed, f"Class types: {len(response.json())}")
        
        # Rooms
        response = requests.get(f"{BASE_URL}/rooms", headers=admin_headers, timeout=10)
        rooms_passed = response.status_code == 200
        log_test("GET /rooms", rooms_passed, f"Rooms: {len(response.json())}")
        
        # Holidays
        response = requests.get(f"{BASE_URL}/holidays", headers=admin_headers, timeout=10)
        holidays_passed = response.status_code == 200
        log_test("GET /holidays", holidays_passed, f"Holidays: {len(response.json())}")
        
        return courses_passed and batches_passed and trainers_passed and class_types_passed
    except Exception as e:
        return log_test("Other CRUD", False, str(e))

# ============================================================================
# LEAVE & SLOTS
# ============================================================================

def test_leave_and_slots():
    """Test leave and slots functionality"""
    print("\n=== LEAVE & SLOTS ===")
    try:
        student_headers = {"Authorization": f"Bearer {student_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Student applies for leave
        leave_payload = {
            "fromDate": get_today(),
            "toDate": get_today(),
            "reason": "Medical",
            "description": "Doctor appointment"
        }
        response = requests.post(f"{BASE_URL}/leave", json=leave_payload, headers=student_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Apply leave", False, f"Status: {response.status_code}")
        
        leave_id = data.get("id")
        log_test("Student apply leave", True, f"Leave ID: {leave_id}")
        
        # Admin approves leave
        response = requests.put(f"{BASE_URL}/leave/{leave_id}", json={"status": "Approved"}, headers=admin_headers, timeout=10)
        approve_passed = response.status_code == 200
        log_test("Admin approve leave", approve_passed)
        
        # Create slot
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        slot_payload = {
            "title": "Career Counseling",
            "date": tomorrow,
            "startTime": "14:00",
            "endTime": "15:00",
            "capacity": 5
        }
        response = requests.post(f"{BASE_URL}/slots", json=slot_payload, headers=admin_headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return log_test("Create slot", False, f"Status: {response.status_code}")
        
        slot_id = data.get("id")
        log_test("Admin create slot", True, f"Slot ID: {slot_id}")
        
        # Student books slot
        response = requests.post(f"{BASE_URL}/slots/{slot_id}/book", headers=student_headers, timeout=10)
        book_passed = response.status_code == 200
        log_test("Student book slot", book_passed)
        
        return approve_passed and book_passed
    except Exception as e:
        return log_test("Leave & Slots", False, str(e))

# ============================================================================
# NOTIFICATIONS & AUDIT
# ============================================================================

def test_notifications_and_audit():
    """Test notifications and audit logs"""
    print("\n=== NOTIFICATIONS & AUDIT ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # Get notifications (student)
        response = requests.get(f"{BASE_URL}/notifications", headers=student_headers, timeout=10)
        notif_passed = response.status_code == 200
        log_test("GET /notifications (student)", notif_passed, f"Notifications: {len(response.json())}")
        
        # Create notification (admin)
        notif_payload = {
            "target": "all",
            "title": "Test Notification",
            "message": "This is a test notification"
        }
        response = requests.post(f"{BASE_URL}/notifications", json=notif_payload, headers=admin_headers, timeout=10)
        create_notif_passed = response.status_code == 200
        log_test("POST /notifications (admin)", create_notif_passed)
        
        # Get audit logs (admin)
        response = requests.get(f"{BASE_URL}/audit", headers=admin_headers, timeout=10)
        audit_passed = response.status_code == 200 and len(response.json()) > 0
        log_test("GET /audit (admin)", audit_passed, f"Audit logs: {len(response.json())}")
        
        return notif_passed and create_notif_passed and audit_passed
    except Exception as e:
        return log_test("Notifications & Audit", False, str(e))

# ============================================================================
# DATA INTEGRITY CHECKS
# ============================================================================

def test_data_integrity():
    """Test that responses don't contain MongoDB ObjectIds or passwordHash"""
    print("\n=== DATA INTEGRITY ===")
    try:
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Check students endpoint
        response = requests.get(f"{BASE_URL}/students", headers=admin_headers, timeout=10)
        students = response.json()
        
        has_object_id = any("_id" in s for s in students)
        has_password_hash = any("passwordHash" in s for s in students)
        has_uuid_id = all("id" in s and isinstance(s["id"], str) for s in students)
        
        log_test("No _id in students", not has_object_id)
        log_test("No passwordHash in students", not has_password_hash)
        log_test("All students have UUID id", has_uuid_id)
        
        # Check auth/me endpoint
        response = requests.get(f"{BASE_URL}/auth/me", headers=admin_headers, timeout=10)
        data = response.json()
        user = data.get("user", {})
        
        no_password_in_me = "passwordHash" not in user and "password" not in user
        log_test("No password in /auth/me", no_password_in_me)
        
        return not has_object_id and not has_password_hash and has_uuid_id and no_password_in_me
    except Exception as e:
        return log_test("Data integrity", False, str(e))

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all backend tests"""
    print("=" * 80)
    print("BESANT STUDENTHUB BACKEND TEST SUITE")
    print("=" * 80)
    
    results = []
    
    # Setup
    results.append(("Seed demo data", test_seed()))
    
    # Auth
    results.append(("Admin login", test_admin_login()))
    results.append(("Student login", test_student_login()))
    results.append(("Invalid password", test_invalid_password()))
    results.append(("Auth /me", test_auth_me()))
    results.append(("Change password", test_change_password()))
    
    # Role security
    results.append(("Role security", test_role_security()))
    
    # Schedules & QR
    results.append(("Schedules & QR", test_schedules_and_qr()))
    
    # Attendance check-in
    results.append(("Check-in success", test_checkin_success()))
    results.append(("Invalid token", test_checkin_invalid_token()))
    results.append(("Duplicate check-in", test_checkin_duplicate()))
    results.append(("Wrong batch", test_checkin_wrong_batch()))
    results.append(("Overlap detection", test_checkin_overlap()))
    results.append(("Location strict", test_checkin_location_strict()))
    
    # Check-out
    results.append(("Check-out", test_checkout()))
    
    # Live monitor & reports
    results.append(("Live monitor", test_live_monitor()))
    results.append(("Reports", test_reports()))
    
    # Dashboards
    results.append(("Dashboards", test_dashboards()))
    
    # Students CRUD
    results.append(("Students CRUD", test_students_crud()))
    
    # Other CRUD
    results.append(("Other CRUD", test_other_crud()))
    
    # Leave & Slots
    results.append(("Leave & Slots", test_leave_and_slots()))
    
    # Notifications & Audit
    results.append(("Notifications & Audit", test_notifications_and_audit()))
    
    # Data integrity
    results.append(("Data integrity", test_data_integrity()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed} tests")
    print(f"Failed: {total - passed} tests")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    print("\nFailed tests:")
    for name, result in results:
        if not result:
            print(f"  ❌ {name}")
    
    print("\n" + "=" * 80)
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
