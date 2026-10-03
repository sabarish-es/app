'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, Boxes, UserCog, CalendarDays, Radio,
  ClipboardList, PlaneTakeoff, Ticket, DoorOpen, Bell, FileBarChart, PartyPopper, ScrollText,
  Settings, LogOut, QrCode, ScanLine, MapPin, CheckCircle2, XCircle, Clock, Loader2, Plus,
  Search, Eye, KeyRound, Power, Menu, Home, CalendarClock, UserRound, ChevronRight, Trash2,
  ShieldCheck, TrendingUp, Sparkles, Camera, Copy, RefreshCw, Timer, X, Building2, Briefcase, Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

/* ============================ API ============================ */
let AUTH_TOKEN = null
async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' }
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw Object.assign(new Error(data?.message || data?.error || 'Request failed'), { data, status: res.status })
  return data
}

/* ============================ Helpers ============================ */
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening' }
const initials = (n) => (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

function useCountUp(target, dur = 1000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf, start
    const t = Number(target) || 0
    const step = (ts) => { if (!start) start = ts; const p = Math.min((ts - start) / dur, 1); setVal(Math.round(t * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return val
}

const STATUS_STYLES = {
  Present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Late: 'bg-amber-100 text-amber-700 border-amber-200',
  Absent: 'bg-rose-100 text-rose-700 border-rose-200',
  Leave: 'bg-violet-100 text-violet-700 border-violet-200',
  Rejected: 'bg-slate-100 text-slate-500 border-slate-200',
  Live: 'bg-blue-100 text-blue-700 border-blue-200',
  Scheduled: 'bg-slate-100 text-slate-600 border-slate-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected2: 'bg-rose-100 text-rose-700 border-rose-200',
}
function StatusBadge({ status }) {
  const icon = { Present: CheckCircle2, Late: Clock, Absent: XCircle, Leave: PlaneTakeoff }[status]
  const Icon = icon
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.Scheduled}`}>{Icon && <Icon className="h-3 w-3" />}{status}</span>
}

/* ============================ Animated Background ============================ */
function AnimatedBg({ dark }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div className={`absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl ${dark ? 'bg-indigo-600/30' : 'bg-indigo-400/20'}`} animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className={`absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl ${dark ? 'bg-violet-600/25' : 'bg-violet-400/20'}`} animate={{ x: [0, -50, 0], y: [0, 60, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className={`absolute -bottom-40 left-1/3 h-96 w-96 rounded-full blur-3xl ${dark ? 'bg-sky-600/20' : 'bg-sky-300/20'}`} animate={{ x: [0, 40, 0], y: [0, -40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  )
}

/* ============================ Logo ============================ */
function Logo({ light }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
        <GraduationCap className="h-6 w-6 text-white" />
      </div>
      <div className="leading-tight">
        <div className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>Besant <span className="text-indigo-500">StudentHub</span></div>
        <div className={`text-[10px] font-medium uppercase tracking-widest ${light ? 'text-indigo-200' : 'text-slate-400'}`}>Learn. Track. Grow.</div>
      </div>
    </div>
  )
}

/* ============================ LOGIN ============================ */
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState('admin')
  const [loginId, setLoginId] = useState('besanttech@2026')
  const [password, setPassword] = useState('besanttech@2026')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const switchRole = (r) => {
    setRole(r)
    if (r === 'admin') { setLoginId('besanttech@2026'); setPassword('besanttech@2026') }
    else if (r === 'trainer') { setLoginId('TR-01'); setPassword('Trainer@2026') }
    else { setLoginId('BST-PY-001'); setPassword('Bst@2026') }
  }
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api('/auth/login', 'POST', { role, loginId, password })
      onLogin(res)
    } catch (err) { toast.error(err.message || 'Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white">
      <AnimatedBg dark />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Left branding */}
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <Logo light />
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Premium Attendance Portal
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">Empowering Skills.<br /><span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Building Careers.</span></h1>
            <p className="mt-4 max-w-md text-slate-300">QR-based attendance, live monitoring, GPS verification, class scheduling & detailed reports — one powerful portal for Besant Technologies.</p>
            <div className="mt-8 flex gap-3">
              {['QR Check-in', 'Live Monitor', 'GPS Verified', 'Auto Checkout'].map(f => (
                <span key={f} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">{f}</span>
              ))}
            </div>
          </motion.div>
          <div className="text-xs text-slate-500">© 2026 Besant Technologies</div>
        </div>

        {/* Right login card */}
        <div className="flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 text-slate-900 shadow-2xl backdrop-blur-xl">
            <div className="lg:hidden mb-6"><Logo /></div>
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="mb-6 text-sm text-slate-500">Sign in to your Besant StudentHub account</p>

            <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
              {['admin', 'trainer', 'student'].map(r => (
                <button key={r} onClick={() => switchRole(r)}
                  className={`relative rounded-lg py-2.5 text-sm font-semibold capitalize transition ${role === r ? 'text-white' : 'text-slate-500'}`}>
                  {role === r && <motion.div layoutId="roletab" className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 shadow" />}
                  <span className="relative flex items-center justify-center gap-1.5">{r === 'admin' ? <ShieldCheck className="h-4 w-4" /> : r === 'trainer' ? <UserCog className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}{r}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600">{role === 'admin' ? 'Admin ID / Email' : 'Login ID'}</Label>
                <Input value={loginId} onChange={e => setLoginId(e.target.value)} className="mt-1.5 h-11" placeholder={role === 'admin' ? 'besanttech@2026' : 'BST-PY-001'} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Password</Label>
                <div className="relative mt-1.5">
                  <Input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="h-11 pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className="h-4 w-4" /></button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-base font-semibold hover:opacity-95">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              <div className="font-semibold text-slate-600">Demo credentials</div>
              <div className="mt-1">Admin: <b>besanttech@2026</b> / <b>besanttech@2026</b></div>
              <div>Trainer: <b>TR-01</b> / <b>Trainer@2026</b></div>
              <div>Student: <b>BST-PY-001</b> / <b>Bst@2026</b></div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Student registration is managed by Besant Technologies Administration.</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ============================ Change Password ============================ */
function ChangePassword({ onDone }) {
  const [cur, setCur] = useState(''); const [np, setNp] = useState(''); const [cp, setCp] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (np !== cp) return toast.error('Passwords do not match')
    setLoading(true)
    try { await api('/auth/change-password', 'POST', { currentPassword: cur, newPassword: np }); toast.success('Password updated'); onDone() }
    catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }
  return (
    <div className="relative grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
      <AnimatedBg dark />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 text-slate-900 shadow-2xl">
        <div className="mb-2 flex items-center gap-2 text-indigo-600"><KeyRound className="h-5 w-5" /><span className="font-semibold">First Login</span></div>
        <h2 className="text-2xl font-bold">Create Your New Password</h2>
        <p className="mb-6 text-sm text-slate-500">Please set a new password before continuing.</p>
        <form onSubmit={submit} className="space-y-4">
          <div><Label className="text-xs font-semibold text-slate-600">Current Password</Label><Input type="password" value={cur} onChange={e => setCur(e.target.value)} className="mt-1.5 h-11" /></div>
          <div><Label className="text-xs font-semibold text-slate-600">New Password</Label><Input type="password" value={np} onChange={e => setNp(e.target.value)} className="mt-1.5 h-11" /></div>
          <div><Label className="text-xs font-semibold text-slate-600">Confirm New Password</Label><Input type="password" value={cp} onChange={e => setCp(e.target.value)} className="mt-1.5 h-11" /></div>
          <Button disabled={loading} className="h-11 w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}</Button>
        </form>
      </motion.div>
    </div>
  )
}

/* ============================ Shared UI bits ============================ */
function StatCard({ icon: Icon, label, value, suffix = '', color = 'indigo', delay = 0 }) {
  const v = useCountUp(value)
  const colors = {
    indigo: 'from-indigo-500 to-violet-600', emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600', rose: 'from-rose-500 to-pink-600',
    sky: 'from-sky-500 to-blue-600', slate: 'from-slate-500 to-slate-700',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-10 ${colors[color]}`} />
      <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <div className="text-3xl font-bold text-slate-900">{v}{suffix}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </motion.div>
  )
}

function Empty({ icon: Icon = Sparkles, title, sub }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon className="h-7 w-7" /></div>
      <div className="font-semibold text-slate-700">{title}</div>
      {sub && <div className="mt-1 text-sm text-slate-400">{sub}</div>}
    </div>
  )
}

function QRImage({ token }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    import('qrcode').then(QR => { QR.toDataURL(token, { width: 320, margin: 2, color: { dark: '#1e1b4b', light: '#ffffff' } }).then(url => { if (alive) setSrc(url) }) })
    return () => { alive = false }
  }, [token])
  return src ? <img src={src} alt="QR" className="h-64 w-64 rounded-2xl border-8 border-white shadow-lg" /> : <Skeleton className="h-64 w-64 rounded-2xl" />
}

/* ============================ ADMIN ============================ */
const ADMIN_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'batches', label: 'Batches', icon: Boxes },
  { key: 'trainers', label: 'Trainers', icon: UserCog },
  { key: 'branches', label: 'Branches', icon: Building2 },
  { key: 'placements', label: 'Placements', icon: Briefcase },
  { key: 'schedules', label: 'Schedules', icon: CalendarDays },
  { key: 'live', label: 'Live Attendance', icon: Radio },
  { key: 'attendance', label: 'Attendance / Reports', icon: FileBarChart },
  { key: 'leave', label: 'Leave Requests', icon: PlaneTakeoff },
  { key: 'slots', label: 'Slot Bookings', icon: Ticket },
  { key: 'rooms', label: 'Rooms', icon: DoorOpen },
  { key: 'holidays', label: 'Holidays', icon: PartyPopper },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'audit', label: 'Audit Logs', icon: ScrollText },
  { key: 'settings', label: 'Settings', icon: Settings },
]

function AdminApp({ user, onLogout }) {
  const [view, setView] = useState('dashboard')
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AnimatePresence>
        {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      </AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b border-slate-100 px-5"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ADMIN_NAV.map(n => {
            const active = view === n.key
            return (
              <button key={n.key} onClick={() => { setView(n.key); setOpen(false) }}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {active && <motion.div layoutId="adminnav" className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600" />}
                <span className="relative"><n.icon className="h-4.5 w-4.5" /></span>
                <span className="relative">{n.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-6 w-6 text-slate-700" /></button>
            <div className="font-semibold capitalize text-slate-800">{ADMIN_NAV.find(n => n.key === view)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarFallback className="bg-indigo-100 text-sm font-semibold text-indigo-700">{initials(user.name)}</AvatarFallback></Avatar>
            <div className="hidden text-right sm:block"><div className="text-sm font-semibold text-slate-800">{user.name}</div><div className="text-xs text-slate-400">Administrator</div></div>
          </div>
        </header>
        <main className="p-5">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {view === 'dashboard' && <AdminDashboard />}
              {view === 'students' && <AdminStudents />}
              {view === 'courses' && <AdminCourses />}
              {view === 'batches' && <AdminBatches />}
              {view === 'trainers' && <AdminTrainers />}
              {view === 'branches' && <AdminBranches />}
              {view === 'placements' && <AdminPlacements />}
              {view === 'schedules' && <AdminSchedules />}
              {view === 'live' && <AdminLive />}
              {view === 'attendance' && <AdminReports />}
              {view === 'leave' && <AdminLeave />}
              {view === 'slots' && <AdminSlots />}
              {view === 'rooms' && <AdminRooms />}
              {view === 'holidays' && <AdminHolidays />}
              {view === 'notifications' && <AdminNotifications />}
              {view === 'audit' && <AdminAudit />}
              {view === 'settings' && <AdminSettings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [data, setData] = useState(null)
  useEffect(() => { api('/dashboard/admin').then(setData).catch(() => {}) }, [])
  if (!data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
  const c = data.cards
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={c.totalStudents} color="indigo" delay={0} />
        <StatCard icon={ShieldCheck} label="Active Students" value={c.activeStudents} color="emerald" delay={0.05} />
        <StatCard icon={CalendarDays} label="Today's Classes" value={c.todayClasses} color="sky" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Present Today" value={c.presentToday} color="emerald" delay={0.15} />
        <StatCard icon={XCircle} label="Absent Today" value={c.absentToday} color="rose" delay={0.2} />
        <StatCard icon={Clock} label="Late Students" value={c.lateToday} color="amber" delay={0.25} />
        <StatCard icon={Radio} label="Currently Inside" value={c.insideNow} color="violet" delay={0.3} />
        <StatCard icon={CalendarClock} label="Upcoming Classes" value={c.upcoming} color="slate" delay={0.35} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader><CardTitle className="text-base">Weekly Attendance</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="day" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><RTooltip /><Legend />
                <Bar dataKey="present" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" />
                <Bar dataKey="absent" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader><CardTitle className="text-base">Course-wise Attendance %</CardTitle></CardHeader>
          <CardContent className="h-72">
            {data.courseWise.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.courseWise} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} /><YAxis type="category" dataKey="name" width={110} fontSize={11} /><RTooltip />
                  <Bar dataKey="pct" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty title="No attendance data yet" sub="Generate a QR and let students check in" />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Students ---------- */
function AdminStudents() {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [courses, setCourses] = useState([]); const [batches, setBatches] = useState([]); const [trainers, setTrainers] = useState([])
  const [filterCourse, setFilterCourse] = useState('all'); const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [detail, setDetail] = useState(null)
  const empty = { studentId: '', loginId: '', password: 'Bst@2026', name: '', email: '', mobile: '', courseId: '', batchId: '', trainerId: '', enrollmentDate: '', status: 'Active', requirePasswordChange: false }
  const [form, setForm] = useState(empty)

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (filterCourse !== 'all') params.set('courseId', filterCourse)
    if (filterStatus !== 'all') params.set('status', filterStatus)
    api(`/students?${params}`).then(setList).catch(() => {})
  }, [q, filterCourse, filterStatus])
  useEffect(() => { load() }, [load])
  useEffect(() => { api('/courses').then(setCourses); api('/batches').then(setBatches); api('/trainers').then(setTrainers) }, [])

  const create = async () => {
    if (!form.name || !form.studentId) return toast.error('Name and Student ID required')
    try {
      await api('/students', 'POST', { ...form, loginId: form.loginId || form.studentId })
      toast.success('Student created successfully')
      setShowAdd(false); setForm(empty); load()
    } catch (e) { toast.error(e.message) }
  }
  const resetPwd = async (s) => {
    const np = prompt('New password for ' + s.name, 'Bst@2026'); if (!np) return
    try { await api(`/students/${s.id}/reset-password`, 'POST', { newPassword: np }); toast.success('Password reset') } catch (e) { toast.error(e.message) }
  }
  const toggle = async (s) => { try { const r = await api(`/students/${s.id}/toggle`, 'POST', {}); toast.success('Account ' + r.accountStatus); load() } catch (e) { toast.error(e.message) } }
  const remove = async (s) => { if (!confirm('Delete ' + s.name + '?')) return; try { await api(`/students/${s.id}`, 'DELETE'); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) } }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name / ID / email / mobile" className="pl-9" />
        </div>
        <Select value={filterCourse} onValueChange={setFilterCourse}><SelectTrigger className="w-44"><SelectValue placeholder="Course" /></SelectTrigger><SelectContent><SelectItem value="all">All Courses</SelectItem>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{['all', 'Active', 'Completed', 'On Hold', 'Dropped', 'Inactive'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Status' : s}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Student</Button>
      </div>

      {!list ? <Skeleton className="h-64 rounded-2xl" /> : list.length === 0 ? <Empty icon={Users} title="No students found" sub="Add your first student" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Login ID</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Account</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-indigo-100 text-xs text-indigo-700">{initials(s.name)}</AvatarFallback></Avatar><div><div className="font-medium text-slate-800">{s.name}</div><div className="text-xs text-slate-400">{s.studentId}</div></div></div></td>
                    <td className="px-4 py-3 font-mono text-xs">{s.loginId}</td>
                    <td className="px-4 py-3 text-slate-600">{s.courseName || '--'}</td>
                    <td className="px-4 py-3 text-slate-600">{s.batchName || '--'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.accountStatus} /></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="View" onClick={() => setDetail(s)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Reset password" onClick={() => resetPwd(s)}><KeyRound className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Toggle account" onClick={() => toggle(s)}><Power className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(s)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Student ID *"><Input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value, loginId: form.loginId || e.target.value })} placeholder="BST-PY-021" /></Field>
            <Field label="Login ID"><Input value={form.loginId} onChange={e => setForm({ ...form, loginId: e.target.value })} placeholder="defaults to Student ID" /></Field>
            <Field label="Temporary Password"><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="Email"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Mobile"><Input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></Field>
            <Field label="Course"><Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Batch"><Select value={form.batchId} onValueChange={v => setForm({ ...form, batchId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batchId}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Trainer"><Select value={form.trainerId} onValueChange={v => setForm({ ...form, trainerId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Enrollment Date"><Input type="date" value={form.enrollmentDate} onChange={e => setForm({ ...form, enrollmentDate: e.target.value })} /></Field>
            <div className="col-span-2 flex items-center gap-2 rounded-xl bg-slate-50 p-3"><Switch checked={form.requirePasswordChange} onCheckedChange={v => setForm({ ...form, requirePasswordChange: v })} /><span className="text-sm text-slate-600">Require password change on first login</span></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={create} className="bg-gradient-to-r from-indigo-500 to-violet-600">Create Account</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <StudentDetailDialog student={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

function StudentDetailDialog({ student, onClose }) {
  const [rep, setRep] = useState(null)
  useEffect(() => { if (student) { setRep(null); api(`/attendance/student/${student.id}`).then(setRep).catch(() => {}) } }, [student])
  if (!student) return null
  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white">{initials(student.name)}</AvatarFallback></Avatar>
          <div><div className="text-xl font-bold text-slate-900">{student.name}</div><div className="text-sm text-slate-500">{student.studentId} · {student.email}</div>
            <div className="mt-1 flex gap-2"><StatusBadge status={student.accountStatus} /><Badge variant="outline">{student.courseName}</Badge><Badge variant="outline">{student.batchName}</Badge></div></div>
        </div>
        {rep && (
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[['Total', rep.stats.total, 'slate'], ['Present', rep.stats.present, 'emerald'], ['Late', rep.stats.late, 'amber'], ['Absent', rep.stats.absent, 'rose'], ['Leave', rep.stats.leave, 'violet'], ['%', rep.stats.pct, 'indigo']].map(([k, v, col]) => (
              <div key={k} className="rounded-xl border border-slate-200 bg-white p-3 text-center"><div className={`text-xl font-bold text-${col}-600`}>{v}</div><div className="text-xs text-slate-400">{k}</div></div>
            ))}
          </div>
        )}
        <div className="mt-2 text-sm font-semibold text-slate-700">Attendance History</div>
        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
          {rep?.records?.length ? rep.records.map(r => (
            <div key={r.id} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-0">
              <div><span className="font-medium">{r.classType}</span> <span className="text-slate-400">· {r.date}</span></div>
              <div className="flex items-center gap-3 text-slate-500"><span>{fmtTime(r.checkInTime)} - {fmtTime(r.checkOutTime)}</span><StatusBadge status={r.status} /></div>
            </div>
          )) : <div className="p-4 text-center text-sm text-slate-400">No records</div>}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Login ID: <b>{student.loginId}</b> · Last Login: {student.lastLogin ? fmtDate(student.lastLogin) : 'Never'} · First login {student.firstLoginCompleted ? 'completed' : 'pending'}</div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }) { return <div><Label className="text-xs font-semibold text-slate-500">{label}</Label><div className="mt-1">{children}</div></div> }

/* ---------- Courses ---------- */
function AdminCourses() {
  const [list, setList] = useState(null); const [name, setName] = useState(''); const [code, setCode] = useState('')
  const load = () => api('/courses').then(setList)
  useEffect(() => { load() }, [])
  const add = async () => { if (!name) return; try { await api('/courses', 'POST', { name, code }); toast.success('Course added'); setName(''); setCode(''); load() } catch (e) { toast.error(e.message) } }
  const del = async (id) => { if (!confirm('Delete course?')) return; await api(`/courses/${id}`, 'DELETE'); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="flex flex-wrap items-end gap-3 pt-6">
        <Field label="Course Name"><Input value={name} onChange={e => setName(e.target.value)} className="w-64" placeholder="e.g. Cloud Computing" /></Field>
        <Field label="Code"><Input value={code} onChange={e => setCode(e.target.value)} className="w-32" placeholder="CC" /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Course</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(c => (
            <Card key={c.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><BookOpen className="h-5 w-5" /></div><div><div className="font-semibold text-slate-800">{c.name}</div><div className="text-xs text-slate-400">{c.code}</div></div></div>
              <Button size="icon" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Batches ---------- */
function AdminBatches() {
  const [list, setList] = useState(null); const [courses, setCourses] = useState([]); const [trainers, setTrainers] = useState([])
  const [form, setForm] = useState({ batchId: '', name: '', courseId: '', trainerId: '', startDate: '', endDate: '', maxStudents: 30 })
  const load = () => api('/batches').then(setList)
  useEffect(() => { load(); api('/courses').then(setCourses); api('/trainers').then(setTrainers) }, [])
  const add = async () => { if (!form.batchId) return toast.error('Batch ID required'); try { await api('/batches', 'POST', form); toast.success('Batch created'); setForm({ batchId: '', name: '', courseId: '', trainerId: '', startDate: '', endDate: '', maxStudents: 30 }); load() } catch (e) { toast.error(e.message) } }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Batch ID"><Input value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })} placeholder="PY-FS-02" /></Field>
        <Field label="Batch Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Course"><Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Trainer"><Select value={form.trainerId} onValueChange={v => setForm({ ...form, trainerId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Start Date"><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
        <Field label="End Date"><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
        <div className="flex items-end"><Button onClick={add} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Create Batch</Button></div>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(b => (
            <Card key={b.id} className="rounded-2xl border-slate-200"><CardContent className="pt-6">
              <div className="flex items-center justify-between"><div className="font-bold text-slate-800">{b.batchId}</div><StatusBadge status={b.status} /></div>
              <div className="mt-1 text-sm text-slate-500">{b.courseName}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span>Trainer: {b.trainerName || '--'}</span><span>{b.currentStudents}/{b.maxStudents} students</span></div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Trainers ---------- */
function AdminTrainers() {
  const [list, setList] = useState(null); const [branches, setBranches] = useState([])
  const [form, setForm] = useState({ name: '', email: '', mobile: '', skills: '', courses: '', loginId: '', password: 'Trainer@2026', branchId: '' })
  const load = () => api('/trainers').then(setList)
  useEffect(() => { load(); api('/branches').then(setBranches) }, [])
  const add = async () => { if (!form.name) return toast.error('Name required'); try { await api('/trainers', 'POST', form); toast.success('Trainer created with login'); setForm({ name: '', email: '', mobile: '', skills: '', courses: '', loginId: '', password: 'Trainer@2026', branchId: '' }); load() } catch (e) { toast.error(e.message) } }
  const del = async (id) => { if (!confirm('Delete trainer?')) return; await api(`/trainers/${id}`, 'DELETE'); load() }
  const resetPwd = async (t) => { const np = prompt('New password for ' + t.name, 'Trainer@2026'); if (!np) return; try { await api(`/trainers/${t.id}/reset-password`, 'POST', { newPassword: np }); toast.success('Password reset') } catch (e) { toast.error(e.message) } }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Mobile"><Input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></Field>
        <Field label="Skills"><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Python, SQL" /></Field>
        <Field label="Login ID"><Input value={form.loginId} onChange={e => setForm({ ...form, loginId: e.target.value })} placeholder="auto TR-xx" /></Field>
        <Field label="Password"><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Branch"><Select value={form.branchId} onValueChange={v => setForm({ ...form, branchId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></Field>
        <div className="flex items-end"><Button onClick={add} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Trainer</Button></div>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(t => (
          <Card key={t.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarFallback className="bg-violet-100 text-violet-700">{initials(t.name)}</AvatarFallback></Avatar><div><div className="font-semibold text-slate-800">{t.name}</div><div className="text-xs text-slate-400">{t.skills}</div><div className="text-xs font-mono text-indigo-500">{t.loginId}</div></div></div>
            <div className="flex gap-1"><Button size="icon" variant="ghost" title="Reset password" onClick={() => resetPwd(t)}><KeyRound className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => del(t.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  )
}

function AdminBranches() {
  const [list, setList] = useState(null); const [form, setForm] = useState({ name: '', city: '', lat: '', lng: '', radius: 200 })
  const load = () => api('/branches').then(setList); useEffect(() => { load() }, [])
  const add = async () => { if (!form.name) return toast.error('Name required'); await api('/branches', 'POST', form); toast.success('Branch added'); setForm({ name: '', city: '', lat: '', lng: '', radius: 200 }); load() }
  const del = async (id) => { if (!confirm('Delete branch?')) return; await api(`/branches/${id}`, 'DELETE'); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid items-end gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Branch Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Velachery" /></Field>
        <Field label="City"><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="Latitude"><Input type="number" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></Field>
        <Field label="Longitude"><Input type="number" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></Field>
        <Field label="Radius (m)"><Input type="number" value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Branch</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-32 rounded-2xl" /> : list.length === 0 ? <Empty icon={Building2} title="No branches" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(b => (
          <Card key={b.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-600"><Building2 className="h-5 w-5" /></div><div><div className="font-semibold text-slate-800">{b.name}</div><div className="text-xs text-slate-400">{b.city} · {b.radius}m radius</div></div></div>
            <Button size="icon" variant="ghost" onClick={() => del(b.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  )
}

function AdminPlacements() {
  const [list, setList] = useState(null); const [form, setForm] = useState({ company: '', role: '', eligibility: '', package: '', location: '', interviewDate: '' })
  const [applicants, setApplicants] = useState(null)
  const load = () => api('/placements').then(setList); useEffect(() => { load() }, [])
  const add = async () => { if (!form.company || !form.role) return toast.error('Company and Role required'); await api('/placements', 'POST', form); toast.success('Placement drive added'); setForm({ company: '', role: '', eligibility: '', package: '', location: '', interviewDate: '' }); load() }
  const del = async (id) => { if (!confirm('Delete drive?')) return; await api(`/placements/${id}`, 'DELETE'); load() }
  const viewApps = async (p) => { const a = await api(`/placements/${p.id}/applicants`); setApplicants({ p, list: a }) }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid items-end gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Company"><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></Field>
        <Field label="Job Role"><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></Field>
        <Field label="Package"><Input value={form.package} onChange={e => setForm({ ...form, package: e.target.value })} placeholder="5 LPA" /></Field>
        <Field label="Eligibility"><Input value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} /></Field>
        <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Interview Date"><Input type="date" value={form.interviewDate} onChange={e => setForm({ ...form, interviewDate: e.target.value })} /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Drive</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : list.length === 0 ? <Empty icon={Briefcase} title="No placement drives" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(p => (
          <Card key={p.id} className="rounded-2xl border-slate-200"><CardContent className="pt-6">
            <div className="flex items-start justify-between"><div><div className="font-bold text-slate-800">{p.company}</div><div className="text-sm text-indigo-600">{p.role}</div></div><Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div>
            <div className="mt-2 space-y-1 text-xs text-slate-500"><div>Package: {p.package}</div><div>Eligibility: {p.eligibility}</div><div>Interview: {fmtDate(p.interviewDate)}</div></div>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => viewApps(p)}><Users className="mr-1 h-4 w-4" /> Applicants ({p.applicants})</Button>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={!!applicants} onOpenChange={() => setApplicants(null)}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{applicants?.p.company} — Applicants</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto">{applicants?.list?.length ? applicants.list.map(a => (
            <div key={a.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm"><div><div className="font-medium text-slate-800">{a.studentName}</div><div className="text-xs text-slate-400">{a.studentCode} · {a.batchName}</div></div><Badge variant="outline">{a.status}</Badge></div>
          )) : <Empty icon={Users} title="No applicants yet" />}</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- Schedules ---------- */
function AdminSchedules() {
  const [list, setList] = useState(null); const [batches, setBatches] = useState([]); const [types, setTypes] = useState([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [form, setForm] = useState({ batchId: '', classType: '', startTime: '09:00', endTime: '11:00', room: 'Lab 1', maxCapacity: 30 })
  const [qr, setQr] = useState(null)
  const load = useCallback(() => { api(`/schedules?date=${date}`).then(setList) }, [date])
  useEffect(() => { load() }, [load])
  useEffect(() => { api('/batches').then(setBatches); api('/class-types').then(setTypes) }, [])
  const add = async () => { if (!form.batchId || !form.classType) return toast.error('Batch and Class Type required'); try { await api('/schedules', 'POST', { ...form, date }); toast.success('Schedule created'); load() } catch (e) { toast.error(e.message) } }
  const del = async (id) => { if (!confirm('Delete schedule?')) return; await api(`/schedules/${id}`, 'DELETE'); load() }
  const genQR = async (s) => { try { const sess = await api('/sessions', 'POST', { scheduleId: s.id }); setQr({ ...sess, schedule: s }); toast.success('QR generated successfully'); load() } catch (e) { toast.error(e.message) } }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid items-end gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Date"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Batch"><Select value={form.batchId} onValueChange={v => setForm({ ...form, batchId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batchId}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Class Type"><Select value={form.classType} onValueChange={v => setForm({ ...form, classType: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{types.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Start"><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></Field>
        <Field label="End"><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Class</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : list.length === 0 ? <Empty icon={CalendarDays} title="No classes scheduled" sub={`for ${fmtDate(date)}`} /> : (
        <div className="space-y-2">{list.map(s => (
          <Card key={s.id} className="rounded-2xl border-slate-200"><CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Clock className="h-5 w-5" /></div>
            <div className="min-w-[120px]"><div className="font-bold text-slate-800">{s.startTime} - {s.endTime}</div><div className="text-xs text-slate-400">{s.durationMin} min</div></div>
            <div className="min-w-[140px]"><div className="font-semibold text-slate-700">{s.classType}</div><div className="text-xs text-slate-400">{s.batchName} · {s.room}</div></div>
            <div className="text-sm text-slate-500">{s.trainerName}</div>
            <div className="ml-auto flex items-center gap-2"><StatusBadge status={s.status} />
              <Button size="sm" onClick={() => genQR(s)} className="bg-gradient-to-r from-emerald-500 to-teal-600"><QrCode className="mr-1 h-4 w-4" /> Generate QR</Button>
              <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <QRDialog qr={qr} onClose={() => setQr(null)} />
    </div>
  )
}

function QRDialog({ qr, onClose }) {
  if (!qr) return null
  return (
    <Dialog open={!!qr} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span> Live Attendance QR</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center">
          <div className="text-center"><div className="text-lg font-bold text-slate-900">{qr.classType}</div><div className="text-sm text-slate-500">{qr.courseName} · {qr.batchName}</div><div className="text-xs text-slate-400">{qr.startTime} - {qr.endTime}</div></div>
          <div className="my-4"><QRImage token={qr.token} /></div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2">
            <span className="text-xs text-slate-500">Manual code:</span><span className="font-mono text-lg font-bold tracking-widest text-indigo-700">{qr.token}</span>
            <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard?.writeText(qr.token); toast.success('Copied') }}><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-600"><Timer className="h-3.5 w-3.5" /> Valid until {fmtTime(qr.validTo)}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Live Attendance ---------- */
function AdminLive() {
  const [data, setData] = useState(null); const [selected, setSelected] = useState('')
  const load = useCallback(() => { const q = selected ? `?scheduleId=${selected}` : ''; api(`/attendance/live${q}`).then(d => { setData(d); if (!selected && d.schedule) setSelected(d.schedule.id) }).catch(() => {}) }, [selected])
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t) }, [load])
  if (!data) return <Skeleton className="h-96 rounded-2xl" />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" /></span> LIVE ATTENDANCE</div>
        {data.activeSessions?.length > 1 && (
          <Select value={selected} onValueChange={setSelected}><SelectTrigger className="w-64"><SelectValue placeholder="Session" /></SelectTrigger><SelectContent>{data.activeSessions.map(s => <SelectItem key={s.id} value={s.scheduleId}>{s.classType} · {s.batchName}</SelectItem>)}</SelectContent></Select>
        )}
      </div>
      {!data.schedule ? <Empty icon={Radio} title="No live session" sub="Generate a QR from Schedules to start a live session" /> : (
        <>
          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div><div className="text-xl font-bold">{data.schedule.classType}</div><div className="text-sm text-indigo-100">{data.schedule.courseName} · {data.schedule.batchName} · {data.schedule.startTime}-{data.schedule.endTime}</div><div className="text-xs text-indigo-200">Trainer: {data.schedule.trainerName}</div></div>
              <div className="flex gap-4">
                {[['Present', data.stats.present], ['Late', data.stats.late], ['Absent', data.stats.absent], ['Inside', data.stats.inside]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-indigo-100">{k}</div></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">State</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {data.rows.map(r => (
                    <motion.tr key={r.studentId} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="bg-slate-100 text-xs">{initials(r.name)}</AvatarFallback></Avatar><span className="font-medium text-slate-800">{r.name}</span></div></td>
                      <td className="px-4 py-3">{fmtTime(r.checkIn)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">{r.checkIn ? (r.locationVerified ? <span className="inline-flex items-center gap-1 text-emerald-600"><MapPin className="h-3.5 w-3.5" />Verified</span> : <span className="text-amber-600">Unverified</span>) : '--'}</td>
                      <td className="px-4 py-3">{r.inside ? <span className="inline-flex items-center gap-1 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Inside</span> : r.checkIn ? <span className="text-slate-400">Checked out</span> : <span className="text-slate-300">--</span>}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Reports ---------- */
function AdminReports() {
  const [list, setList] = useState(null); const [batches, setBatches] = useState([])
  const [date, setDate] = useState(''); const [batchId, setBatchId] = useState('all'); const [status, setStatus] = useState('all')
  const load = useCallback(() => { const p = new URLSearchParams(); if (date) p.set('date', date); if (batchId !== 'all') p.set('batchId', batchId); if (status !== 'all') p.set('status', status); api(`/attendance/report?${p}`).then(setList) }, [date, batchId, status])
  useEffect(() => { load() }, [load]); useEffect(() => { api('/batches').then(setBatches) }, [])
  const exportCsv = () => {
    if (!list?.length) return toast.error('Nothing to export')
    const head = ['Date', 'Student', 'Code', 'Class', 'Batch', 'Check-in', 'Check-out', 'Duration', 'Status', 'Location']
    const rows = list.map(r => [r.date, r.studentName, r.studentCode, r.classType, r.batchName, fmtTime(r.checkInTime), fmtTime(r.checkOutTime), r.sessionDuration || '', r.status, r.locationVerified ? 'Verified' : 'Unverified'])
    const csv = [head, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'attendance_report.csv'; a.click()
    toast.success('CSV exported')
  }
  const exportPdf = () => {
    if (!list?.length) return toast.error('Nothing to export')
    const rows = list.map(r => `<tr><td>${r.date}</td><td>${r.studentName}</td><td>${r.classType} (${r.batchName})</td><td>${fmtTime(r.checkInTime)}</td><td>${fmtTime(r.checkOutTime)}</td><td>${r.status}</td></tr>`).join('')
    const html = `<html><head><title>Attendance Report</title><style>body{font-family:system-ui,Arial;padding:24px;color:#1e293b}h1{color:#4f46e5;margin-bottom:2px}.sub{color:#64748b;margin-bottom:16px;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#eef2ff;text-align:left;padding:8px;border-bottom:2px solid #c7d2fe}td{padding:8px;border-bottom:1px solid #e2e8f0}</style></head><body><h1>Besant StudentHub</h1><div class="sub">Attendance Report &middot; Generated ${new Date().toLocaleString('en-IN')} &middot; ${list.length} records</div><table><thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
    const w = window.open('', '_blank'); if (!w) return toast.error('Allow popups to export PDF'); w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400)
    toast.success('Opening print / Save as PDF')
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
        <Select value={batchId} onValueChange={setBatchId}><SelectTrigger className="w-44"><SelectValue placeholder="Batch" /></SelectTrigger><SelectContent><SelectItem value="all">All Batches</SelectItem>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batchId}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{['all', 'Present', 'Late', 'Absent', 'Leave'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Status' : s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" onClick={exportCsv}><FileBarChart className="mr-1 h-4 w-4" /> Export CSV</Button>
        <Button variant="outline" onClick={exportPdf}><Printer className="mr-1 h-4 w-4" /> Export PDF</Button>
      </div>
      {!list ? <Skeleton className="h-64 rounded-2xl" /> : list.length === 0 ? <Empty icon={FileBarChart} title="No attendance records" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Check-out</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{list.map(r => (
              <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-500">{r.date}</td><td className="px-4 py-3 font-medium text-slate-800">{r.studentName}</td><td className="px-4 py-3">{r.classType} <span className="text-xs text-slate-400">({r.batchName})</span></td><td className="px-4 py-3">{fmtTime(r.checkInTime)}</td><td className="px-4 py-3">{fmtTime(r.checkOutTime)}</td><td className="px-4 py-3"><StatusBadge status={r.status} /></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}

/* ---------- Leave / Slots / Rooms / Holidays / Notifications / Audit / Settings ---------- */
function AdminLeave() {
  const [list, setList] = useState(null)
  const load = () => api('/leave').then(setList); useEffect(() => { load() }, [])
  const act = async (id, status) => { await api(`/leave/${id}`, 'PUT', { status }); toast.success('Leave ' + status); load() }
  if (!list) return <Skeleton className="h-64 rounded-2xl" />
  if (!list.length) return <Empty icon={PlaneTakeoff} title="No leave requests" />
  return (
    <div className="space-y-2">{list.map(l => (
      <Card key={l.id} className="rounded-2xl border-slate-200"><CardContent className="flex flex-wrap items-center gap-4 pt-6">
        <div className="flex-1"><div className="font-semibold text-slate-800">{l.studentName} <span className="text-xs text-slate-400">({l.studentCode})</span></div><div className="text-sm text-slate-500">{l.fromDate} → {l.toDate} · {l.reason}</div>{l.description && <div className="text-xs text-slate-400">{l.description}</div>}</div>
        <StatusBadge status={l.status === 'Rejected' ? 'Rejected2' : l.status} />
        {l.status === 'Pending' && <div className="flex gap-2"><Button size="sm" onClick={() => act(l.id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button><Button size="sm" variant="outline" onClick={() => act(l.id, 'Rejected')}>Reject</Button></div>}
      </CardContent></Card>
    ))}</div>
  )
}

function AdminSlots() {
  const [list, setList] = useState(null); const [form, setForm] = useState({ title: '', date: '', startTime: '', endTime: '', capacity: 1 })
  const load = () => api('/slots').then(setList); useEffect(() => { load() }, [])
  const add = async () => { if (!form.title) return; await api('/slots', 'POST', form); toast.success('Slot created'); setForm({ title: '', date: '', startTime: '', endTime: '', capacity: 1 }); load() }
  const del = async (id) => { await api(`/slots/${id}`, 'DELETE'); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid items-end gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Interview Prep" /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Start"><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></Field>
        <Field label="End"><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></Field>
        <Field label="Capacity"><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Slot</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : list.length === 0 ? <Empty icon={Ticket} title="No slots created" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(s => (
          <Card key={s.id} className="rounded-2xl border-slate-200"><CardContent className="pt-6">
            <div className="flex items-center justify-between"><div className="font-semibold text-slate-800">{s.title}</div><Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div>
            <div className="text-sm text-slate-500">{s.date} · {s.startTime}-{s.endTime}</div>
            <div className="mt-2 text-xs text-slate-400">Booked {s.bookedCount}/{s.capacity} · {s.available} available</div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  )
}

function AdminRooms() {
  const [list, setList] = useState(null); const [form, setForm] = useState({ name: '', capacity: '' })
  const load = () => api('/rooms').then(setList); useEffect(() => { load() }, [])
  const add = async () => { if (!form.name) return; await api('/rooms', 'POST', form); setForm({ name: '', capacity: '' }); load() }
  const del = async (id) => { await api(`/rooms/${id}`, 'DELETE'); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="flex flex-wrap items-end gap-3 pt-6">
        <Field label="Room Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Lab 1" /></Field>
        <Field label="Capacity"><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="w-32" /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Room</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-32 rounded-2xl" /> : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{list.map(r => (
          <Card key={r.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6"><div className="flex items-center gap-2"><DoorOpen className="h-5 w-5 text-indigo-600" /><div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-400">Cap {r.capacity}</div></div></div><Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></CardContent></Card>
        ))}</div>
      )}
    </div>
  )
}

function AdminHolidays() {
  const [list, setList] = useState(null); const [form, setForm] = useState({ name: '', date: '' })
  const load = () => api('/holidays').then(setList); useEffect(() => { load() }, [])
  const add = async () => { if (!form.name || !form.date) return; await api('/holidays', 'POST', form); setForm({ name: '', date: '' }); load() }
  const del = async (id) => { await api(`/holidays/${id}`, 'DELETE'); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="flex flex-wrap items-end gap-3 pt-6">
        <Field label="Holiday"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Diwali" /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Button onClick={add} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Plus className="mr-1 h-4 w-4" /> Add Holiday</Button>
      </CardContent></Card>
      {!list ? <Skeleton className="h-32 rounded-2xl" /> : list.length === 0 ? <Empty icon={PartyPopper} title="No holidays configured" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{list.map(h => (
          <Card key={h.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6"><div className="flex items-center gap-2"><PartyPopper className="h-5 w-5 text-violet-600" /><div><div className="font-semibold text-slate-800">{h.name}</div><div className="text-xs text-slate-400">{fmtDate(h.date)}</div></div></div><Button size="icon" variant="ghost" onClick={() => del(h.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></CardContent></Card>
        ))}</div>
      )}
    </div>
  )
}

function AdminNotifications() {
  const [list, setList] = useState(null); const [batches, setBatches] = useState([])
  const [form, setForm] = useState({ target: 'all', targetId: null, title: '', message: '' })
  const load = () => api('/notifications').then(setList); useEffect(() => { load(); api('/batches').then(setBatches) }, [])
  const send = async () => { if (!form.title) return toast.error('Title required'); await api('/notifications', 'POST', form); toast.success('Notification sent'); setForm({ target: 'all', targetId: null, title: '', message: '' }); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
        <Field label="Target"><Select value={form.target} onValueChange={v => setForm({ ...form, target: v, targetId: null })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Students</SelectItem><SelectItem value="batch">Specific Batch</SelectItem></SelectContent></Select></Field>
        {form.target === 'batch' && <Field label="Batch"><Select value={form.targetId || ''} onValueChange={v => setForm({ ...form, targetId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batchId}</SelectItem>)}</SelectContent></Select></Field>}
        <Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Message"><Input value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></Field>
        <div><Button onClick={send} className="bg-gradient-to-r from-indigo-500 to-violet-600"><Bell className="mr-1 h-4 w-4" /> Send</Button></div>
      </CardContent></Card>
      {!list ? <Skeleton className="h-40 rounded-2xl" /> : (
        <div className="space-y-2">{list.map(n => (
          <Card key={n.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-start gap-3 pt-6"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Bell className="h-4 w-4" /></div><div className="flex-1"><div className="font-semibold text-slate-800">{n.title}</div><div className="text-sm text-slate-500">{n.message}</div></div><div className="text-xs text-slate-400">{fmtDate(n.createdAt)}</div></CardContent></Card>
        ))}</div>
      )}
    </div>
  )
}

function AdminAudit() {
  const [list, setList] = useState(null); useEffect(() => { api('/audit').then(setList) }, [])
  if (!list) return <Skeleton className="h-64 rounded-2xl" />
  if (!list.length) return <Empty icon={ScrollText} title="No audit logs yet" />
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Time</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{list.map(a => (
          <tr key={a.id}><td className="px-4 py-3 font-medium text-slate-800">{a.action}</td><td className="px-4 py-3 text-slate-500">{a.entity}</td><td className="px-4 py-3 text-slate-500">{a.details}</td><td className="px-4 py-3 text-xs text-slate-400">{new Date(a.timestamp).toLocaleString('en-IN')}</td></tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function AdminSettings() {
  const [s, setS] = useState(null)
  useEffect(() => { api('/settings').then(setS) }, [])
  const save = async () => { try { const r = await api('/settings', 'PUT', s); setS(r); toast.success('Settings saved') } catch (e) { toast.error(e.message) } }
  const useMyLocation = () => { navigator.geolocation.getCurrentPosition(p => { setS({ ...s, centerLat: Number(p.coords.latitude.toFixed(6)), centerLng: Number(p.coords.longitude.toFixed(6)) }); toast.success('Center set to your current location') }, () => toast.error('Location unavailable')) }
  if (!s) return <Skeleton className="h-64 rounded-2xl" />
  return (
    <div className="max-w-2xl space-y-4">
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-600" /> Location Verification</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Center Name"><Input value={s.centerName || ''} onChange={e => setS({ ...s, centerName: e.target.value })} /></Field>
          <Field label="Mode"><Select value={s.locationMode} onValueChange={v => setS({ ...s, locationMode: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lenient">Lenient (capture, don't block)</SelectItem><SelectItem value="strict">Strict (block outside radius)</SelectItem></SelectContent></Select></Field>
          <Field label="Latitude"><Input type="number" value={s.centerLat} onChange={e => setS({ ...s, centerLat: Number(e.target.value) })} /></Field>
          <Field label="Longitude"><Input type="number" value={s.centerLng} onChange={e => setS({ ...s, centerLng: Number(e.target.value) })} /></Field>
          <Field label="Allowed Radius (m)"><Input type="number" value={s.radiusMeters} onChange={e => setS({ ...s, radiusMeters: Number(e.target.value) })} /></Field>
          <div className="flex items-end"><Button variant="outline" onClick={useMyLocation} className="w-full"><MapPin className="mr-1 h-4 w-4" /> Use my location</Button></div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4 text-indigo-600" /> Attendance Rules</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Max Session (min)"><Input type="number" value={s.maxSessionMinutes} onChange={e => setS({ ...s, maxSessionMinutes: Number(e.target.value) })} /></Field>
          <Field label="Grace Period (min)"><Input type="number" value={s.graceMinutes} onChange={e => setS({ ...s, graceMinutes: Number(e.target.value) })} /></Field>
        </CardContent>
      </Card>
      <Button onClick={save} className="bg-gradient-to-r from-indigo-500 to-violet-600"><RefreshCw className="mr-1 h-4 w-4" /> Save Settings</Button>
    </div>
  )
}

/* ============================ STUDENT ============================ */
const STUDENT_NAV = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'schedule', label: 'Schedule', icon: CalendarClock },
  { key: 'scan', label: 'Scan', icon: ScanLine },
  { key: 'attendance', label: 'Attendance', icon: FileBarChart },
  { key: 'profile', label: 'Profile', icon: UserRound },
]

function StudentApp({ user, onLogout }) {
  const [view, setView] = useState('dashboard')
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-2">
          <button onClick={() => setView('notifications')} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><Bell className="h-5 w-5 text-slate-600" /></button>
          <button onClick={onLogout} className="grid h-9 w-9 place-items-center rounded-full hover:bg-rose-50"><LogOut className="h-5 w-5 text-rose-500" /></button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-5">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {view === 'dashboard' && <StudentDashboard user={user} go={setView} />}
            {view === 'schedule' && <StudentSchedule />}
            {view === 'scan' && <StudentScan onDone={() => setView('dashboard')} />}
            {view === 'attendance' && <StudentAttendance />}
            {view === 'profile' && <StudentProfile user={user} />}
            {view === 'slots' && <StudentSlots />}
            {view === 'leave' && <StudentLeave />}
            {view === 'placements' && <StudentPlacements />}
            {view === 'calendar' && <StudentCalendar />}
            {view === 'notifications' && <StudentNotifications />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl items-end justify-around border-t border-slate-200 bg-white/95 px-2 pb-2 pt-1 backdrop-blur">
        {STUDENT_NAV.map(n => {
          const active = view === n.key
          if (n.key === 'scan') return (
            <button key={n.key} onClick={() => setView('scan')} className="-mt-6 grid place-items-center">
              <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
                <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/40" />
                <ScanLine className="relative h-7 w-7 text-white" />
              </div>
              <span className="mt-0.5 text-[10px] font-semibold text-indigo-600">Scan</span>
            </button>
          )
          return (
            <button key={n.key} onClick={() => setView(n.key)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
              <n.icon className="h-5 w-5" /><span className="text-[10px] font-medium">{n.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function StudentDashboard({ user, go }) {
  const [data, setData] = useState(null)
  useEffect(() => { api('/dashboard/student').then(setData).catch(() => {}) }, [])
  if (!data) return <div className="space-y-4"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
  const st = data.student
  const now = new Date()
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-sm text-indigo-100">{greet()},</div>
          <div className="text-2xl font-bold">{st.name} 👋</div>
          <div className="mt-1 text-sm text-indigo-100">{st.courseName} · {st.batchName}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur"><div className="text-lg font-bold">{data.todayAttended}/{data.todayTotal}</div><div className="text-xs text-indigo-100">Today's Classes</div></div>
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur"><div className="text-lg font-bold">{data.overallPct}%</div><div className="text-xs text-indigo-100">Attendance</div></div>
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur"><div className="flex items-center gap-1 text-lg font-bold">{data.current ? <><span className="h-2 w-2 rounded-full bg-emerald-300" /> In</> : 'Out'}</div><div className="text-xs text-indigo-100">Status</div></div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-2">
        {[['Slots', Ticket, 'slots'], ['Leave', PlaneTakeoff, 'leave'], ['Calendar', CalendarDays, 'calendar'], ['Jobs', Briefcase, 'placements']].map(([label, Icon, key]) => (
          <button key={key} onClick={() => go(key)} className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white py-3 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600">
            <Icon className="h-5 w-5" /><span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {data.current && (
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50"><CardContent className="flex items-center justify-between pt-6">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span> CHECKED IN · {data.current.classType}</div><div className="text-xs text-emerald-600">Check-in {fmtTime(data.current.checkInTime)}</div></div>
          <CheckoutButton rec={data.current} onDone={() => api('/dashboard/student').then(setData)} />
        </CardContent></Card>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-slate-800">Today's Schedule</h3><button onClick={() => go('scan')} className="text-sm font-medium text-indigo-600">Scan QR →</button></div>
        {data.todaySchedules.length === 0 ? <Empty icon={CalendarDays} title="No classes scheduled today" /> : (
          <div className="space-y-2">{data.todaySchedules.map((s, i) => {
            const start = new Date(); const [sh, sm] = s.startTime.split(':'); start.setHours(+sh, +sm, 0, 0)
            const end = new Date(); const [eh, em] = s.endTime.split(':'); end.setHours(+eh, +em, 0, 0)
            const isLive = now >= start && now <= end; const done = now > end
            return (
              <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 rounded-2xl border bg-white p-4 ${isLive ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                <div className="text-center"><div className="text-sm font-bold text-slate-800">{s.startTime}</div><div className="text-xs text-slate-400">{s.endTime}</div></div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="flex-1"><div className="font-semibold text-slate-800">{s.classType}</div><div className="text-xs text-slate-400">{s.trainerName} · {s.room}</div></div>
                {isLive ? <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" /> Live</span> : done ? <StatusBadge status="Completed" /> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">Upcoming</span>}
              </motion.div>
            )
          })}</div>
        )}
      </div>
    </div>
  )
}

function CheckoutButton({ rec, onDone }) {
  const [loading, setLoading] = useState(false)
  const checkout = async () => { setLoading(true); try { await api('/attendance/check-out', 'POST', { attendanceId: rec.id }); toast.success('Checked out'); onDone() } catch (e) { toast.error(e.message) } finally { setLoading(false) } }
  return <Button onClick={checkout} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check Out'}</Button>
}

function StudentScan({ onDone }) {
  const [loc, setLoc] = useState(null); const [locErr, setLocErr] = useState(false)
  const [manual, setManual] = useState(''); const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null); const [busy, setBusy] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      p => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => setLocErr(true), { enableHighAccuracy: true, timeout: 8000 }
    )
    else setLocErr(true)
    return () => { stopScan() }
  }, [])

  const stopScan = async () => { if (scannerRef.current) { try { await scannerRef.current.stop(); await scannerRef.current.clear() } catch {} scannerRef.current = null } }

  const startScan = async () => {
    setScanning(true)
    try {
      const mod = await import('html5-qrcode')
      const scanner = new mod.Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 },
        (decoded) => { stopScan(); setScanning(false); doCheckIn(decoded) }, () => {})
    } catch (e) { setScanning(false); toast.error('Camera unavailable. Use manual code.') }
  }

  const doCheckIn = async (token) => {
    setBusy(true)
    try {
      const res = await api('/attendance/check-in', 'POST', { token, lat: loc?.lat, lng: loc?.lng, accuracy: loc?.accuracy, device: navigator.userAgent.slice(0, 60) })
      setResult({ ok: true, ...res })
      toast.success('Attendance recorded')
      setTimeout(() => onDone(), 2600)
    } catch (e) { setResult({ ok: false, message: e.message }) }
    finally { setBusy(false) }
  }

  if (result) return <ScanResult result={result} onClose={() => setResult(null)} />

  return (
    <div className="space-y-5">
      <div className="text-center"><h2 className="text-xl font-bold text-slate-900">Scan Attendance QR</h2><p className="text-sm text-slate-500">Align the QR code inside the frame</p></div>

      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
        <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        {!scanning && (
          <div className="absolute inset-0 grid place-items-center">
            <button onClick={startScan} className="grid place-items-center gap-2">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 backdrop-blur"><Camera className="h-9 w-9 text-white" /></div>
              <span className="text-sm font-medium text-white">Tap to open camera</span>
            </button>
          </div>
        )}
        {/* scanning frame overlay */}
        <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/40">
          <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-2xl border-l-4 border-t-4 border-indigo-400" />
          <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-2xl border-r-4 border-t-4 border-indigo-400" />
          <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-2xl border-b-4 border-l-4 border-indigo-400" />
          <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-2xl border-b-4 border-r-4 border-indigo-400" />
          {scanning && <motion.div className="absolute inset-x-0 h-0.5 bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.8)]" animate={{ top: ['5%', '95%', '5%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />}
        </div>
      </div>

      <div className="mx-auto max-w-sm rounded-xl bg-white p-3 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <MapPin className={`h-4 w-4 ${loc ? 'text-emerald-500' : locErr ? 'text-rose-500' : 'text-amber-500'}`} />
          {loc ? <span className="text-emerald-600">Location detected</span> : locErr ? <span className="text-rose-600">Location unavailable</span> : <span className="text-amber-600">Detecting location…</span>}
        </div>
      </div>

      <div className="mx-auto max-w-sm space-y-2">
        <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">or enter code manually</div>
        <div className="flex gap-2">
          <Input value={manual} onChange={e => setManual(e.target.value.toUpperCase())} placeholder="Enter QR code" className="h-11 text-center font-mono tracking-widest" />
          <Button onClick={() => doCheckIn(manual)} disabled={!manual || busy} className="h-11 bg-gradient-to-r from-indigo-500 to-violet-600">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Check In'}</Button>
        </div>
      </div>
    </div>
  )
}

function ScanResult({ result, onClose }) {
  const ok = result.ok
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-3xl border bg-white p-8 text-center shadow-xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
          {ok ? <CheckCircle2 className="h-14 w-14 text-emerald-600" /> : <XCircle className="h-14 w-14 text-rose-600" />}
        </motion.div>
        {ok ? (
          <>
            <div className="mt-4 text-xl font-bold text-slate-900">Attendance Confirmed</div>
            <div className="mt-1 text-slate-500">{result.courseName}</div>
            <div className="text-lg font-semibold text-indigo-600">{result.classType}</div>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <div><div className="font-semibold text-slate-800">{fmtTime(result.checkInTime)}</div><div className="text-xs text-slate-400">Check-in</div></div>
              <div className="h-8 w-px bg-slate-200" />
              <div><StatusBadge status={result.status} /></div>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1 text-sm ${result.locationVerified ? 'text-emerald-600' : 'text-amber-600'}`}><MapPin className="h-4 w-4" /> {result.locationVerified ? 'Location Verified' : 'Location not verified'}</div>
          </>
        ) : (
          <>
            <div className="mt-4 text-xl font-bold text-slate-900">Check-in Failed</div>
            <div className="mt-1 text-slate-500">{result.message}</div>
            <Button onClick={onClose} className="mt-5 bg-gradient-to-r from-indigo-500 to-violet-600">Try Again</Button>
          </>
        )}
      </motion.div>
    </div>
  )
}

function StudentSchedule() {
  const [list, setList] = useState(null)
  const today = new Date().toISOString().slice(0, 10)
  useEffect(() => { api(`/schedules?date=${today}`).then(setList) }, [])
  if (!list) return <Skeleton className="h-64 rounded-2xl" />
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">My Schedule · {fmtDate(today)}</h2>
      {list.length === 0 ? <Empty icon={CalendarClock} title="No classes scheduled today" /> : list.map(s => (
        <Card key={s.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center gap-4 pt-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Clock className="h-5 w-5" /></div>
          <div className="flex-1"><div className="font-semibold text-slate-800">{s.classType}</div><div className="text-xs text-slate-400">{s.startTime} - {s.endTime} · {s.trainerName}</div></div>
          <StatusBadge status={s.status} />
        </CardContent></Card>
      ))}
    </div>
  )
}

function StudentAttendance() {
  const [rep, setRep] = useState(null); const [data, setData] = useState(null)
  useEffect(() => { api('/attendance/me').then(setRep); api('/dashboard/student').then(setData).catch(() => {}) }, [])
  if (!rep || !data) return <Skeleton className="h-96 rounded-2xl" />
  const present = rep.filter(r => r.status === 'Present').length
  const late = rep.filter(r => r.status === 'Late').length
  const absent = rep.filter(r => r.status === 'Absent').length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TrendingUp} label="Overall %" value={data.overallPct} suffix="%" color="indigo" />
        <StatCard icon={CheckCircle2} label="Present" value={present} color="emerald" />
        <StatCard icon={Clock} label="Late" value={late} color="amber" />
        <StatCard icon={XCircle} label="Absent" value={absent} color="rose" />
      </div>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Monthly Attendance</CardTitle></CardHeader>
        <CardContent className="h-60"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><RTooltip /><Legend /><Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} /><Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} /><Line type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent>
      </Card>
      <div>
        <h3 className="mb-2 font-semibold text-slate-800">History</h3>
        {rep.length === 0 ? <Empty icon={FileBarChart} title="No attendance records available" /> : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">In/Out</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{rep.map(r => (<tr key={r.id}><td className="px-4 py-3 text-slate-500">{r.date}</td><td className="px-4 py-3 font-medium text-slate-800">{r.classType}</td><td className="px-4 py-3 text-slate-500">{fmtTime(r.checkInTime)} - {fmtTime(r.checkOutTime)}</td><td className="px-4 py-3"><StatusBadge status={r.status} /></td></tr>))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}

function StudentProfile({ user }) {
  const [st, setSt] = useState(null); const [tab, setTab] = useState('profile')
  useEffect(() => { api('/dashboard/student').then(d => setSt(d.student)) }, [])
  if (!st) return <Skeleton className="h-64 rounded-2xl" />
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><CardContent className="flex items-center gap-4 pt-6">
        <Avatar className="h-16 w-16 border-2 border-white/30"><AvatarFallback className="bg-white/20 text-xl">{initials(st.name)}</AvatarFallback></Avatar>
        <div><div className="text-xl font-bold">{st.name}</div><div className="text-sm text-indigo-100">{st.studentId}</div><div className="mt-1 flex gap-2"><Badge className="bg-white/20 hover:bg-white/20">{st.courseName}</Badge><Badge className="bg-white/20 hover:bg-white/20">{st.batchName}</Badge></div></div>
      </CardContent></Card>
      <Card className="rounded-2xl"><CardContent className="grid gap-3 pt-6 sm:grid-cols-2 text-sm">
        {[['Email', st.email], ['Mobile', st.mobile], ['Trainer', st.trainerName], ['Enrollment', fmtDate(st.enrollmentDate)], ['Status', st.status], ['Emergency', st.emergencyNumber]].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-slate-100 py-2"><span className="text-slate-400">{k}</span><span className="font-medium text-slate-700">{v || '--'}</span></div>
        ))}
      </CardContent></Card>
      <ChangePasswordInline />
    </div>
  )
}

function ChangePasswordInline() {
  const [open, setOpen] = useState(false); const [cur, setCur] = useState(''); const [np, setNp] = useState('')
  const save = async () => { try { await api('/auth/change-password', 'POST', { currentPassword: cur, newPassword: np }); toast.success('Password changed'); setOpen(false); setCur(''); setNp('') } catch (e) { toast.error(e.message) } }
  return (
    <Card className="rounded-2xl"><CardContent className="pt-6">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between"><span className="flex items-center gap-2 font-medium text-slate-700"><KeyRound className="h-4 w-4 text-indigo-600" /> Change Password</span><ChevronRight className={`h-4 w-4 transition ${open ? 'rotate-90' : ''}`} /></button>
      {open && <div className="mt-4 space-y-3"><Input type="password" placeholder="Current password" value={cur} onChange={e => setCur(e.target.value)} /><Input type="password" placeholder="New password" value={np} onChange={e => setNp(e.target.value)} /><Button onClick={save} className="bg-gradient-to-r from-indigo-500 to-violet-600">Update</Button></div>}
    </CardContent></Card>
  )
}

function StudentSlots() {
  const [list, setList] = useState(null)
  const load = () => api('/slots').then(setList); useEffect(() => { load() }, [])
  const book = async (id) => { try { await api(`/slots/${id}/book`, 'POST', {}); toast.success('Slot booked'); load() } catch (e) { toast.error(e.message) } }
  if (!list) return <Skeleton className="h-64 rounded-2xl" />
  if (!list.length) return <Empty icon={Ticket} title="No slots available" />
  return <div className="space-y-3">{list.map(s => (
    <Card key={s.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6"><div><div className="font-semibold text-slate-800">{s.title}</div><div className="text-sm text-slate-500">{s.date} · {s.startTime}-{s.endTime}</div><div className="text-xs text-slate-400">{s.available} available</div></div>{s.isBooked ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Booked</Badge> : <Button size="sm" disabled={s.available <= 0} onClick={() => book(s.id)} className="bg-gradient-to-r from-indigo-500 to-violet-600">Book Slot</Button>}</CardContent></Card>
  ))}</div>
}

function StudentLeave() {
  const [list, setList] = useState(null); const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '', description: '' })
  const load = () => api('/leave').then(setList); useEffect(() => { load() }, [])
  const submit = async () => { if (!form.fromDate || !form.reason) return toast.error('Fill required fields'); await api('/leave', 'POST', form); toast.success('Leave request submitted'); setForm({ fromDate: '', toDate: '', reason: '', description: '' }); load() }
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
        <Field label="From"><Input type="date" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} /></Field>
        <Field label="To"><Input type="date" value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })} /></Field>
        <Field label="Reason"><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field>
        <Field label="Description"><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <div><Button onClick={submit} className="bg-gradient-to-r from-indigo-500 to-violet-600">Apply Leave</Button></div>
      </CardContent></Card>
      {list?.map(l => (<Card key={l.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center justify-between pt-6"><div><div className="font-medium text-slate-800">{l.fromDate} → {l.toDate}</div><div className="text-sm text-slate-500">{l.reason}</div></div><StatusBadge status={l.status === 'Rejected' ? 'Rejected2' : l.status} /></CardContent></Card>))}
    </div>
  )
}

function StudentNotifications() {
  const [list, setList] = useState(null)
  useEffect(() => { api('/notifications').then(setList) }, [])
  if (!list) return <Skeleton className="h-64 rounded-2xl" />
  if (!list.length) return <Empty icon={Bell} title="You're all caught up" />
  return <div className="space-y-2">{list.map(n => (
    <Card key={n.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-start gap-3 pt-6"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Bell className="h-4 w-4" /></div><div className="flex-1"><div className="font-semibold text-slate-800">{n.title}</div><div className="text-sm text-slate-500">{n.message}</div><div className="mt-1 text-xs text-slate-400">{fmtDate(n.createdAt)}</div></div></CardContent></Card>
  ))}</div>
}

function StudentPlacements() {
  const [list, setList] = useState(null)
  const load = () => api('/placements').then(setList); useEffect(() => { load() }, [])
  const apply = async (id) => { try { await api(`/placements/${id}/apply`, 'POST', {}); toast.success('Applied successfully'); load() } catch (e) { toast.error(e.message) } }
  if (!list) return <Skeleton className="h-64 rounded-2xl" />
  if (!list.length) return <Empty icon={Briefcase} title="No placement opportunities yet" />
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">Placement Opportunities</h2>
      {list.map(p => (
        <Card key={p.id} className="rounded-2xl border-slate-200"><CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div><div className="font-bold text-slate-800">{p.company}</div><div className="text-sm text-indigo-600">{p.role}</div></div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{p.package}</Badge>
          </div>
          <div className="mt-2 space-y-1 text-xs text-slate-500"><div>Eligibility: {p.eligibility}</div><div>Location: {p.location} · Interview: {fmtDate(p.interviewDate)}</div></div>
          {p.applied ? <Badge className="mt-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">✓ Applied ({p.appStatus})</Badge> : <Button size="sm" className="mt-3 bg-gradient-to-r from-indigo-500 to-violet-600" onClick={() => apply(p.id)}>Apply Now</Button>}
        </CardContent></Card>
      ))}
    </div>
  )
}

const CAL_COLORS = { Present: 'bg-emerald-500 text-white', Absent: 'bg-rose-500 text-white', Late: 'bg-amber-500 text-white', Leave: 'bg-violet-500 text-white', Holiday: 'bg-sky-400 text-white', 'Not Scheduled': 'bg-slate-100 text-slate-400' }
function todayMonth() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}` }
function CalendarGrid({ data }) {
  if (!data) return <Skeleton className="h-72 rounded-2xl" />
  const [y, m] = data.month.split('-').map(Number)
  const first = new Date(y, m - 1, 1); const startDow = first.getDay(); const daysIn = new Date(y, m, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) { const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; cells.push({ d, ds, info: data.days[ds] }) }
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => <div key={x}>{x}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => c ? (
          <div key={i} className={`grid aspect-square place-items-center rounded-lg text-sm font-medium ${c.info ? CAL_COLORS[c.info.status] : 'bg-slate-50 text-slate-500'}`} title={c.info?.status || ''}>{c.d}</div>
        ) : <div key={i} />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">{['Present', 'Absent', 'Late', 'Leave', 'Holiday'].map(k => <span key={k} className="flex items-center gap-1"><span className={`h-3 w-3 rounded ${CAL_COLORS[k]}`} />{k}</span>)}</div>
    </div>
  )
}
function StudentCalendar() {
  const [month, setMonth] = useState(() => todayMonth())
  const [data, setData] = useState(null)
  useEffect(() => { setData(null); api(`/attendance/calendar?month=${month}`).then(setData).catch(() => {}) }, [month])
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Attendance Calendar</h2><Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-44" /></div>
      <Card className="rounded-2xl"><CardContent className="pt-6"><CalendarGrid data={data} /></CardContent></Card>
    </div>
  )
}

/* ============================ TRAINER ============================ */
const TRAINER_NAV = [
  { key: 'dashboard', label: 'My Classes', icon: LayoutDashboard },
  { key: 'attendance', label: 'Attendance', icon: FileBarChart },
  { key: 'students', label: 'Students', icon: Users },
]
function TrainerApp({ user, onLogout }) {
  const [view, setView] = useState('dashboard')
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-4">
          <nav className="hidden gap-1 sm:flex">{TRAINER_NAV.map(n => (
            <button key={n.key} onClick={() => setView(n.key)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${view === n.key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}><n.icon className="h-4 w-4" />{n.label}</button>
          ))}</nav>
          <Avatar className="h-9 w-9"><AvatarFallback className="bg-violet-100 text-sm font-semibold text-violet-700">{initials(user.name)}</AvatarFallback></Avatar>
          <button onClick={onLogout} className="grid h-9 w-9 place-items-center rounded-full hover:bg-rose-50"><LogOut className="h-5 w-5 text-rose-500" /></button>
        </div>
      </header>
      <div className="flex gap-1 border-b border-slate-200 bg-white px-3 sm:hidden">{TRAINER_NAV.map(n => (
        <button key={n.key} onClick={() => setView(n.key)} className={`flex items-center gap-1 px-3 py-2.5 text-sm font-medium ${view === n.key ? 'text-indigo-600' : 'text-slate-500'}`}><n.icon className="h-4 w-4" />{n.label}</button>
      ))}</div>
      <main className="mx-auto max-w-5xl p-5">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {view === 'dashboard' && <TrainerDashboard user={user} />}
            {view === 'attendance' && <TrainerAttendance />}
            {view === 'students' && <TrainerStudents />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
function TrainerDashboard({ user }) {
  const [data, setData] = useState(null); const [qr, setQr] = useState(null)
  const load = () => api('/dashboard/trainer').then(setData).catch(() => {})
  useEffect(() => { load() }, [])
  const genQR = async (s) => { try { const sess = await api('/sessions', 'POST', { scheduleId: s.id }); setQr({ ...sess, schedule: s }); toast.success('QR generated') } catch (e) { toast.error(e.message) } }
  if (!data) return <Skeleton className="h-64 rounded-2xl" />
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white"><div className="text-sm text-indigo-100">{greet()},</div><div className="text-2xl font-bold">{user.name} 👋</div><div className="text-sm text-indigo-100">Welcome to your trainer portal</div></div>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={CalendarDays} label="Classes Today" value={data.todaySchedules.length} color="indigo" />
        <StatCard icon={Users} label="My Students" value={data.totalStudents} color="emerald" />
        <StatCard icon={CheckCircle2} label="Present Today" value={data.presentToday} color="emerald" />
        <StatCard icon={Radio} label="Inside Now" value={data.insideNow} color="violet" />
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-slate-800">Today's Classes</h3>
        {data.todaySchedules.length === 0 ? <Empty icon={CalendarDays} title="No classes scheduled today" /> : (
          <div className="space-y-2">{data.todaySchedules.map(s => (
            <Card key={s.id} className="rounded-2xl border-slate-200"><CardContent className="flex flex-wrap items-center gap-4 pt-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Clock className="h-5 w-5" /></div>
              <div><div className="font-bold text-slate-800">{s.startTime} - {s.endTime}</div><div className="text-xs text-slate-400">{s.classType} · {s.batchName} · {s.room}</div></div>
              <div className="ml-auto flex items-center gap-2"><StatusBadge status={s.status} /><Button size="sm" onClick={() => genQR(s)} className="bg-gradient-to-r from-emerald-500 to-teal-600"><QrCode className="mr-1 h-4 w-4" /> Generate QR</Button></div>
            </CardContent></Card>
          ))}</div>
        )}
      </div>
      <QRDialog qr={qr} onClose={() => setQr(null)} />
    </div>
  )
}
function TrainerAttendance() {
  const [list, setList] = useState(null); const [date, setDate] = useState('')
  const load = useCallback(() => { const p = new URLSearchParams(); if (date) p.set('date', date); api(`/attendance/report?${p}`).then(setList) }, [date])
  useEffect(() => { load() }, [load])
  const exportPdf = () => {
    if (!list?.length) return toast.error('Nothing to export')
    const rows = list.map(r => `<tr><td>${r.date}</td><td>${r.studentName}</td><td>${r.classType}</td><td>${fmtTime(r.checkInTime)}</td><td>${r.status}</td></tr>`).join('')
    const html = `<html><head><title>My Attendance Report</title><style>body{font-family:system-ui,Arial;padding:24px}h1{color:#4f46e5}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#eef2ff;text-align:left;padding:8px}td{padding:8px;border-bottom:1px solid #e2e8f0}</style></head><body><h1>Besant StudentHub — My Classes Attendance</h1><table><thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Check-in</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
    const w = window.open('', '_blank'); if (!w) return toast.error('Allow popups'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400)
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" /><Button variant="outline" onClick={exportPdf}><Printer className="mr-1 h-4 w-4" /> Export PDF</Button></div>
      {!list ? <Skeleton className="h-64 rounded-2xl" /> : list.length === 0 ? <Empty icon={FileBarChart} title="No attendance records for your classes" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{list.map(r => (<tr key={r.id}><td className="px-4 py-3 text-slate-500">{r.date}</td><td className="px-4 py-3 font-medium text-slate-800">{r.studentName}</td><td className="px-4 py-3">{r.classType}</td><td className="px-4 py-3">{fmtTime(r.checkInTime)}</td><td className="px-4 py-3"><StatusBadge status={r.status} /></td></tr>))}</tbody>
        </table></div></div>
      )}
    </div>
  )
}
function TrainerStudents() {
  const [data, setData] = useState(null)
  useEffect(() => { api('/dashboard/trainer').then(setData).catch(() => {}) }, [])
  if (!data) return <Skeleton className="h-64 rounded-2xl" />
  if (!data.students.length) return <Empty icon={Users} title="No students in your batches" />
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.students.map(s => (
      <Card key={s.id} className="rounded-2xl border-slate-200"><CardContent className="flex items-center gap-3 pt-6"><Avatar className="h-10 w-10"><AvatarFallback className="bg-indigo-100 text-indigo-700">{initials(s.name)}</AvatarFallback></Avatar><div><div className="font-semibold text-slate-800">{s.name}</div><div className="text-xs text-slate-400">{s.studentId} · {s.batchName}</div></div></CardContent></Card>
    ))}</div>
  )
}

/* ============================ ROOT ============================ */
function App() {
  const [booting, setBooting] = useState(true)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [needPwd, setNeedPwd] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('bsh_token'); const u = localStorage.getItem('bsh_user')
    if (t && u) { AUTH_TOKEN = t; setToken(t); const parsed = JSON.parse(u); setUser(parsed); api('/auth/me').then(() => {}).catch(() => { logout() }) }
    // ensure demo data seeded once
    api('/seed', 'POST').catch(() => {})
    setBooting(false)
  }, [])

  const onLogin = (res) => {
    AUTH_TOKEN = res.token; localStorage.setItem('bsh_token', res.token); localStorage.setItem('bsh_user', JSON.stringify(res.user))
    setToken(res.token); setUser(res.user)
    if (res.user.role === 'student' && res.user.requirePasswordChange) setNeedPwd(true)
    toast.success(`Welcome, ${res.user.name}`)
  }
  const logout = () => { AUTH_TOKEN = null; localStorage.removeItem('bsh_token'); localStorage.removeItem('bsh_user'); setToken(null); setUser(null); setNeedPwd(false) }

  if (booting) return <div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
  if (!token || !user) return <LoginScreen onLogin={onLogin} />
  if (needPwd) return <ChangePassword onDone={() => setNeedPwd(false)} />
  if (user.role === 'admin') return <AdminApp user={user} onLogout={logout} />
  if (user.role === 'trainer') return <TrainerApp user={user} onLogout={logout} />
  return <StudentApp user={user} onLogout={logout} />
}

export default App
