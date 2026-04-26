require('dotenv').config()
const express   = require('express')
const mongoose  = require('mongoose')
const cors      = require('cors')

const {
  Admin, Faculty, Student, Grade, FacultySubject,
  Schedule, Curriculum, Lesson, Event, ActivityLog,
  SubjectMaterial, SubjectSubmission,
  StudentAffiliation, StudentSkill,
  StudentAcademicHistory, StudentNonAcademicHistory, StudentViolation
} = require('./models')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }))
app.use(express.json())

// ── Connect MongoDB ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academicweb')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))

// ── Helper: map _id to id for frontend ──────────────────────
function fmt(doc) {
  if (!doc) return null
  const obj = doc.toObject ? doc.toObject() : doc
  if (obj._id !== undefined) { obj.id = obj._id; delete obj._id }
  if (obj.__v !== undefined) delete obj.__v
  if (obj.createdAt) { obj.created_at = obj.createdAt; delete obj.createdAt }
  if (obj.updatedAt) { obj.updated_at = obj.updatedAt; delete obj.updatedAt }
  return obj
}
function fmtArr(docs) { return docs.map(fmt) }

// ────────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { role, id, password } = req.body
  try {
    if (role === 'admin') {
      if (password !== 'admin1234') return res.status(401).json({ error: 'Invalid admin credentials' })
      const admin = await Admin.findOne({ email: id })
      if (!admin) return res.status(404).json({ error: 'Admin not found' })
      return res.json({ data: fmt(admin) })
    }
    if (role === 'student') {
      const student = await Student.findById(id).populate('adviser_id', 'name department email')
      if (!student) return res.status(404).json({ error: 'Student not found' })
      const obj       = fmt(student)
      const birthYear = extractBirthYear(obj.date_of_birth)
      const digits    = id.replace(/\D/g, '')
      const last5     = digits.slice(-5)
      if (password !== last5 + birthYear)
        return res.status(401).json({ error: 'Invalid credentials' })
      if (obj.adviser_id && typeof obj.adviser_id === 'object') {
        obj.faculty = obj.adviser_id
        obj.adviser_id = obj.faculty.id || obj.faculty._id
      }
      return res.json({ data: obj })
    }
    if (role === 'faculty') {
      const faculty = await Faculty.findById(id)
      if (!faculty) return res.status(404).json({ error: 'Faculty not found' })
      const obj       = fmt(faculty)
      const birthYear = extractBirthYear(obj.date_of_birth)
      const digits    = id.replace(/\D/g, '')
      const last3     = digits.slice(-3)
      if (password !== last3 + birthYear)
        return res.status(401).json({ error: 'Invalid credentials' })
      return res.json({ data: obj })
    }
    res.status(400).json({ error: 'Unknown role' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function extractBirthYear(dob) {
  if (!dob) return ''
  const m = dob.match(/\b(19|20)\d{2}\b/)
  return m ? m[0] : ''
}

// ────────────────────────────────────────────────────────────
//  ADMINS
// ────────────────────────────────────────────────────────────
app.get('/api/admins',       async (_, res) => res.json(fmtArr(await Admin.find())))
app.post('/api/admins/seed', async (req, res) => {
  const existing = await Admin.findOne({ email: 'admin@academicweb.edu.ph' })
  if (!existing) await Admin.create({ name: 'Super Admin', email: 'admin@academicweb.edu.ph' })
  res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  FACULTY  (CRUD)
// ────────────────────────────────────────────────────────────
app.get('/api/faculty', async (req, res) => {
  const filter = {}
  if (req.query.id) filter._id = req.query.id
  res.json(fmtArr(await Faculty.find(filter).sort({ name: 1 })))
})
app.get('/api/faculty/:id', async (req, res) => {
  const doc = await Faculty.findById(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(fmt(doc))
})
app.post('/api/faculty', async (req, res) => {
  try {
    const doc = await Faculty.create({ _id: req.body.id, ...req.body })
    res.json(fmt(doc))
  } catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/faculty/:id', async (req, res) => {
  const doc = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(fmt(doc))
})
app.delete('/api/faculty/:id', async (req, res) => {
  await Faculty.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  STUDENTS  (CRUD)
// ────────────────────────────────────────────────────────────
app.get('/api/students', async (req, res) => {
  let q = Student.find().sort({ name: 1 })
  if (req.query.adviser_id) q = Student.find({ adviser_id: req.query.adviser_id }).sort({ name: 1 })
  const docs = await q.populate('adviser_id', 'name department email')
  res.json(fmtArr(docs).map(s => {
    if (s.adviser_id && typeof s.adviser_id === 'object') {
      s.faculty = s.adviser_id; s.adviser_id = s.faculty.id
    }
    return s
  }))
})
app.get('/api/students/last-id', async (req, res) => {
  const year = new Date().getFullYear()
  const last = await Student.findOne({ _id: new RegExp(`^${year}-`) }).sort({ _id: -1 })
  res.json({ last_id: last?._id || null })
})
app.get('/api/students/:id', async (req, res) => {
  const doc = await Student.findById(req.params.id).populate('adviser_id', 'name department email phone initials')
  if (!doc) return res.status(404).json({ error: 'Not found' })
  const obj = fmt(doc)
  if (obj.adviser_id && typeof obj.adviser_id === 'object') {
    obj.faculty = obj.adviser_id; obj.adviser_id = obj.faculty.id
  }
  res.json(obj)
})
app.post('/api/students', async (req, res) => {
  try {
    const doc = await Student.create({ _id: req.body.id, ...req.body })
    res.json(fmt(doc))
  } catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/students/:id', async (req, res) => {
  const doc = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(fmt(doc))
})
app.delete('/api/students/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id)
  // Cascade delete related data
  await Promise.all([
    Grade.deleteMany({ student_id: req.params.id }),
    Schedule.deleteMany({ owner_type: 'student', owner_id: req.params.id }),
    Curriculum.deleteMany({ owner_type: 'student', owner_id: req.params.id }),
    Lesson.deleteMany({ owner_type: 'student', owner_id: req.params.id }),
    Event.deleteMany({ owner_type: 'student', owner_id: req.params.id }),
    StudentAffiliation.deleteMany({ student_id: req.params.id }),
    StudentSkill.deleteMany({ student_id: req.params.id }),
    StudentAcademicHistory.deleteMany({ student_id: req.params.id }),
    StudentNonAcademicHistory.deleteMany({ student_id: req.params.id }),
    StudentViolation.deleteMany({ student_id: req.params.id }),
  ])
  res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  GRADES
// ────────────────────────────────────────────────────────────
app.get('/api/grades', async (req, res) => {
  const filter = {}
  if (req.query.student_id) filter.student_id = req.query.student_id
  res.json(fmtArr(await Grade.find(filter).sort({ code: 1 })))
})
app.post('/api/grades', async (req, res) => {
  try { res.json(fmt(await Grade.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/grades/:id', async (req, res) => {
  res.json(fmt(await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true })))
})
app.delete('/api/grades/:id', async (req, res) => {
  await Grade.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  FACULTY SUBJECTS
// ────────────────────────────────────────────────────────────
app.get('/api/faculty-subjects', async (req, res) => {
  const filter = {}
  if (req.query.faculty_id) filter.faculty_id = req.query.faculty_id
  if (req.query.section)    filter.section    = req.query.section
  const docs = await FacultySubject.find(filter).populate('faculty_id', 'name department').sort({ code: 1 })
  res.json(fmtArr(docs).map(s => {
    if (s.faculty_id && typeof s.faculty_id === 'object') { s.faculty = s.faculty_id; s.faculty_id = s.faculty.id }
    return s
  }))
})
app.post('/api/faculty-subjects', async (req, res) => {
  try { res.json(fmt(await FacultySubject.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/faculty-subjects/:id', async (req, res) => {
  res.json(fmt(await FacultySubject.findByIdAndUpdate(req.params.id, req.body, { new: true })))
})
app.delete('/api/faculty-subjects/:id', async (req, res) => {
  await FacultySubject.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  SCHEDULES
// ────────────────────────────────────────────────────────────
app.get('/api/schedules', async (req, res) => {
  const filter = {}
  if (req.query.owner_type) filter.owner_type = req.query.owner_type
  if (req.query.owner_id)   filter.owner_id   = req.query.owner_id
  res.json(fmtArr(await Schedule.find(filter).sort({ code: 1 })))
})
app.post('/api/schedules', async (req, res) => {
  try { res.json(fmt(await Schedule.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.delete('/api/schedules/:id', async (req, res) => {
  await Schedule.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  CURRICULUM
// ────────────────────────────────────────────────────────────
app.get('/api/curriculum', async (req, res) => {
  const filter = {}
  if (req.query.owner_type) filter.owner_type = req.query.owner_type
  if (req.query.owner_id)   filter.owner_id   = req.query.owner_id
  res.json(fmtArr(await Curriculum.find(filter).sort({ code: 1 })))
})
app.post('/api/curriculum', async (req, res) => {
  try { res.json(fmt(await Curriculum.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/curriculum/:id', async (req, res) => {
  res.json(fmt(await Curriculum.findByIdAndUpdate(req.params.id, req.body, { new: true })))
})
app.delete('/api/curriculum/:id', async (req, res) => {
  await Curriculum.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  LESSONS
// ────────────────────────────────────────────────────────────
app.get('/api/lessons', async (req, res) => {
  const filter = {}
  if (req.query.owner_type) filter.owner_type = req.query.owner_type
  if (req.query.owner_id)   filter.owner_id   = req.query.owner_id
  if (req.query.status)     filter.status     = req.query.status
  res.json(fmtArr(await Lesson.find(filter).sort({ createdAt: -1 })))
})
app.post('/api/lessons', async (req, res) => {
  try { res.json(fmt(await Lesson.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/lessons/:id', async (req, res) => {
  res.json(fmt(await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true })))
})
app.delete('/api/lessons/:id', async (req, res) => {
  await Lesson.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  EVENTS
// ────────────────────────────────────────────────────────────
app.get('/api/events', async (req, res) => {
  const { owner_type, owner_id } = req.query
  // Match: all events, OR role-wide events, OR specific user events
  const query = owner_type && owner_id ? {
    $or: [
      { owner_type: 'all' },
      { owner_type, owner_id: null },
      { owner_type, owner_id }
    ]
  } : {}
  res.json(fmtArr(await Event.find(query).sort({ date: 1 })))
})
app.post('/api/events', async (req, res) => {
  try { res.json(fmt(await Event.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/events/:id', async (req, res) => {
  res.json(fmt(await Event.findByIdAndUpdate(req.params.id, req.body, { new: true })))
})
app.delete('/api/events/:id', async (req, res) => {
  await Event.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  ACTIVITY LOGS
// ────────────────────────────────────────────────────────────
app.get('/api/activity-logs', async (req, res) => {
  res.json(fmtArr(await ActivityLog.find().sort({ createdAt: -1 }).limit(500)))
})
app.post('/api/activity-logs', async (req, res) => {
  try { res.json(fmt(await ActivityLog.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})

// ────────────────────────────────────────────────────────────
//  SUBJECT MATERIALS
// ────────────────────────────────────────────────────────────
app.get('/api/subject-materials', async (req, res) => {
  const filter = {}
  if (req.query.subject_code) filter.subject_code = req.query.subject_code
  if (req.query.section)      filter.section      = req.query.section
  res.json(fmtArr(await SubjectMaterial.find(filter).sort({ createdAt: -1 })))
})
app.post('/api/subject-materials', async (req, res) => {
  try { res.json(fmt(await SubjectMaterial.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.delete('/api/subject-materials/:id', async (req, res) => {
  await SubjectMaterial.findByIdAndDelete(req.params.id); res.json({ ok: true })
})

// ────────────────────────────────────────────────────────────
//  SUBJECT SUBMISSIONS
// ────────────────────────────────────────────────────────────
app.get('/api/subject-submissions', async (req, res) => {
  const filter = {}
  if (req.query.subject_code) filter.subject_code = req.query.subject_code
  if (req.query.section)      filter.section      = req.query.section
  if (req.query.student_id)   filter.student_id   = req.query.student_id
  const docs = await SubjectSubmission.find(filter).populate('student_id', 'name initials').sort({ createdAt: -1 })
  res.json(fmtArr(docs).map(s => {
    if (s.student_id && typeof s.student_id === 'object') { s.students = s.student_id; s.student_id = s.students.id }
    return s
  }))
})
app.post('/api/subject-submissions', async (req, res) => {
  try { res.json(fmt(await SubjectSubmission.create(req.body))) }
  catch (e) { res.status(400).json({ error: e.message }) }
})
app.put('/api/subject-submissions/:id', async (req, res) => {
  res.json(fmt(await SubjectSubmission.findByIdAndUpdate(req.params.id, req.body, { new: true })))
})

// ────────────────────────────────────────────────────────────
//  STUDENT PROFILE EXTENSIONS
// ────────────────────────────────────────────────────────────
function crudRoutes(path, Model, sortField = 'name') {
  app.get(`/api/${path}`, async (req, res) => {
    const filter = {}
    if (req.query.student_id) filter.student_id = req.query.student_id
    res.json(fmtArr(await Model.find(filter).sort({ [sortField]: 1 })))
  })
  app.post(`/api/${path}`, async (req, res) => {
    try { res.json(fmt(await Model.create(req.body))) }
    catch (e) { res.status(400).json({ error: e.message }) }
  })
  app.put(`/api/${path}/:id`, async (req, res) => {
    res.json(fmt(await Model.findByIdAndUpdate(req.params.id, req.body, { new: true })))
  })
  app.delete(`/api/${path}/:id`, async (req, res) => {
    await Model.findByIdAndDelete(req.params.id); res.json({ ok: true })
  })
}

crudRoutes('student-affiliations',        StudentAffiliation,        'name')
crudRoutes('student-skills',              StudentSkill,              'name')
crudRoutes('student-academic-history',    StudentAcademicHistory,    'year')
crudRoutes('student-nonacademic-history', StudentNonAcademicHistory, 'year')
crudRoutes('student-violations',          StudentViolation,          'date')

// ── Stats for admin dashboard ────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const [students, faculty, subjects, events] = await Promise.all([
    Student.countDocuments(),
    Faculty.countDocuments(),
    FacultySubject.countDocuments(),
    Event.countDocuments(),
  ])
  res.json({ students, faculty, subjects, events })
})

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, db: 'mongodb', env: 'local' }))

app.listen(PORT, () => {
  console.log(`🚀 AcademicWeb API running on http://localhost:${PORT}`)
})
