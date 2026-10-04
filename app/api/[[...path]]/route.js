import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ---------------- Mongo ----------------
let dbPromise
async function connectToMongo() {
  if (!dbPromise) {
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL
    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'besant_studenthub'

    if (!mongoUrl) {
      throw new Error('MongoDB is connected in Vercel, but no MongoDB URI is available to the app. Add MONGODB_URI or MONGO_URL in project variables.')
    }

    const client = new MongoClient(mongoUrl)
    dbPromise = client.connect().then((connection) => connection.db(dbName))
  }
  return dbPromise
}

const JWT_SECRET = process.env.JWT_SECRET || 'besant_secret'

// ---------------- CORS ----------------
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

function json(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}
const clean = (doc) => { if (!doc) return doc; const { _id, passwordHash, ...rest } = doc; return rest }
const cleanArr = (arr) => arr.map(clean)

// ---------------- Auth helpers ----------------
function signToken(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }) }
function getAuth(request) {
  try {
    const h = request.headers.get('authorization') || ''
    const t = h.startsWith('Bearer ') ? h.slice(7) : null
    if (!t) return null
    return jwt.verify(t, JWT_SECRET)
  } catch { return null }
}

// ---------------- Geo ----------------
function haversine(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v === null || v === undefined || isNaN(v))) return null
  const R = 6371000
  const toRad = (d) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ---------------- Time helpers ----------------
function dt(dateStr, timeStr) {
  // dateStr YYYY-MM-DD, timeStr HH:MM -> Date
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}
function todayStr() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}
function overlaps(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd }

// ---------------- Audit ----------------
async function audit(db, adminId, action, entity, entityId, details = '') {
  await db.collection('auditLogs').insertOne({
    id: uuidv4(), adminId, action, entity, entityId, details, timestamp: new Date().toISOString(),
  })
}

// ---------------- Defaults / Seed ----------------
async function ensureDefaults(db) {
  const s = await db.collection('settings').findOne({ id: 'global' })
  if (!s) {
    await db.collection('settings').insertOne({
      id: 'global',
      centerName: 'Besant Technologies - Velachery',
      centerLat: 12.9756, centerLng: 80.2207, radiusMeters: 200,
      locationMode: 'lenient', // 'lenient' | 'strict'
      maxSessionMinutes: 120, graceMinutes: 15,
    })
  }
  const admin = await db.collection('admins').findOne({ email: 'besanttech@2026' })
  if (!admin) {
    await db.collection('admins').insertOne({
      id: uuidv4(), name: 'Besant Admin', email: 'besanttech@2026',
      passwordHash: bcrypt.hashSync('besanttech@2026', 8), role: 'admin',
      mustChangePassword: false, lastLogin: null, createdAt: new Date().toISOString(),
    })
  }
  const cCount = await db.collection('courses').countDocuments()
  if (cCount === 0) {
    const names = ['Python Full Stack', 'Java Full Stack', 'Data Analytics', 'Data Science', 'Business Development', 'Networking', 'Cybersecurity', 'Ethical Hacking', 'Web Development', 'Software Testing']
    await db.collection('courses').insertMany(names.map((n, i) => ({
      id: uuidv4(), name: n, code: n.split(' ').map(w => w[0]).join('').toUpperCase(), description: `${n} training program`, active: true, createdAt: new Date().toISOString(),
    })))
  }
  const ctCount = await db.collection('classTypes').countDocuments()
  if (ctCount === 0) {
    const cts = ['Python', 'SQL', 'Frontend', 'Backend', 'Java', 'Data Analytics', 'Data Science', 'Aptitude', 'Communication', 'Soft Skills', 'Networking', 'Cybersecurity', 'Ethical Hacking', 'Project Session', 'Interview Preparation', 'Placement Training']
    await db.collection('classTypes').insertMany(cts.map(n => ({ id: uuidv4(), name: n, createdAt: new Date().toISOString() })))
  }
}

async function seedDemo(db) {
  await ensureDefaults(db)
  const settings = await db.collection('settings').findOne({ id: 'global' })
  // Branches
  let branches = await db.collection('branches').find({}).toArray()
  if (branches.length === 0) {
    branches = [
      { id: uuidv4(), name: 'Velachery', city: 'Chennai', lat: 12.9756, lng: 80.2207, radius: 200, active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Coimbatore', city: 'Coimbatore', lat: 11.0168, lng: 76.9558, radius: 200, active: true, createdAt: new Date().toISOString() },
    ]
    await db.collection('branches').insertMany(branches)
  }
  const mainBranch = branches[0]
  // Trainers
  let trainers = await db.collection('trainers').find({}).toArray()
  if (trainers.length === 0) {
    const t = [
      { name: 'Ramesh Kumar', skills: 'Python, Django, SQL', courses: 'Python Full Stack' },
      { name: 'Priya Sharma', skills: 'Java, Spring Boot', courses: 'Java Full Stack' },
      { name: 'Arun Prakash', skills: 'React, Frontend', courses: 'Web Development' },
      { name: 'Deepa Nair', skills: 'Aptitude, Communication', courses: 'Soft Skills' },
      { name: 'Karthik Raja', skills: 'Data Science, ML', courses: 'Data Science' },
    ]
    trainers = t.map((x, i) => ({ id: uuidv4(), trainerId: `TR-${String(i + 1).padStart(2, '0')}`, loginId: `TR-${String(i + 1).padStart(2, '0')}`, passwordHash: bcrypt.hashSync('Trainer@2026', 8), name: x.name, email: `${x.name.split(' ')[0].toLowerCase()}@besant.com`, mobile: `98${Math.floor(10000000 + Math.random() * 89999999)}`, skills: x.skills, courses: x.courses, branchId: mainBranch.id, status: 'Active', lastLogin: null, createdAt: new Date().toISOString() }))
    await db.collection('trainers').insertMany(trainers)
  }
  // migrate trainers missing login creds
  for (const tr of trainers) {
    if (!tr.loginId || !tr.passwordHash) {
      await db.collection('trainers').updateOne({ id: tr.id }, { $set: { loginId: tr.trainerId, passwordHash: bcrypt.hashSync('Trainer@2026', 8), branchId: tr.branchId || mainBranch.id } })
    }
  }
  trainers = await db.collection('trainers').find({}).toArray()
  const courses = await db.collection('courses').find({}).toArray()
  const pyCourse = courses.find(c => c.name === 'Python Full Stack') || courses[0]
  // Batches
  let batches = await db.collection('batches').find({}).toArray()
  if (batches.length === 0) {
    const b = [
      { batchId: 'PY-FS-01', name: 'Python Full Stack Batch 01', course: pyCourse, trainer: trainers[0] },
      { batchId: 'JAVA-FS-01', name: 'Java Full Stack Batch 01', course: courses.find(c => c.name === 'Java Full Stack'), trainer: trainers[1] },
      { batchId: 'DA-01', name: 'Data Analytics Batch 01', course: courses.find(c => c.name === 'Data Analytics'), trainer: trainers[4] },
      { batchId: 'DS-01', name: 'Data Science Batch 01', course: courses.find(c => c.name === 'Data Science'), trainer: trainers[4] },
    ]
    batches = b.map(x => ({ id: uuidv4(), batchId: x.batchId, name: x.name, courseId: x.course?.id, courseName: x.course?.name, startDate: '2026-01-05', endDate: '2026-07-05', trainerId: x.trainer?.id, trainerName: x.trainer?.name, maxStudents: 30, currentStudents: 0, status: 'Active', createdAt: new Date().toISOString() }))
    await db.collection('batches').insertMany(batches)
  }
  const pyBatch = batches.find(b => b.batchId === 'PY-FS-01')
  // Students
  const stuCount = await db.collection('students').countDocuments()
  if (stuCount === 0) {
    const names = ['Sabarish E', 'Arun Kumar', 'Deepak R', 'Kavya S', 'Vignesh M', 'Priya L', 'Rahul N', 'Sneha P', 'Karthik V', 'Divya R', 'Manoj K', 'Anitha S', 'Suresh B', 'Meena T', 'Gokul R', 'Lakshmi N', 'Vishnu P', 'Nandini S', 'Ajith K', 'Ramya V']
    const students = names.map((n, i) => {
      const batch = i < 12 ? pyBatch : batches[(i % 3) + 1]
      const sid = i < 12 ? `BST-PY-${String(i + 1).padStart(3, '0')}` : `BST-${batch.batchId}-${String(i + 1).padStart(3, '0')}`
      return {
        id: uuidv4(), studentId: sid, loginId: sid,
        passwordHash: bcrypt.hashSync('Bst@2026', 8),
        name: n, email: `${n.split(' ')[0].toLowerCase()}${i}@student.besant.com`,
        mobile: `90${Math.floor(10000000 + Math.random() * 89999999)}`, altMobile: '',
        dob: '2000-05-15', address: 'Chennai, Tamil Nadu', photo: '',
        courseId: batch.courseId, courseName: batch.courseName, batchId: batch.id, batchName: batch.batchId,
        batchYear: '2026', enrollmentDate: '2026-01-05', courseStart: '2026-01-05', courseEnd: '2026-07-05',
        trainerId: batch.trainerId, trainerName: batch.trainerName, status: 'Active',
        branchId: mainBranch.id,
        emergencyContact: 'Parent', emergencyNumber: `95${Math.floor(10000000 + Math.random() * 89999999)}`,
        accountStatus: 'Active', requirePasswordChange: false, firstLoginCompleted: true, lastLogin: null,
        createdAt: new Date().toISOString(),
      }
    })
    await db.collection('students').insertMany(students)
    // update batch counts
    for (const b of batches) {
      const c = students.filter(s => s.batchId === b.id).length
      await db.collection('batches').updateOne({ id: b.id }, { $set: { currentStudents: c } })
    }
  }
  // Schedules for TODAY for PY-FS-01
  const today = todayStr()
  const existSched = await db.collection('schedules').countDocuments({ date: today, batchId: pyBatch.id })
  if (existSched === 0) {
    const now = new Date()
    // build 5 classes; first one starts ~now-10min so QR/demo works live
    const base = new Date(now.getTime() - 10 * 60000)
    const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    const plan = [
      { type: 'Python', dur: 120 }, { type: 'SQL', dur: 120 }, { type: 'Frontend', dur: 120 },
      { type: 'Aptitude', dur: 60 }, { type: 'Communication', dur: 60 },
    ]
    let cursor = new Date(base)
    const scheds = []
    for (const p of plan) {
      const st = new Date(cursor)
      const en = new Date(cursor.getTime() + p.dur * 60000)
      scheds.push({
        id: uuidv4(), date: today, courseId: pyBatch.courseId, courseName: pyBatch.courseName,
        batchId: pyBatch.id, batchName: pyBatch.batchId, classType: p.type,
        trainerId: pyBatch.trainerId, trainerName: pyBatch.trainerName,
        startTime: fmt(st), endTime: fmt(en), durationMin: p.dur, room: 'Lab 1', maxCapacity: 30,
        status: 'Scheduled', createdAt: new Date().toISOString(),
      })
      cursor = new Date(en.getTime() + 15 * 60000)
    }
    await db.collection('schedules').insertMany(scheds)
  }
  // Notifications
  const notifCount = await db.collection('notifications').countDocuments()
  if (notifCount === 0) {
    await db.collection('notifications').insertOne({ id: uuidv4(), target: 'all', targetId: null, title: 'Welcome to Besant StudentHub', message: 'Your student portal is ready. Scan the class QR to mark attendance.', read: [], createdAt: new Date().toISOString() })
  }
  // Placements
  const placeCount = await db.collection('placements').countDocuments()
  if (placeCount === 0) {
    await db.collection('placements').insertMany([
      { id: uuidv4(), company: 'TCS', role: 'Junior Python Developer', eligibility: 'Python Full Stack, 70%+', package: '4.5 LPA', location: 'Chennai', interviewDate: '2026-08-10', active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), company: 'Zoho', role: 'Software Engineer Trainee', eligibility: 'Any Full Stack', package: '6 LPA', location: 'Chennai', interviewDate: '2026-08-15', active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), company: 'Freshworks', role: 'Associate Developer', eligibility: 'Java/Python Full Stack', package: '5.5 LPA', location: 'Chennai', interviewDate: '2026-08-20', active: true, createdAt: new Date().toISOString() },
    ])
  }
  return { ok: true }
}

// auto-checkout open records past limits
async function autoCheckout(db) {
  const settings = await db.collection('settings').findOne({ id: 'global' })
  const maxMin = settings?.maxSessionMinutes || 120
  const open = await db.collection('attendance').find({ checkOutTime: null }).toArray()
  const now = new Date()
  for (const r of open) {
    const ci = new Date(r.checkInTime)
    const sched = await db.collection('schedules').findOne({ id: r.scheduleId })
    let limit = new Date(ci.getTime() + maxMin * 60000)
    if (sched) {
      const end = dt(sched.date, sched.endTime)
      if (end < limit) limit = end
    }
    if (now >= limit) {
      const dur = Math.round((limit - ci) / 60000)
      await db.collection('attendance').updateOne({ id: r.id }, { $set: { checkOutTime: limit.toISOString(), sessionDuration: dur, autoCheckout: true } })
    }
  }
}

// ---------------- Route Handler ----------------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()
    await ensureDefaults(db)
    const auth = getAuth(request)
    const isAdmin = auth?.role === 'admin'
    const isStudent = auth?.role === 'student'
    const isTrainer = auth?.role === 'trainer'
    let body = {}
    if (['POST', 'PUT', 'PATCH'].includes(method)) { try { body = await request.json() } catch { body = {} } }

    // ---------- AUTH ----------
    if (route === '/auth/login' && method === 'POST') {
      const { role, loginId, password } = body
      if (!loginId || !password) return json({ error: 'Login ID and password required' }, 400)
      if (role === 'admin') {
        const a = await db.collection('admins').findOne({ email: loginId.trim() })
        if (!a || !bcrypt.compareSync(password, a.passwordHash)) return json({ error: 'Invalid credentials' }, 401)
        await db.collection('admins').updateOne({ id: a.id }, { $set: { lastLogin: new Date().toISOString() } })
        const token = signToken({ id: a.id, role: 'admin', name: a.name })
        return json({ token, user: { id: a.id, name: a.name, role: 'admin', email: a.email, mustChangePassword: a.mustChangePassword } })
      } else if (role === 'trainer') {
        const tr = await db.collection('trainers').findOne({ $or: [{ loginId: loginId.trim() }, { email: loginId.trim() }] })
        if (!tr || !tr.passwordHash || !bcrypt.compareSync(password, tr.passwordHash)) return json({ error: 'Invalid credentials' }, 401)
        if (tr.status !== 'Active') return json({ error: 'Account is inactive. Contact Admin.' }, 403)
        await db.collection('trainers').updateOne({ id: tr.id }, { $set: { lastLogin: new Date().toISOString() } })
        const token = signToken({ id: tr.id, role: 'trainer', name: tr.name })
        return json({ token, user: { id: tr.id, name: tr.name, role: 'trainer', loginId: tr.loginId } })
      } else {
        const st = await db.collection('students').findOne({ loginId: loginId.trim() })
        if (!st || !bcrypt.compareSync(password, st.passwordHash)) return json({ error: 'Invalid credentials' }, 401)
        if (st.accountStatus !== 'Active') return json({ error: 'Account is deactivated. Contact Admin.' }, 403)
        await db.collection('students').updateOne({ id: st.id }, { $set: { lastLogin: new Date().toISOString() } })
        const token = signToken({ id: st.id, role: 'student', name: st.name })
        return json({ token, user: { id: st.id, name: st.name, role: 'student', loginId: st.loginId, requirePasswordChange: st.requirePasswordChange } })
      }
    }
    if (route === '/auth/me' && method === 'GET') {
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      if (isAdmin) { const a = await db.collection('admins').findOne({ id: auth.id }); return json({ user: { ...clean(a), role: 'admin' } }) }
      if (isTrainer) { const tr = await db.collection('trainers').findOne({ id: auth.id }); return json({ user: { ...clean(tr), role: 'trainer' } }) }
      const st = await db.collection('students').findOne({ id: auth.id }); return json({ user: { ...clean(st), role: 'student' } })
    }
    if (route === '/auth/change-password' && method === 'POST') {
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      const { currentPassword, newPassword } = body
      if (!newPassword || newPassword.length < 4) return json({ error: 'New password too short' }, 400)
      const col = isAdmin ? 'admins' : isTrainer ? 'trainers' : 'students'
      const u = await db.collection(col).findOne({ id: auth.id })
      if (!bcrypt.compareSync(currentPassword || '', u.passwordHash)) return json({ error: 'Current password incorrect' }, 400)
      await db.collection(col).updateOne({ id: auth.id }, { $set: { passwordHash: bcrypt.hashSync(newPassword, 8), requirePasswordChange: false, firstLoginCompleted: true, mustChangePassword: false } })
      return json({ ok: true })
    }

    // ---------- SEED ----------
    if (route === '/seed' && method === 'POST') { const r = await seedDemo(db); return json(r) }

    // ---------- SETTINGS ----------
    if (route === '/settings' && method === 'GET') { const s = await db.collection('settings').findOne({ id: 'global' }); return json(clean(s)) }
    if (route === '/settings' && method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const allowed = ['centerName', 'centerLat', 'centerLng', 'radiusMeters', 'locationMode', 'maxSessionMinutes', 'graceMinutes']
      const upd = {}; allowed.forEach(k => { if (body[k] !== undefined) upd[k] = body[k] })
      await db.collection('settings').updateOne({ id: 'global' }, { $set: upd })
      await audit(db, auth.id, 'Updated settings', 'settings', 'global')
      const s = await db.collection('settings').findOne({ id: 'global' }); return json(clean(s))
    }

    // ---------- COURSES ----------
    if (route === '/courses' && method === 'GET') { return json(cleanArr(await db.collection('courses').find({}).sort({ name: 1 }).toArray())) }
    if (route === '/courses' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const c = { id: uuidv4(), name: body.name, code: body.code || '', description: body.description || '', active: true, createdAt: new Date().toISOString() }
      await db.collection('courses').insertOne(c); await audit(db, auth.id, 'Created course', 'course', c.id, c.name); return json(clean(c))
    }
    if (route.startsWith('/courses/') && method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; await db.collection('courses').updateOne({ id }, { $set: { name: body.name, code: body.code, description: body.description, active: body.active } }); return json({ ok: true })
    }
    if (route.startsWith('/courses/') && method === 'DELETE') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      await db.collection('courses').deleteOne({ id: path[1] }); return json({ ok: true })
    }

    // ---------- CLASS TYPES ----------
    if (route === '/class-types' && method === 'GET') { return json(cleanArr(await db.collection('classTypes').find({}).sort({ name: 1 }).toArray())) }
    if (route === '/class-types' && method === 'POST') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const c = { id: uuidv4(), name: body.name, createdAt: new Date().toISOString() }; await db.collection('classTypes').insertOne(c); return json(clean(c)) }
    if (route.startsWith('/class-types/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('classTypes').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- TRAINERS ----------
    if (route === '/trainers' && method === 'GET') { return json(cleanArr(await db.collection('trainers').find({}).sort({ name: 1 }).toArray())) }
    if (route === '/trainers' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const count = await db.collection('trainers').countDocuments()
      const trainerId = body.trainerId || `TR-${String(count + 1).padStart(2, '0')}`
      const t = { id: uuidv4(), trainerId, loginId: body.loginId || trainerId, passwordHash: bcrypt.hashSync(body.password || 'Trainer@2026', 8), name: body.name, email: body.email || '', mobile: body.mobile || '', skills: body.skills || '', courses: body.courses || '', branchId: body.branchId || null, status: body.status || 'Active', lastLogin: null, createdAt: new Date().toISOString() }
      await db.collection('trainers').insertOne(t); await audit(db, auth.id, 'Created trainer', 'trainer', t.id, t.name); return json(clean(t))
    }
    if (route.endsWith('/reset-password') && route.startsWith('/trainers/') && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const np = body.newPassword || 'Trainer@2026'
      await db.collection('trainers').updateOne({ id }, { $set: { passwordHash: bcrypt.hashSync(np, 8) } })
      await audit(db, auth.id, 'Reset trainer password', 'trainer', id); return json({ ok: true, newPassword: np })
    }
    if (route.startsWith('/trainers/') && method === 'PUT') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const id = path[1]; const { _id, id: _i, ...upd } = body; await db.collection('trainers').updateOne({ id }, { $set: upd }); return json({ ok: true }) }
    if (route.startsWith('/trainers/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('trainers').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- BATCHES ----------
    if (route === '/batches' && method === 'GET') { return json(cleanArr(await db.collection('batches').find({}).sort({ createdAt: -1 }).toArray())) }
    if (route === '/batches' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const course = body.courseId ? await db.collection('courses').findOne({ id: body.courseId }) : null
      const trainer = body.trainerId ? await db.collection('trainers').findOne({ id: body.trainerId }) : null
      const b = { id: uuidv4(), batchId: body.batchId, name: body.name, courseId: body.courseId, courseName: course?.name, startDate: body.startDate, endDate: body.endDate, trainerId: body.trainerId, trainerName: trainer?.name, maxStudents: Number(body.maxStudents) || 30, currentStudents: 0, status: body.status || 'Active', createdAt: new Date().toISOString() }
      await db.collection('batches').insertOne(b); await audit(db, auth.id, 'Created batch', 'batch', b.id, b.batchId); return json(clean(b))
    }
    if (route.startsWith('/batches/') && method === 'PUT') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const id = path[1]; const { _id, id: _i, ...upd } = body; await db.collection('batches').updateOne({ id }, { $set: upd }); return json({ ok: true }) }
    if (route.startsWith('/batches/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('batches').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- STUDENTS ----------
    if (route === '/students' && method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const url = new URL(request.url)
      const q = url.searchParams.get('q'); const courseId = url.searchParams.get('courseId'); const batchId = url.searchParams.get('batchId'); const status = url.searchParams.get('status')
      const filter = {}
      if (courseId) filter.courseId = courseId
      if (batchId) filter.batchId = batchId
      if (status) filter.status = status
      let list = await db.collection('students').find(filter).sort({ createdAt: -1 }).toArray()
      if (q) { const s = q.toLowerCase(); list = list.filter(x => [x.name, x.studentId, x.loginId, x.email, x.mobile].some(v => (v || '').toLowerCase().includes(s))) }
      return json(cleanArr(list))
    }
    if (route === '/students' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const exist = await db.collection('students').findOne({ loginId: body.loginId })
      if (exist) return json({ error: 'Login ID already exists' }, 400)
      const course = body.courseId ? await db.collection('courses').findOne({ id: body.courseId }) : null
      const batch = body.batchId ? await db.collection('batches').findOne({ id: body.batchId }) : null
      const trainer = body.trainerId ? await db.collection('trainers').findOne({ id: body.trainerId }) : (batch ? { id: batch.trainerId, name: batch.trainerName } : null)
      const st = {
        id: uuidv4(), studentId: body.studentId, loginId: body.loginId || body.studentId,
        passwordHash: bcrypt.hashSync(body.password || 'Bst@2026', 8),
        name: body.name, email: body.email || '', mobile: body.mobile || '', altMobile: body.altMobile || '',
        dob: body.dob || '', address: body.address || '', photo: body.photo || '',
        courseId: body.courseId, courseName: course?.name, batchId: body.batchId, batchName: batch?.batchId,
        batchYear: body.batchYear || '', enrollmentDate: body.enrollmentDate || todayStr(), courseStart: body.courseStart || '', courseEnd: body.courseEnd || '',
        trainerId: trainer?.id, trainerName: trainer?.name, status: body.status || 'Active',
        branchId: body.branchId || null,
        emergencyContact: body.emergencyContact || '', emergencyNumber: body.emergencyNumber || '',
        accountStatus: 'Active', requirePasswordChange: !!body.requirePasswordChange, firstLoginCompleted: false, lastLogin: null,
        createdAt: new Date().toISOString(),
      }
      await db.collection('students').insertOne(st)
      if (batch) await db.collection('batches').updateOne({ id: batch.id }, { $inc: { currentStudents: 1 } })
      await audit(db, auth.id, 'Created student', 'student', st.id, `${st.name} (${st.loginId})`)
      return json(clean(st))
    }
    if (route.startsWith('/students/') && path.length === 2 && method === 'GET') {
      const id = path[1]
      if (!isAdmin && !(isStudent && auth.id === id)) return json({ error: 'Forbidden' }, 403)
      const st = await db.collection('students').findOne({ id }); if (!st) return json({ error: 'Not found' }, 404)
      return json(clean(st))
    }
    if (route.startsWith('/students/') && path.length === 2 && method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const { _id, id: _i, passwordHash, password, ...upd } = body
      if (upd.courseId) { const c = await db.collection('courses').findOne({ id: upd.courseId }); upd.courseName = c?.name }
      if (upd.batchId) { const b = await db.collection('batches').findOne({ id: upd.batchId }); upd.batchName = b?.batchId }
      await db.collection('students').updateOne({ id }, { $set: upd }); await audit(db, auth.id, 'Updated student', 'student', id); return json({ ok: true })
    }
    if (route.startsWith('/students/') && path.length === 2 && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('students').deleteOne({ id: path[1] }); await audit(db, auth.id, 'Deleted student', 'student', path[1]); return json({ ok: true }) }
    if (route.endsWith('/reset-password') && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const np = body.newPassword || 'Bst@2026'
      await db.collection('students').updateOne({ id }, { $set: { passwordHash: bcrypt.hashSync(np, 8), requirePasswordChange: !!body.requirePasswordChange } })
      await audit(db, auth.id, 'Reset student password', 'student', id); return json({ ok: true, newPassword: np })
    }
    if (route.endsWith('/toggle') && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const st = await db.collection('students').findOne({ id })
      const ns = st.accountStatus === 'Active' ? 'Inactive' : 'Active'
      await db.collection('students').updateOne({ id }, { $set: { accountStatus: ns } }); await audit(db, auth.id, `Set account ${ns}`, 'student', id); return json({ ok: true, accountStatus: ns })
    }

    // ---------- SCHEDULES ----------
    if (route === '/schedules' && method === 'GET') {
      const url = new URL(request.url)
      const date = url.searchParams.get('date'); const batchId = url.searchParams.get('batchId')
      const filter = {}; if (date) filter.date = date
      if (batchId) filter.batchId = batchId
      // student can only see own batch
      if (isStudent) { const st = await db.collection('students').findOne({ id: auth.id }); filter.batchId = st.batchId }
      if (isTrainer) { filter.trainerId = auth.id }
      const list = await db.collection('schedules').find(filter).sort({ date: 1, startTime: 1 }).toArray()
      return json(cleanArr(list))
    }
    if (route === '/schedules' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const batch = await db.collection('batches').findOne({ id: body.batchId })
      const trainer = body.trainerId ? await db.collection('trainers').findOne({ id: body.trainerId }) : (batch ? { id: batch.trainerId, name: batch.trainerName } : null)
      const st = dt(body.date, body.startTime), en = dt(body.date, body.endTime)
      const durationMin = Math.max(0, Math.round((en - st) / 60000))
      const sc = { id: uuidv4(), date: body.date, courseId: batch?.courseId, courseName: batch?.courseName, batchId: body.batchId, batchName: batch?.batchId, classType: body.classType, trainerId: trainer?.id, trainerName: trainer?.name, startTime: body.startTime, endTime: body.endTime, durationMin, room: body.room || '', maxCapacity: Number(body.maxCapacity) || 30, status: 'Scheduled', createdAt: new Date().toISOString() }
      await db.collection('schedules').insertOne(sc)
      await db.collection('notifications').insertOne({ id: uuidv4(), target: 'batch', targetId: body.batchId, title: 'New Class Scheduled', message: `${sc.classType} on ${sc.date} ${sc.startTime}-${sc.endTime} (${sc.batchName})`, read: [], createdAt: new Date().toISOString() })
      await audit(db, auth.id, 'Created schedule', 'schedule', sc.id, `${sc.classType} ${sc.date}`)
      return json(clean(sc))
    }
    if (route.startsWith('/schedules/') && method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const { _id, id: _i, ...upd } = body
      if (upd.startTime && upd.endTime && upd.date) upd.durationMin = Math.max(0, Math.round((dt(upd.date, upd.endTime) - dt(upd.date, upd.startTime)) / 60000))
      await db.collection('schedules').updateOne({ id }, { $set: upd })
      const sc = await db.collection('schedules').findOne({ id })
      await db.collection('notifications').insertOne({ id: uuidv4(), target: 'batch', targetId: sc.batchId, title: 'Schedule Updated', message: `${sc.classType} on ${sc.date} ${sc.startTime}-${sc.endTime}`, read: [], createdAt: new Date().toISOString() })
      await audit(db, auth.id, 'Updated schedule', 'schedule', id); return json({ ok: true })
    }
    if (route.startsWith('/schedules/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('schedules').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- SESSIONS (QR) ----------
    if (route === '/sessions' && method === 'POST') {
      if (!isAdmin && !isTrainer) return json({ error: 'Forbidden' }, 403)
      const sched = await db.collection('schedules').findOne({ id: body.scheduleId })
      if (!sched) return json({ error: 'Schedule not found' }, 404)
      if (isTrainer && sched.trainerId !== auth.id) return json({ error: 'You can only generate QR for your own classes' }, 403)
      const settings = await db.collection('settings').findOne({ id: 'global' })
      const now = new Date()
      const schedEnd = dt(sched.date, sched.endTime)
      const validFrom = new Date(now.getTime() - 60000)
      // demo friendly: valid until later of scheduleEnd+5min or now+ maxSession
      let validTo = new Date(schedEnd.getTime() + 5 * 60000)
      const minValidTo = new Date(now.getTime() + (settings?.maxSessionMinutes || 120) * 60000)
      if (validTo < minValidTo) validTo = minValidTo
      // deactivate old sessions for this schedule
      await db.collection('sessions').updateMany({ scheduleId: sched.id, active: true }, { $set: { active: false } })
      const token = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()
      const sess = { id: uuidv4(), scheduleId: sched.id, token, courseName: sched.courseName, batchId: sched.batchId, batchName: sched.batchName, classType: sched.classType, date: sched.date, startTime: sched.startTime, endTime: sched.endTime, trainerName: sched.trainerName, validFrom: validFrom.toISOString(), validTo: validTo.toISOString(), active: true, createdAt: new Date().toISOString() }
      await db.collection('sessions').insertOne(sess)
      await db.collection('schedules').updateOne({ id: sched.id }, { $set: { status: 'Live' } })
      await audit(db, auth.id, 'Generated attendance QR', 'session', sess.id, `${sched.classType} ${sched.batchName}`)
      return json(clean(sess))
    }
    if (route === '/sessions/active' && method === 'GET') {
      const now = new Date().toISOString()
      const list = await db.collection('sessions').find({ active: true, validTo: { $gte: now } }).sort({ createdAt: -1 }).toArray()
      return json(cleanArr(list))
    }

    // ---------- ATTENDANCE ----------
    if (route === '/attendance/check-in' && method === 'POST') {
      if (!isStudent) return json({ error: 'Only students can check in' }, 403)
      const { token, lat, lng, accuracy, device } = body
      const st = await db.collection('students').findOne({ id: auth.id })
      const sess = await db.collection('sessions').findOne({ token: (token || '').trim().toUpperCase() })
      if (!sess) return json({ error: 'INVALID', message: 'Invalid Attendance QR' }, 400)
      const now = new Date()
      if (!sess.active || now > new Date(sess.validTo)) return json({ error: 'EXPIRED', message: 'Attendance Session Expired' }, 400)
      if (now < new Date(sess.validFrom)) return json({ error: 'NOT_STARTED', message: 'Attendance session has not started yet' }, 400)
      if (sess.batchId !== st.batchId) return json({ error: 'WRONG_BATCH', message: 'You are not assigned to this class.' }, 403)
      // already checked in for this schedule
      const dup = await db.collection('attendance').findOne({ scheduleId: sess.scheduleId, studentId: st.id, status: { $ne: 'Rejected' } })
      if (dup) return json({ error: 'ALREADY', message: 'Attendance Already Recorded' }, 409)
      // overlapping open session
      await autoCheckout(db)
      const sched = await db.collection('schedules').findOne({ id: sess.scheduleId })
      const open = await db.collection('attendance').find({ studentId: st.id, checkOutTime: null, status: { $ne: 'Rejected' } }).toArray()
      for (const o of open) {
        const osc = await db.collection('schedules').findOne({ id: o.scheduleId })
        if (osc && overlaps(dt(sched.date, sched.startTime), dt(sched.date, sched.endTime), dt(osc.date, osc.startTime), dt(osc.date, osc.endTime))) {
          return json({ error: 'OVERLAP', message: 'You are already attending another class.' }, 409)
        }
      }
      // location (use student's branch center if configured, else global)
      const settings = await db.collection('settings').findOne({ id: 'global' })
      let centerLat = settings.centerLat, centerLng = settings.centerLng, radius = settings.radiusMeters
      if (st.branchId) { const br = await db.collection('branches').findOne({ id: st.branchId }); if (br && br.lat != null && br.lng != null) { centerLat = br.lat; centerLng = br.lng; radius = br.radius || radius } }
      let locationVerified = true, distance = null
      if (lat != null && lng != null) {
        distance = haversine(Number(lat), Number(lng), centerLat, centerLng)
        if (distance != null) locationVerified = distance <= radius
      } else { locationVerified = false }
      if (settings.locationMode === 'strict' && !locationVerified) {
        return json({ error: 'LOCATION', message: 'Location Verification Failed — you appear to be outside the permitted attendance location.' }, 403)
      }
      // status present/late
      const start = dt(sched.date, sched.startTime)
      const grace = new Date(start.getTime() + (settings.graceMinutes || 15) * 60000)
      const status = now > grace ? 'Late' : 'Present'
      const rec = {
        id: uuidv4(), sessionId: sess.id, scheduleId: sess.scheduleId, studentId: st.id, studentName: st.name,
        studentCode: st.studentId, courseName: sess.courseName, batchId: sess.batchId, batchName: sess.batchName,
        classType: sess.classType, trainerName: sess.trainerName, date: sess.date,
        checkInTime: now.toISOString(), checkInLat: lat != null ? Number(lat) : null, checkInLng: lng != null ? Number(lng) : null,
        gpsAccuracy: accuracy != null ? Number(accuracy) : null, distance,
        checkOutTime: null, sessionDuration: null, status, locationVerified, device: device || '', createdAt: new Date().toISOString(),
      }
      await db.collection('attendance').insertOne(rec)
      return json({ ok: true, record: clean(rec), classType: sess.classType, courseName: sess.courseName, checkInTime: rec.checkInTime, locationVerified, status })
    }
    if (route === '/attendance/check-out' && method === 'POST') {
      if (!isStudent) return json({ error: 'Forbidden' }, 403)
      const rec = await db.collection('attendance').findOne({ id: body.attendanceId, studentId: auth.id })
      if (!rec) return json({ error: 'Record not found' }, 404)
      if (rec.checkOutTime) return json({ error: 'Already checked out' }, 400)
      const now = new Date(); const dur = Math.round((now - new Date(rec.checkInTime)) / 60000)
      await db.collection('attendance').updateOne({ id: rec.id }, { $set: { checkOutTime: now.toISOString(), sessionDuration: dur, checkOutLat: body.lat != null ? Number(body.lat) : null, checkOutLng: body.lng != null ? Number(body.lng) : null } })
      return json({ ok: true })
    }
    if (route === '/attendance/me' && method === 'GET') {
      if (!isStudent) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const recs = await db.collection('attendance').find({ studentId: auth.id }).sort({ checkInTime: -1 }).toArray()
      return json(cleanArr(recs))
    }
    if (route === '/attendance/current' && method === 'GET') {
      if (!isStudent) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const cur = await db.collection('attendance').findOne({ studentId: auth.id, checkOutTime: null, status: { $ne: 'Rejected' } })
      return json({ current: clean(cur) })
    }
    if (route === '/attendance/live' && method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const url = new URL(request.url)
      const scheduleId = url.searchParams.get('scheduleId')
      const today = todayStr()
      // active sessions today
      const now = new Date().toISOString()
      let sessions = await db.collection('sessions').find({ active: true, validTo: { $gte: now } }).sort({ createdAt: -1 }).toArray()
      let scheduleFilter = scheduleId
      if (!scheduleFilter && sessions.length) scheduleFilter = sessions[0].scheduleId
      let sched = scheduleFilter ? await db.collection('schedules').findOne({ id: scheduleFilter }) : null
      let students = [], records = []
      if (sched) {
        students = await db.collection('students').find({ batchId: sched.batchId, accountStatus: 'Active' }).toArray()
        records = await db.collection('attendance').find({ scheduleId: sched.id }).toArray()
      }
      const recMap = {}; records.forEach(r => recMap[r.studentId] = r)
      const rows = students.map(s => {
        const r = recMap[s.id]
        return {
          studentId: s.id, name: s.name, code: s.studentId,
          checkIn: r ? r.checkInTime : null, checkOut: r ? r.checkOutTime : null,
          status: r ? r.status : 'Absent', locationVerified: r ? r.locationVerified : null,
          inside: r ? !r.checkOutTime : false,
        }
      })
      const present = rows.filter(r => r.status === 'Present').length
      const late = rows.filter(r => r.status === 'Late').length
      const absent = rows.filter(r => r.status === 'Absent').length
      const inside = rows.filter(r => r.inside).length
      return json({ session: sessions[0] ? clean(sessions[0]) : null, activeSessions: cleanArr(sessions), schedule: clean(sched), stats: { present, late, absent, inside, total: rows.length }, rows })
    }
    if (route === '/attendance/report' && method === 'GET') {
      if (!isAdmin && !isTrainer) return json({ error: 'Forbidden' }, 403)
      const url = new URL(request.url)
      const date = url.searchParams.get('date'); const batchId = url.searchParams.get('batchId'); const status = url.searchParams.get('status')
      await autoCheckout(db)
      const filter = {}; if (date) filter.date = date; if (batchId) filter.batchId = batchId; if (status) filter.status = status
      if (isTrainer) filter.trainerName = auth.name
      const recs = await db.collection('attendance').find(filter).sort({ checkInTime: -1 }).limit(1000).toArray()
      return json(cleanArr(recs))
    }
    if (route.startsWith('/attendance/student/') && method === 'GET') {
      const id = path[2]
      if (!isAdmin && !(isStudent && auth.id === id)) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const recs = await db.collection('attendance').find({ studentId: id }).sort({ checkInTime: -1 }).toArray()
      const present = recs.filter(r => r.status === 'Present').length
      const late = recs.filter(r => r.status === 'Late').length
      const absent = recs.filter(r => r.status === 'Absent').length
      const leave = recs.filter(r => r.status === 'Leave').length
      const total = recs.length
      const pct = total ? Math.round(((present + late) / total) * 1000) / 10 : 0
      return json({ stats: { present, late, absent, leave, total, pct }, records: cleanArr(recs) })
    }
    if (route.startsWith('/attendance/') && path.length === 2 && method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const old = await db.collection('attendance').findOne({ id })
      await db.collection('attendance').updateOne({ id }, { $set: { status: body.status, correctionReason: body.reason || '' } })
      await audit(db, auth.id, 'Attendance correction', 'attendance', id, `${old?.status} -> ${body.status}: ${body.reason || ''}`)
      return json({ ok: true })
    }

    // ---------- LEAVE ----------
    if (route === '/leave' && method === 'GET') {
      if (isAdmin) return json(cleanArr(await db.collection('leaveRequests').find({}).sort({ createdAt: -1 }).toArray()))
  if (isStudent) return json(cleanArr(await db.collection('leaveRequests').find({ studentId: auth.id }).sort({ createdAt: -1 }).toArray()))
  if (isTrainer) return json(cleanArr(await db.collection('leaveRequests').find({ trainerId: auth.id }).sort({ createdAt: -1 }).toArray()))
  return json({ error: 'Unauthorized' }, 401)
    }
    if (route === '/leave' && method === 'POST') {
  if (!isStudent && !isTrainer) return json({ error: 'Forbidden' }, 403)
  const collection = isStudent ? 'students' : 'trainers'
  const person = await db.collection(collection).findOne({ id: auth.id })
  const l = { id: uuidv4(), ...(isStudent ? { studentId: auth.id, studentName: person.name, studentCode: person.studentId } : { trainerId: auth.id, trainerName: person.name, trainerCode: person.trainerId }), fromDate: body.fromDate, toDate: body.toDate, reason: body.reason, description: body.description || '', status: 'Pending', createdAt: new Date().toISOString() }
      await db.collection('leaveRequests').insertOne(l); return json(clean(l))
    }
    if (route.startsWith('/leave/') && method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; await db.collection('leaveRequests').updateOne({ id }, { $set: { status: body.status } })
      const l = await db.collection('leaveRequests').findOne({ id })
      await db.collection('notifications').insertOne({ id: uuidv4(), target: 'student', targetId: l.studentId, title: `Leave ${body.status}`, message: `Your leave (${l.fromDate} to ${l.toDate}) was ${body.status}.`, read: [], createdAt: new Date().toISOString() })
      await audit(db, auth.id, `Leave ${body.status}`, 'leave', id); return json({ ok: true })
    }

    // ---------- HOLIDAYS ----------
    if (route === '/holidays' && method === 'GET') return json(cleanArr(await db.collection('holidays').find({}).sort({ date: 1 }).toArray()))
    if (route === '/holidays' && method === 'POST') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const h = { id: uuidv4(), name: body.name, date: body.date, createdAt: new Date().toISOString() }; await db.collection('holidays').insertOne(h); return json(clean(h)) }
    if (route.startsWith('/holidays/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('holidays').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- ROOMS ----------
    if (route === '/rooms' && method === 'GET') return json(cleanArr(await db.collection('rooms').find({}).toArray()))
    if (route === '/rooms' && method === 'POST') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const r = { id: uuidv4(), name: body.name, capacity: Number(body.capacity) || 0, createdAt: new Date().toISOString() }; await db.collection('rooms').insertOne(r); return json(clean(r)) }
    if (route.startsWith('/rooms/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('rooms').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- SLOTS ----------
    if (route === '/slots' && method === 'GET') {
      const list = await db.collection('slots').find({}).sort({ date: 1, startTime: 1 }).toArray()
      return json(cleanArr(list.map(s => ({ ...s, bookedCount: (s.booked || []).length, available: (s.capacity || 0) - (s.booked || []).length, isBooked: isStudent ? (s.booked || []).includes(auth.id) : false }))))
    }
    if (route === '/slots' && method === 'POST') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const s = { id: uuidv4(), title: body.title, date: body.date, startTime: body.startTime, endTime: body.endTime, capacity: Number(body.capacity) || 1, booked: [], createdAt: new Date().toISOString() }; await db.collection('slots').insertOne(s); return json(clean(s)) }
    if (route.endsWith('/book') && route.startsWith('/slots/') && method === 'POST') {
      if (!isStudent) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const s = await db.collection('slots').findOne({ id }); if (!s) return json({ error: 'Not found' }, 404)
      if ((s.booked || []).includes(auth.id)) return json({ error: 'Already booked' }, 400)
      if ((s.booked || []).length >= s.capacity) return json({ error: 'Slot full' }, 400)
      await db.collection('slots').updateOne({ id }, { $push: { booked: auth.id } }); return json({ ok: true })
    }
    if (route.startsWith('/slots/') && path.length === 2 && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('slots').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- NOTIFICATIONS ----------
    if (route === '/notifications' && method === 'GET') {
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      let list = await db.collection('notifications').find({}).sort({ createdAt: -1 }).limit(100).toArray()
      if (isStudent) {
        const st = await db.collection('students').findOne({ id: auth.id })
        list = list.filter(n => n.target === 'all' || (n.target === 'batch' && n.targetId === st.batchId) || (n.target === 'course' && n.targetId === st.courseId) || (n.target === 'student' && n.targetId === auth.id))
      }
      return json(cleanArr(list.map(n => ({ ...n, isRead: (n.read || []).includes(auth.id) }))))
    }
    if (route === '/notifications' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const n = { id: uuidv4(), target: body.target || 'all', targetId: body.targetId || null, title: body.title, message: body.message, read: [], createdAt: new Date().toISOString() }
      await db.collection('notifications').insertOne(n); return json(clean(n))
    }
    if (route === '/notifications/read' && method === 'POST') {
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      await db.collection('notifications').updateMany({}, { $addToSet: { read: auth.id } }); return json({ ok: true })
    }

    // ---------- AUDIT ----------
    if (route === '/audit' && method === 'GET') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); return json(cleanArr(await db.collection('auditLogs').find({}).sort({ timestamp: -1 }).limit(200).toArray())) }

    // ---------- DASHBOARDS ----------
    if (route === '/dashboard/admin' && method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const today = todayStr()
      const totalStudents = await db.collection('students').countDocuments()
      const activeStudents = await db.collection('students').countDocuments({ status: 'Active', accountStatus: 'Active' })
      const todaySchedules = await db.collection('schedules').find({ date: today }).toArray()
      const todayRecs = await db.collection('attendance').find({ date: today }).toArray()
      const presentToday = todayRecs.filter(r => r.status === 'Present').length
      const lateToday = todayRecs.filter(r => r.status === 'Late').length
      const insideNow = todayRecs.filter(r => !r.checkOutTime && r.status !== 'Rejected').length
      // absent estimate: scheduled students - attended (rough)
      const allRecs = await db.collection('attendance').find({}).toArray()
      // course-wise attendance
      const courses = await db.collection('courses').find({}).toArray()
      const courseWise = courses.map(c => {
        const rs = allRecs.filter(r => r.courseName === c.name)
        const p = rs.filter(r => r.status === 'Present' || r.status === 'Late').length
        return { name: c.name, present: p, total: rs.length, pct: rs.length ? Math.round(p / rs.length * 100) : 0 }
      }).filter(c => c.total > 0)
      // last 7 days attendance
      const daily = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const rs = allRecs.filter(r => r.date === ds)
        daily.push({ day: ds.slice(5), present: rs.filter(r => r.status === 'Present').length, late: rs.filter(r => r.status === 'Late').length, absent: rs.filter(r => r.status === 'Absent').length })
      }
      const upcoming = todaySchedules.filter(s => dt(s.date, s.startTime) > new Date()).length
      return json({ cards: { totalStudents, activeStudents, todayClasses: todaySchedules.length, presentToday, lateToday, insideNow, upcoming, absentToday: Math.max(0, todayRecs.filter(r => r.status === 'Absent').length) }, courseWise, daily })
    }
    if (route === '/dashboard/student' && method === 'GET') {
      if (!isStudent) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const st = await db.collection('students').findOne({ id: auth.id })
      const today = todayStr()
      const todaySchedules = await db.collection('schedules').find({ batchId: st.batchId, date: today }).sort({ startTime: 1 }).toArray()
      const todayRecs = await db.collection('attendance').find({ studentId: auth.id, date: today }).toArray()
      const allRecs = await db.collection('attendance').find({ studentId: auth.id }).toArray()
      const present = allRecs.filter(r => r.status === 'Present' || r.status === 'Late').length
      const pct = allRecs.length ? Math.round(present / allRecs.length * 100) : 0
      const cur = await db.collection('attendance').findOne({ studentId: auth.id, checkOutTime: null, status: { $ne: 'Rejected' } })
      // monthly chart
      const monthly = []
      for (let i = 3; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        const mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const rs = allRecs.filter(r => (r.date || '').startsWith(mm))
        monthly.push({ month: d.toLocaleString('en', { month: 'short' }), present: rs.filter(r => r.status === 'Present').length, late: rs.filter(r => r.status === 'Late').length, absent: rs.filter(r => r.status === 'Absent').length })
      }
      return json({
        student: clean(st),
        todaySchedules: cleanArr(todaySchedules),
        todayAttended: todayRecs.filter(r => r.status !== 'Rejected').length,
        todayTotal: todaySchedules.length,
        overallPct: pct, totalClasses: allRecs.length, present, current: clean(cur), monthly,
      })
    }

    // ---------- BRANCHES ----------
    if (route === '/branches' && method === 'GET') return json(cleanArr(await db.collection('branches').find({}).sort({ createdAt: 1 }).toArray()))
    if (route === '/branches' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const b = { id: uuidv4(), name: body.name, city: body.city || '', lat: body.lat != null ? Number(body.lat) : null, lng: body.lng != null ? Number(body.lng) : null, radius: Number(body.radius) || 200, active: true, createdAt: new Date().toISOString() }
      await db.collection('branches').insertOne(b); await audit(db, auth.id, 'Created branch', 'branch', b.id, b.name); return json(clean(b))
    }
    if (route.startsWith('/branches/') && method === 'PUT') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); const id = path[1]; const { _id, id: _i, ...upd } = body; if (upd.lat != null) upd.lat = Number(upd.lat); if (upd.lng != null) upd.lng = Number(upd.lng); if (upd.radius != null) upd.radius = Number(upd.radius); await db.collection('branches').updateOne({ id }, { $set: upd }); return json({ ok: true }) }
    if (route.startsWith('/branches/') && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('branches').deleteOne({ id: path[1] }); return json({ ok: true }) }

    // ---------- PLACEMENTS ----------
    if (route === '/placements' && method === 'GET') {
      if (!auth) return json({ error: 'Unauthorized' }, 401)
      const list = await db.collection('placements').find({}).sort({ createdAt: -1 }).toArray()
      if (isStudent) {
        const apps = await db.collection('placementApps').find({ studentId: auth.id }).toArray()
        const appMap = {}; apps.forEach(a => appMap[a.placementId] = a.status)
        return json(cleanArr(list.filter(p => p.active !== false).map(p => ({ ...p, applied: appMap[p.id] ? true : false, appStatus: appMap[p.id] || null }))))
      }
      // admin: include applicant counts
      const apps = await db.collection('placementApps').find({}).toArray()
      return json(cleanArr(list.map(p => ({ ...p, applicants: apps.filter(a => a.placementId === p.id).length }))))
    }
    if (route === '/placements' && method === 'POST') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const p = { id: uuidv4(), company: body.company, role: body.role, eligibility: body.eligibility || '', package: body.package || '', location: body.location || '', interviewDate: body.interviewDate || '', active: true, createdAt: new Date().toISOString() }
      await db.collection('placements').insertOne(p); await audit(db, auth.id, 'Created placement', 'placement', p.id, `${p.company} - ${p.role}`); return json(clean(p))
    }
    if (route.startsWith('/placements/') && route.endsWith('/apply') && method === 'POST') {
      if (!isStudent) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; const exist = await db.collection('placementApps').findOne({ placementId: id, studentId: auth.id })
      if (exist) return json({ error: 'Already applied' }, 400)
      const st = await db.collection('students').findOne({ id: auth.id })
      await db.collection('placementApps').insertOne({ id: uuidv4(), placementId: id, studentId: auth.id, studentName: st.name, studentCode: st.studentId, courseName: st.courseName, batchName: st.batchName, status: 'Applied', createdAt: new Date().toISOString() })
      return json({ ok: true })
    }
    if (route.startsWith('/placements/') && route.endsWith('/applicants') && method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = path[1]; return json(cleanArr(await db.collection('placementApps').find({ placementId: id }).sort({ createdAt: -1 }).toArray()))
    }
    if (route.startsWith('/placements/') && path.length === 2 && method === 'DELETE') { if (!isAdmin) return json({ error: 'Forbidden' }, 403); await db.collection('placements').deleteOne({ id: path[1] }); await db.collection('placementApps').deleteMany({ placementId: path[1] }); return json({ ok: true }) }

    // ---------- ATTENDANCE CALENDAR ----------
    if (route === '/attendance/calendar' && method === 'GET') {
      const url = new URL(request.url)
      let studentId = url.searchParams.get('studentId')
      const month = url.searchParams.get('month') || todayStr().slice(0, 7) // YYYY-MM
      if (isStudent) studentId = auth.id
      if (!isAdmin && !isTrainer && !(isStudent && studentId === auth.id)) return json({ error: 'Forbidden' }, 403)
      if (!studentId) return json({ error: 'studentId required' }, 400)
      await autoCheckout(db)
      const st = await db.collection('students').findOne({ id: studentId })
      const recs = await db.collection('attendance').find({ studentId, date: { $regex: `^${month}` } }).toArray()
      const scheds = st ? await db.collection('schedules').find({ batchId: st.batchId, date: { $regex: `^${month}` } }).toArray() : []
      const holidays = await db.collection('holidays').find({ date: { $regex: `^${month}` } }).toArray()
      // group by day
      const days = {}
      for (const d of [...new Set([...recs.map(r => r.date), ...scheds.map(s => s.date)])]) {
        const dayRecs = recs.filter(r => r.date === d)
        const daySched = scheds.filter(s => s.date === d)
        let status = 'Not Scheduled'
        if (daySched.length) {
          const present = dayRecs.filter(r => r.status === 'Present' || r.status === 'Late').length
          const leave = dayRecs.filter(r => r.status === 'Leave').length
          if (present > 0) status = 'Present'
          else if (leave > 0) status = 'Leave'
          else status = 'Absent'
        }
        days[d] = { status, scheduled: daySched.length, attended: dayRecs.filter(r => r.status !== 'Rejected').length, records: cleanArr(dayRecs) }
      }
      holidays.forEach(h => { days[h.date] = { status: 'Holiday', name: h.name, scheduled: 0, attended: 0, records: [] } })
      return json({ month, days, holidays: cleanArr(holidays) })
    }

    // ---------- TRAINER DASHBOARD ----------
    if (route === '/dashboard/trainer' && method === 'GET') {
      if (!isTrainer) return json({ error: 'Forbidden' }, 403)
      await autoCheckout(db)
      const today = todayStr()
      const todaySchedules = await db.collection('schedules').find({ trainerId: auth.id, date: today }).sort({ startTime: 1 }).toArray()
      const allSchedules = await db.collection('schedules').find({ trainerId: auth.id }).toArray()
      const batchIds = [...new Set(allSchedules.map(s => s.batchId))]
      const students = await db.collection('students').find({ batchId: { $in: batchIds } }).toArray()
      const myRecs = await db.collection('attendance').find({ trainerName: auth.name }).toArray()
      const todayRecs = myRecs.filter(r => r.date === today)
      return json({
        todaySchedules: cleanArr(todaySchedules),
        totalClasses: allSchedules.length,
        totalStudents: students.length,
        presentToday: todayRecs.filter(r => r.status === 'Present').length,
        lateToday: todayRecs.filter(r => r.status === 'Late').length,
        insideNow: todayRecs.filter(r => !r.checkOutTime && r.status !== 'Rejected').length,
        students: cleanArr(students),
      })
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return json({ error: 'Internal server error', detail: String(error?.message || error) }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
