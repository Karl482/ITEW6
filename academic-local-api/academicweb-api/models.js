const mongoose = require('mongoose')

// ── Admin ────────────────────────────────────────────────────
const AdminSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
}, { timestamps: true })

// ── Faculty ──────────────────────────────────────────────────
const FacultySchema = new mongoose.Schema({
  _id:               { type: String },   // FAC-2026-001
  initials:          String,
  name:              { type: String, required: true },
  date_of_birth:     String,
  email:             { type: String, required: true, unique: true },
  phone:             String,
  address:           String,
  gender:            String,
  department:        { type: String, required: true },
  position:          String,
  specialization:    String,
  years_of_service:  String,
  employment_status: { type: String, default: 'Full-time' },
  education:         String,
}, { timestamps: true, _id: false })

// ── Student ──────────────────────────────────────────────────
const StudentSchema = new mongoose.Schema({
  _id:          { type: String },    // 2026-00001
  initials:     String,
  name:         { type: String, required: true },
  date_of_birth:String,
  email:        { type: String, required: true, unique: true },
  phone:        String,
  address:      String,
  gender:       String,
  program:      { type: String, required: true },
  year_level:   String,
  section:      String,
  semester:     String,
  adviser_id:   { type: String, ref: 'Faculty', default: null },
}, { timestamps: true, _id: false })

// ── Grade ────────────────────────────────────────────────────
const GradeSchema = new mongoose.Schema({
  student_id:  { type: String, ref: 'Student', required: true },
  code:        { type: String, required: true },
  description: String,
  units:       { type: Number, default: 3 },
  midterm:     Number,
  finals:      Number,
  final_grade: Number,
  remarks:     { type: String, default: 'Pending' },
}, { timestamps: true })

// ── Faculty Subject ──────────────────────────────────────────
const FacultySubjectSchema = new mongoose.Schema({
  faculty_id:  { type: String, ref: 'Faculty', required: true },
  code:        { type: String, required: true },
  description: String,
  course:      String,
  section:     String,
  units:       { type: Number, default: 3 },
  schedule:    String,
  room:        String,
  enrolled:    { type: Number, default: 0 },
}, { timestamps: true })

// ── Schedule ─────────────────────────────────────────────────
const ScheduleSchema = new mongoose.Schema({
  owner_type:  { type: String, enum: ['student','faculty'], required: true },
  owner_id:    { type: String, required: true },
  code:        String,
  description: String,
  section:     String,
  days:        String,
  time:        String,
  room:        String,
  instructor:  String,
  enrolled:    Number,
}, { timestamps: true })

// ── Curriculum ───────────────────────────────────────────────
const CurriculumSchema = new mongoose.Schema({
  owner_type:  { type: String, enum: ['student','faculty'], required: true },
  owner_id:    { type: String, required: true },
  code:        String,
  description: String,
  lec:         Number,
  lab:         Number,
  units:       Number,
  prereq:      String,
  status:      String,
  assigned_to: String,
}, { timestamps: true })

// ── Lesson ───────────────────────────────────────────────────
const LessonSchema = new mongoose.Schema({
  owner_type: { type: String, enum: ['student','faculty'], required: true },
  owner_id:   { type: String, required: true },
  subject:    String,
  title:      { type: String, required: true },
  type:       { type: String, enum: ['Lecture','Lab'] },
  date:       String,
  status:     { type: String, enum: ['Published','Draft'], default: 'Published' },
}, { timestamps: true })

// ── Event ────────────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  owner_type: { type: String, enum: ['student','faculty','all'], required: true },
  owner_id:   { type: String, default: null },
  date:       String,
  title:      { type: String, required: true },
  location:   String,
  type:       { type: String, enum: ['Academic','Sports','Ceremony','Training','Community'] },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
}, { timestamps: true })

// ── Activity Log ─────────────────────────────────────────────
const ActivityLogSchema = new mongoose.Schema({
  actor_type:  String,
  actor_id:    String,
  actor_name:  String,
  action:      String,
  target_type: String,
  target_id:   String,
  target_name: String,
  details:     mongoose.Schema.Types.Mixed,
}, { timestamps: true })

// ── Subject Material ─────────────────────────────────────────
const SubjectMaterialSchema = new mongoose.Schema({
  subject_code: String,
  section:      String,
  faculty_id:   { type: String, ref: 'Faculty' },
  title:        String,
  description:  String,
  file_url:     String,
  file_name:    String,
  file_size:    Number,
  file_type:    String,
}, { timestamps: true })

// ── Subject Submission ───────────────────────────────────────
const SubjectSubmissionSchema = new mongoose.Schema({
  subject_code: String,
  section:      String,
  student_id:   { type: String, ref: 'Student' },
  title:        String,
  description:  String,
  file_url:     String,
  file_name:    String,
  file_size:    Number,
  file_type:    String,
  status:       { type: String, enum: ['Submitted','Graded','Returned'], default: 'Submitted' },
  grade:        String,
  feedback:     String,
}, { timestamps: true })

// ── Student Profile Extensions ───────────────────────────────
const StudentAffiliationSchema = new mongoose.Schema({
  student_id:  { type: String, ref: 'Student', required: true },
  name:        String,
  type:        { type: String, enum: ['Organization','Sports','Club','Committee','Other'] },
  role:        String,
  year_joined: String,
  status:      { type: String, enum: ['Active','Inactive','Alumni'], default: 'Active' },
}, { timestamps: true })

const StudentSkillSchema = new mongoose.Schema({
  student_id: { type: String, ref: 'Student', required: true },
  name:       String,
  category:   { type: String, enum: ['Academic','Sports','Arts','Technology','Leadership','Other'] },
}, { timestamps: true })

const StudentAcademicHistorySchema = new mongoose.Schema({
  student_id:  { type: String, ref: 'Student', required: true },
  title:       String,
  institution: String,
  type:        { type: String, enum: ['Award','Honor','Previous School','Scholarship','Certificate','Other'] },
  year:        String,
  description: String,
}, { timestamps: true })

const StudentNonAcademicHistorySchema = new mongoose.Schema({
  student_id:  { type: String, ref: 'Student', required: true },
  title:       String,
  category:    { type: String, enum: ['Sports','Arts','Community','Leadership','Competition','Other'] },
  year:        String,
  description: String,
}, { timestamps: true })

const StudentViolationSchema = new mongoose.Schema({
  student_id:  { type: String, ref: 'Student', required: true },
  violation:   String,
  date:        String,
  severity:    { type: String, enum: ['Minor','Major','Serious'], default: 'Minor' },
  sanction:    String,
  status:      { type: String, enum: ['Pending','Resolved','Appealing'], default: 'Pending' },
  notes:       String,
  recorded_by: String,
}, { timestamps: true })

module.exports = {
  Admin:                      mongoose.model('Admin', AdminSchema),
  Faculty:                    mongoose.model('Faculty', FacultySchema),
  Student:                    mongoose.model('Student', StudentSchema),
  Grade:                      mongoose.model('Grade', GradeSchema),
  FacultySubject:             mongoose.model('FacultySubject', FacultySubjectSchema),
  Schedule:                   mongoose.model('Schedule', ScheduleSchema),
  Curriculum:                 mongoose.model('Curriculum', CurriculumSchema),
  Lesson:                     mongoose.model('Lesson', LessonSchema),
  Event:                      mongoose.model('Event', EventSchema),
  ActivityLog:                mongoose.model('ActivityLog', ActivityLogSchema),
  SubjectMaterial:            mongoose.model('SubjectMaterial', SubjectMaterialSchema),
  SubjectSubmission:          mongoose.model('SubjectSubmission', SubjectSubmissionSchema),
  StudentAffiliation:         mongoose.model('StudentAffiliation', StudentAffiliationSchema),
  StudentSkill:               mongoose.model('StudentSkill', StudentSkillSchema),
  StudentAcademicHistory:     mongoose.model('StudentAcademicHistory', StudentAcademicHistorySchema),
  StudentNonAcademicHistory:  mongoose.model('StudentNonAcademicHistory', StudentNonAcademicHistorySchema),
  StudentViolation:           mongoose.model('StudentViolation', StudentViolationSchema),
}
