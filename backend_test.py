#!/usr/bin/env python3
"""
Backend API Testing for Besant StudentHub - Round 2
Tests new features: Trainer Auth, Trainer Dashboard, Branches, Placements, Calendar, Branch-aware check-in
"""
import requests
import json
import time
from datetime import datetime, timedelta

# Base URL from .env
BASE_URL = "https://learn-checkin-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_CREDS = {"role": "admin", "loginId": "besanttech@2026", "password": "besanttech@2026"}
TRAINER_CREDS = {"role": "trainer", "loginId": "TR-01", "password": "Trainer@2026"}
STUDENT_CREDS = {"role": "student", "loginId": "BST-PY-001", "password": "Bst@2026"}

# Global tokens
admin_token = None
trainer_token = None
student_token = None
trainer_user = None
student_user = None

def log(msg):
    print(f"[TEST] {msg}", flush=True)

def test_result(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}", flush=True)
    if detail:
        print(f"    {detail}", flush=True)
    return passed

def post(endpoint, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{endpoint}"
    try:
        time.sleep(0.1)  # Small delay to avoid rate limiting
        r = requests.post(url, json=data or {}, headers=headers, timeout=30)
        return r
    except requests.exceptions.Timeout:
        log(f"POST {endpoint} timeout after 30s")
        return None
    except requests.exceptions.ConnectionError as e:
        log(f"POST {endpoint} connection error: {str(e)[:100]}")
        return None
    except Exception as e:
        log(f"POST {endpoint} error: {type(e).__name__}: {str(e)[:100]}")
        return None

def get(endpoint, token=None, params=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{endpoint}"
    try:
        time.sleep(0.1)  # Small delay to avoid rate limiting
        r = requests.get(url, headers=headers, params=params or {}, timeout=30)
        return r
    except requests.exceptions.Timeout:
        log(f"GET {endpoint} timeout after 30s")
        return None
    except requests.exceptions.ConnectionError as e:
        log(f"GET {endpoint} connection error: {str(e)[:100]}")
        return None
    except Exception as e:
        log(f"GET {endpoint} error: {type(e).__name__}: {str(e)[:100]}")
        return None

def put(endpoint, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{endpoint}"
    try:
        time.sleep(0.1)  # Small delay to avoid rate limiting
        r = requests.put(url, json=data or {}, headers=headers, timeout=30)
        return r
    except requests.exceptions.Timeout:
        log(f"PUT {endpoint} timeout after 30s")
        return None
    except requests.exceptions.ConnectionError as e:
        log(f"PUT {endpoint} connection error: {str(e)[:100]}")
        return None
    except Exception as e:
        log(f"PUT {endpoint} error: {type(e).__name__}: {str(e)[:100]}")
        return None

def delete(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{endpoint}"
    try:
        time.sleep(0.1)  # Small delay to avoid rate limiting
        r = requests.delete(url, headers=headers, timeout=30)
        return r
    except requests.exceptions.Timeout:
        log(f"DELETE {endpoint} timeout after 30s")
        return None
    except requests.exceptions.ConnectionError as e:
        log(f"DELETE {endpoint} connection error: {str(e)[:100]}")
        return None
    except Exception as e:
        log(f"DELETE {endpoint} error: {type(e).__name__}: {str(e)[:100]}")
        return None

# ============ SETUP ============
def setup():
    global admin_token, trainer_token, student_token, trainer_user, student_user
    
    log("=== SETUP: Seed data and login ===")
    
    # 1. Seed data (migrates trainers + seeds branches/placements)
    r = post("/seed", {})
    if not test_result("POST /api/seed", r and r.status_code == 200, f"Status: {r.status_code if r else 'N/A'}"):
        return False
    
    # 2. Admin login
    r = post("/auth/login", ADMIN_CREDS)
    if not test_result("Admin login", r and r.status_code == 200, f"Status: {r.status_code if r else 'N/A'}"):
        return False
    admin_token = r.json().get("token")
    
    # 3. Trainer login
    r = post("/auth/login", TRAINER_CREDS)
    if not test_result("Trainer login", r and r.status_code == 200, f"Status: {r.status_code if r else 'N/A'}"):
        return False
    data = r.json()
    trainer_token = data.get("token")
    trainer_user = data.get("user", {})
    
    # 4. Student login
    r = post("/auth/login", STUDENT_CREDS)
    if not test_result("Student login", r and r.status_code == 200, f"Status: {r.status_code if r else 'N/A'}"):
        return False
    data = r.json()
    student_token = data.get("token")
    student_user = data.get("user", {})
    
    log(f"Admin token: {admin_token[:20]}...")
    log(f"Trainer token: {trainer_token[:20]}... (user: {trainer_user})")
    log(f"Student token: {student_token[:20]}... (user: {student_user})")
    return True

# ============ TEST 1: TRAINER AUTH ============
def test_trainer_auth():
    log("\n=== TEST 1: TRAINER AUTH ===")
    results = []
    
    # 1.1 Trainer login returns token + role=trainer
    r = post("/auth/login", TRAINER_CREDS)
    passed = r and r.status_code == 200
    if passed:
        data = r.json()
        passed = data.get("token") and data.get("user", {}).get("role") == "trainer"
    results.append(test_result("1.1 Trainer login returns token + role=trainer", passed, f"Response: {r.json() if r and r.status_code == 200 else r.status_code if r else 'N/A'}"))
    
    # 1.2 Wrong password -> 401
    r = post("/auth/login", {"role": "trainer", "loginId": "TR-01", "password": "WrongPassword"})
    passed = r and r.status_code == 401
    results.append(test_result("1.2 Wrong password -> 401", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 1.3 GET /api/auth/me with trainer token -> role trainer
    r = get("/auth/me", token=trainer_token)
    passed = r and r.status_code == 200
    if passed:
        data = r.json()
        passed = data.get("user", {}).get("role") == "trainer"
    results.append(test_result("1.3 GET /auth/me with trainer token -> role trainer", passed, f"Response: {r.json() if r and r.status_code == 200 else r.status_code if r else 'N/A'}"))
    
    # 1.4 Change password for trainer then revert
    new_pass = "NewTrainer@2026"
    r = post("/auth/change-password", {"currentPassword": "Trainer@2026", "newPassword": new_pass}, token=trainer_token)
    passed = r and r.status_code == 200
    results.append(test_result("1.4a Change password for trainer", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # Verify new password works
    r = post("/auth/login", {"role": "trainer", "loginId": "TR-01", "password": new_pass})
    passed = r and r.status_code == 200
    results.append(test_result("1.4b Login with new password", passed, f"Status: {r.status_code if r else 'N/A'}"))
    if passed:
        new_token = r.json().get("token")
        # Revert password
        r = post("/auth/change-password", {"currentPassword": new_pass, "newPassword": "Trainer@2026"}, token=new_token)
        passed = r and r.status_code == 200
        results.append(test_result("1.4c Revert password", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ TEST 2: TRAINER DASHBOARD ============
def test_trainer_dashboard():
    log("\n=== TEST 2: TRAINER DASHBOARD ===")
    results = []
    
    # 2.1 GET /api/dashboard/trainer with trainer token
    r = get("/dashboard/trainer", token=trainer_token)
    passed = r and r.status_code == 200
    if passed:
        data = r.json()
        has_fields = all(k in data for k in ["todaySchedules", "totalStudents", "students", "presentToday", "lateToday", "insideNow"])
        passed = has_fields and isinstance(data["todaySchedules"], list) and isinstance(data["totalStudents"], int) and isinstance(data["students"], list)
    results.append(test_result("2.1 GET /dashboard/trainer returns correct structure", passed, f"Response keys: {list(r.json().keys()) if r and r.status_code == 200 else r.status_code if r else 'N/A'}"))
    
    # 2.2 Student token on trainer dashboard -> 403
    r = get("/dashboard/trainer", token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("2.2 Student token on /dashboard/trainer -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 2.3 Admin token on trainer dashboard -> 403
    r = get("/dashboard/trainer", token=admin_token)
    passed = r and r.status_code == 403
    results.append(test_result("2.3 Admin token on /dashboard/trainer -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ TEST 3: TRAINER SCHEDULES SCOPE ============
def test_trainer_schedules_scope():
    log("\n=== TEST 3: TRAINER SCHEDULES SCOPE ===")
    results = []
    
    # 3.1 GET /api/schedules with trainer token returns only own schedules
    today = datetime.now().strftime("%Y-%m-%d")
    r = get("/schedules", token=trainer_token, params={"date": today})
    passed = r and r.status_code == 200
    if passed:
        schedules = r.json()
        # TR-01 is Ramesh Kumar, trainer of PY-FS-01
        # All schedules should have trainerId matching trainer's id
        trainer_id = trainer_user.get("id")
        all_own = all(s.get("trainerId") == trainer_id for s in schedules)
        passed = all_own and len(schedules) > 0
    results.append(test_result("3.1 GET /schedules (trainer) returns only own schedules", passed, f"Found {len(schedules) if r and r.status_code == 200 else 0} schedules for trainer {trainer_user.get('name')}"))
    
    return all(results)

# ============ TEST 4: TRAINER QR SCOPE ============
def test_trainer_qr_scope():
    log("\n=== TEST 4: TRAINER QR SCOPE ===")
    results = []
    
    # 4.1 Get one of TR-01's own schedules
    today = datetime.now().strftime("%Y-%m-%d")
    r = get("/schedules", token=trainer_token, params={"date": today})
    if not r or r.status_code != 200 or not r.json():
        log("No schedules found for trainer today, skipping QR scope test")
        return True
    
    own_schedule = r.json()[0]
    own_schedule_id = own_schedule.get("id")
    
    # 4.2 POST /api/sessions with trainer token for own schedule -> success
    r = post("/sessions", {"scheduleId": own_schedule_id}, token=trainer_token)
    passed = r and r.status_code == 200
    if passed:
        data = r.json()
        passed = "token" in data and data.get("active") == True
    results.append(test_result("4.1 POST /sessions for own schedule -> success", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 4.3 Create a schedule for a different trainer (as admin)
    # Get another trainer
    r = get("/trainers", token=admin_token)
    if r and r.status_code == 200:
        trainers = r.json()
        other_trainer = next((t for t in trainers if t.get("id") != trainer_user.get("id")), None)
        
        if other_trainer:
            # Get a batch
            r = get("/batches", token=admin_token)
            if r and r.status_code == 200:
                batches = r.json()
                batch = batches[0] if batches else None
                
                if batch:
                    # Create schedule for other trainer
                    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                    schedule_data = {
                        "date": tomorrow,
                        "batchId": batch.get("id"),
                        "classType": "Test Class",
                        "trainerId": other_trainer.get("id"),
                        "startTime": "10:00",
                        "endTime": "12:00",
                        "room": "Lab 1",
                        "maxCapacity": 30
                    }
                    r = post("/schedules", schedule_data, token=admin_token)
                    if r and r.status_code == 200:
                        other_schedule_id = r.json().get("id")
                        
                        # 4.4 Try to generate QR for other trainer's schedule as TR-01 -> 403
                        r = post("/sessions", {"scheduleId": other_schedule_id}, token=trainer_token)
                        passed = r and r.status_code == 403
                        results.append(test_result("4.2 POST /sessions for other trainer's schedule -> 403", passed, f"Status: {r.status_code if r else 'N/A'}, Message: {r.json().get('error') if r and r.status_code == 403 else ''}"))
    
    return all(results)

# ============ TEST 5: TRAINER REPORT SCOPE ============
def test_trainer_report_scope():
    log("\n=== TEST 5: TRAINER REPORT SCOPE ===")
    results = []
    
    # 5.1 GET /api/attendance/report with trainer token
    today = datetime.now().strftime("%Y-%m-%d")
    r = get("/attendance/report", token=trainer_token, params={"date": today})
    passed = r and r.status_code == 200
    if passed:
        records = r.json()
        # All records should have trainerName matching trainer's name
        trainer_name = trainer_user.get("name")
        all_own = all(rec.get("trainerName") == trainer_name for rec in records)
        passed = all_own
    results.append(test_result("5.1 GET /attendance/report (trainer) returns only own records", passed, f"Found {len(records) if r and r.status_code == 200 else 0} records for trainer {trainer_user.get('name')}"))
    
    return all(results)

# ============ TEST 6: BRANCHES ============
def test_branches():
    log("\n=== TEST 6: BRANCHES ===")
    results = []
    
    # 6.1 GET /api/branches returns seeded branches
    r = get("/branches")
    passed = r and r.status_code == 200
    if passed:
        branches = r.json()
        has_velachery = any(b.get("name") == "Velachery" for b in branches)
        has_coimbatore = any(b.get("name") == "Coimbatore" for b in branches)
        passed = has_velachery and has_coimbatore
    results.append(test_result("6.1 GET /branches returns Velachery + Coimbatore", passed, f"Found {len(branches) if r and r.status_code == 200 else 0} branches"))
    
    # 6.2 POST /api/branches (admin) creates branch
    branch_data = {"name": "Test Branch", "city": "Test City", "lat": 13.0827, "lng": 80.2707, "radius": 150}
    r = post("/branches", branch_data, token=admin_token)
    passed = r and r.status_code == 200
    created_branch_id = None
    if passed:
        created_branch_id = r.json().get("id")
    results.append(test_result("6.2 POST /branches (admin) creates branch", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 6.3 PUT /api/branches/:id (admin) updates radius
    if created_branch_id:
        r = put(f"/branches/{created_branch_id}", {"radius": 250}, token=admin_token)
        passed = r and r.status_code == 200
        results.append(test_result("6.3 PUT /branches/:id (admin) updates radius", passed, f"Status: {r.status_code if r else 'N/A'}"))
        
        # 6.4 DELETE /api/branches/:id (admin)
        r = delete(f"/branches/{created_branch_id}", token=admin_token)
        passed = r and r.status_code == 200
        results.append(test_result("6.4 DELETE /branches/:id (admin)", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 6.5 Student POST /api/branches -> 403
    r = post("/branches", branch_data, token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("6.5 Student POST /branches -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 6.6 Trainer POST /api/branches -> 403
    r = post("/branches", branch_data, token=trainer_token)
    passed = r and r.status_code == 403
    results.append(test_result("6.6 Trainer POST /branches -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ TEST 7: PLACEMENTS ============
def test_placements():
    log("\n=== TEST 7: PLACEMENTS ===")
    results = []
    
    # 7.1 GET /api/placements as admin (has applicants count)
    r = get("/placements", token=admin_token)
    passed = r and r.status_code == 200
    if passed:
        placements = r.json()
        has_applicants = all("applicants" in p for p in placements)
        passed = has_applicants and len(placements) >= 3  # seeded 3 placements
    results.append(test_result("7.1 GET /placements (admin) has applicants count", passed, f"Found {len(placements) if r and r.status_code == 200 else 0} placements"))
    
    # 7.2 GET /api/placements as student (has applied flag, initially false)
    r = get("/placements", token=student_token)
    passed = r and r.status_code == 200
    placement_id = None
    if passed:
        placements = r.json()
        has_applied = all("applied" in p for p in placements)
        initially_false = all(p.get("applied") == False for p in placements)
        passed = has_applied and initially_false
        if placements:
            placement_id = placements[0].get("id")
    results.append(test_result("7.2 GET /placements (student) has applied flag (initially false)", passed, f"Found {len(placements) if r and r.status_code == 200 else 0} placements"))
    
    # 7.3 POST /api/placements (admin) creates drive
    placement_data = {"company": "Test Corp", "role": "Test Developer", "eligibility": "Any", "package": "5 LPA", "location": "Chennai", "interviewDate": "2026-09-01"}
    r = post("/placements", placement_data, token=admin_token)
    passed = r and r.status_code == 200
    created_placement_id = None
    if passed:
        created_placement_id = r.json().get("id")
    results.append(test_result("7.3 POST /placements (admin) creates drive", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 7.4 Student POST /api/placements/:id/apply -> ok
    if placement_id:
        r = post(f"/placements/{placement_id}/apply", {}, token=student_token)
        passed = r and r.status_code == 200
        results.append(test_result("7.4 Student POST /placements/:id/apply -> ok", passed, f"Status: {r.status_code if r else 'N/A'}"))
        
        # 7.5 Applying again -> 400
        r = post(f"/placements/{placement_id}/apply", {}, token=student_token)
        passed = r and r.status_code == 400
        results.append(test_result("7.5 Applying again -> 400", passed, f"Status: {r.status_code if r else 'N/A'}"))
        
        # 7.6 Admin GET /api/placements/:id/applicants shows the student
        r = get(f"/placements/{placement_id}/applicants", token=admin_token)
        passed = r and r.status_code == 200
        if passed:
            applicants = r.json()
            has_student = any(a.get("studentId") == student_user.get("id") for a in applicants)
            passed = has_student
        results.append(test_result("7.6 Admin GET /placements/:id/applicants shows student", passed, f"Found {len(applicants) if r and r.status_code == 200 else 0} applicants"))
    
    # 7.7 Student POST /api/placements (create) -> 403
    r = post("/placements", placement_data, token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("7.7 Student POST /placements (create) -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ TEST 8: CALENDAR ============
def test_calendar():
    log("\n=== TEST 8: CALENDAR ===")
    results = []
    
    # 8.1 As student GET /api/attendance/calendar?month=YYYY-MM
    current_month = datetime.now().strftime("%Y-%m")
    r = get("/attendance/calendar", token=student_token, params={"month": current_month})
    passed = r and r.status_code == 200
    if passed:
        data = r.json()
        has_month = "month" in data
        has_days = "days" in data and isinstance(data["days"], dict)
        # Check that days have status field
        if has_days and data["days"]:
            sample_day = next(iter(data["days"].values()))
            has_status = "status" in sample_day
            passed = has_month and has_days and has_status
        else:
            passed = has_month and has_days
    results.append(test_result("8.1 Student GET /attendance/calendar returns correct structure", passed, f"Response keys: {list(r.json().keys()) if r and r.status_code == 200 else r.status_code if r else 'N/A'}"))
    
    # 8.2 Admin GET /api/attendance/calendar?studentId=X&month=Y works
    r = get("/attendance/calendar", token=admin_token, params={"studentId": student_user.get("id"), "month": current_month})
    passed = r and r.status_code == 200
    results.append(test_result("8.2 Admin GET /attendance/calendar with studentId works", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # 8.3 Student trying another studentId is forced to self (should not error, returns own)
    # Get another student
    r = get("/students", token=admin_token)
    if r and r.status_code == 200:
        students = r.json()
        other_student = next((s for s in students if s.get("id") != student_user.get("id")), None)
        if other_student:
            r = get("/attendance/calendar", token=student_token, params={"studentId": other_student.get("id"), "month": current_month})
            passed = r and r.status_code == 200
            # Should return own data, not error
            results.append(test_result("8.3 Student trying another studentId returns own data (no error)", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ TEST 9: BRANCH-AWARE CHECK-IN REGRESSION ============
def test_branch_aware_checkin():
    log("\n=== TEST 9: BRANCH-AWARE CHECK-IN REGRESSION ===")
    results = []
    
    # 9.1 Generate QR for today's PY-FS-01 schedule as admin
    today = datetime.now().strftime("%Y-%m-%d")
    r = get("/schedules", token=admin_token, params={"date": today})
    if not r or r.status_code != 200 or not r.json():
        log("No schedules found for today, skipping branch-aware check-in test")
        return True
    
    schedules = r.json()
    py_schedule = next((s for s in schedules if s.get("batchName") == "PY-FS-01"), None)
    if not py_schedule:
        log("No PY-FS-01 schedule found for today, skipping")
        return True
    
    # Generate QR
    r = post("/sessions", {"scheduleId": py_schedule.get("id")}, token=admin_token)
    if not r or r.status_code != 200:
        log("Failed to generate QR session")
        return False
    
    qr_token = r.json().get("token")
    
    # 9.2 Student BST-PY-001 check-in with Velachery coordinates
    checkin_data = {
        "token": qr_token,
        "lat": 12.9756,
        "lng": 80.2207,
        "accuracy": 20
    }
    r = post("/attendance/check-in", checkin_data, token=student_token)
    passed = r and r.status_code == 200
    if passed:
        data = r.json()
        is_ok = data.get("ok") == True
        has_status = data.get("status") in ["Present", "Late"]
        location_verified = data.get("locationVerified") == True
        passed = is_ok and has_status and location_verified
    results.append(test_result("9.1 Student check-in with Velachery coords -> Present/Late, locationVerified=true", passed, f"Response: {r.json() if r and r.status_code == 200 else r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ TEST 10: REGRESSION ROLE SECURITY ============
def test_role_security_regression():
    log("\n=== TEST 10: REGRESSION ROLE SECURITY ===")
    results = []
    
    # Student token should get 403 on:
    # - /api/students (list)
    r = get("/students", token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.1 Student -> /students (list) -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/settings PUT
    r = put("/settings", {"centerName": "Test"}, token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.2 Student -> /settings PUT -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/attendance/live
    r = get("/attendance/live", token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.3 Student -> /attendance/live -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/branches POST
    r = post("/branches", {"name": "Test"}, token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.4 Student -> /branches POST -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/placements POST
    r = post("/placements", {"company": "Test"}, token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.5 Student -> /placements POST -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/dashboard/trainer
    r = get("/dashboard/trainer", token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.6 Student -> /dashboard/trainer -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/dashboard/admin
    r = get("/dashboard/admin", token=student_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.7 Student -> /dashboard/admin -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # Trainer token should get 403 on admin-only endpoints:
    # - /api/branches POST
    r = post("/branches", {"name": "Test"}, token=trainer_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.8 Trainer -> /branches POST -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/placements POST
    r = post("/placements", {"company": "Test"}, token=trainer_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.9 Trainer -> /placements POST -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/students (list)
    r = get("/students", token=trainer_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.10 Trainer -> /students (list) -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/settings PUT
    r = put("/settings", {"centerName": "Test"}, token=trainer_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.11 Trainer -> /settings PUT -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    # - /api/attendance/live
    r = get("/attendance/live", token=trainer_token)
    passed = r and r.status_code == 403
    results.append(test_result("10.12 Trainer -> /attendance/live -> 403", passed, f"Status: {r.status_code if r else 'N/A'}"))
    
    return all(results)

# ============ MAIN ============
def main():
    print("=" * 80)
    print("BESANT STUDENTHUB - ROUND 2 BACKEND TESTING")
    print("=" * 80)
    
    if not setup():
        log("❌ SETUP FAILED - Cannot proceed with tests")
        return
    
    test_results = []
    
    test_results.append(("TRAINER AUTH", test_trainer_auth()))
    test_results.append(("TRAINER DASHBOARD", test_trainer_dashboard()))
    test_results.append(("TRAINER SCHEDULES SCOPE", test_trainer_schedules_scope()))
    test_results.append(("TRAINER QR SCOPE", test_trainer_qr_scope()))
    test_results.append(("TRAINER REPORT SCOPE", test_trainer_report_scope()))
    test_results.append(("BRANCHES", test_branches()))
    test_results.append(("PLACEMENTS", test_placements()))
    test_results.append(("CALENDAR", test_calendar()))
    test_results.append(("BRANCH-AWARE CHECK-IN", test_branch_aware_checkin()))
    test_results.append(("ROLE SECURITY REGRESSION", test_role_security_regression()))
    
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for name, passed in test_results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    total = len(test_results)
    passed_count = sum(1 for _, p in test_results if p)
    print(f"\nTotal: {passed_count}/{total} test suites passed ({int(passed_count/total*100)}%)")
    
    if passed_count == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed_count} test suite(s) failed")

if __name__ == "__main__":
    main()
