-- ============================================================
--  AcademicWeb — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DROP (clean slate) ──────────────────────────────────────
DROP TABLE IF EXISTS activity_logs   CASCADE;
DROP TABLE IF EXISTS events          CASCADE;
DROP TABLE IF EXISTS lessons         CASCADE;
DROP TABLE IF EXISTS curriculum      CASCADE;
DROP TABLE IF EXISTS schedules       CASCADE;
DROP TABLE IF EXISTS grades          CASCADE;
DROP TABLE IF EXISTS faculty_subjects CASCADE;
DROP TABLE IF EXISTS students        CASCADE;
DROP TABLE IF EXISTS faculty         CASCADE;
DROP TABLE IF EXISTS admins          CASCADE;

-- ============================================================
--  admins
-- ============================================================
CREATE TABLE admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  faculty
-- ============================================================
CREATE TABLE faculty (
  id               TEXT PRIMARY KEY,              -- e.g. FAC-2015-004
  initials         TEXT NOT NULL,
  name             TEXT NOT NULL,
  date_of_birth    TEXT,
  email            TEXT UNIQUE NOT NULL,
  phone            TEXT,
  address          TEXT,
  gender           TEXT,
  department       TEXT NOT NULL,
  position         TEXT NOT NULL,
  specialization   TEXT,
  years_of_service TEXT,
  education        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  students
-- ============================================================
CREATE TABLE students (
  id            TEXT PRIMARY KEY,              -- e.g. 2021-00142
  initials      TEXT NOT NULL,
  name          TEXT NOT NULL,
  date_of_birth TEXT,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  address       TEXT,
  gender        TEXT,
  program       TEXT NOT NULL,
  year_level    TEXT NOT NULL,
  section       TEXT NOT NULL,
  semester      TEXT NOT NULL,
  adviser_id    TEXT REFERENCES faculty(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  grades
-- ============================================================
CREATE TABLE grades (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  faculty_id  TEXT REFERENCES faculty(id) ON DELETE SET NULL,
  code        TEXT NOT NULL,
  description TEXT NOT NULL,
  units       INT  NOT NULL DEFAULT 3,
  midterm     INT,
  finals      INT,
  final_grade NUMERIC(4,2),
  remarks     TEXT DEFAULT 'Passed',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  faculty_subjects
-- ============================================================
CREATE TABLE faculty_subjects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  description TEXT NOT NULL,
  section     TEXT NOT NULL,
  units       INT  NOT NULL DEFAULT 3,
  schedule    TEXT,
  room        TEXT,
  enrolled    INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  schedules  (polymorphic: student or faculty)
-- ============================================================
CREATE TABLE schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('student','faculty')),
  owner_id    TEXT NOT NULL,
  code        TEXT NOT NULL,
  description TEXT NOT NULL,
  section     TEXT NOT NULL,
  days        TEXT NOT NULL,
  time        TEXT NOT NULL,
  room        TEXT NOT NULL,
  instructor  TEXT,           -- for student rows
  enrolled    INT,            -- for faculty rows
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  curriculum
-- ============================================================
CREATE TABLE curriculum (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('student','faculty')),
  owner_id    TEXT NOT NULL,
  code        TEXT NOT NULL,
  description TEXT NOT NULL,
  lec         INT  NOT NULL DEFAULT 2,
  lab         INT  NOT NULL DEFAULT 0,
  units       INT  NOT NULL DEFAULT 3,
  prereq      TEXT,
  status      TEXT,          -- student: Completed / In Progress / Not Yet Taken
  assigned_to TEXT,          -- faculty: section
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  lessons
-- ============================================================
CREATE TABLE lessons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('student','faculty')),
  owner_id    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Lecture','Lab')),
  date        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published','Draft')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  events
-- ============================================================
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('student','faculty','all')),
  owner_id    TEXT,          -- NULL means global / all users
  date        TEXT NOT NULL,
  title       TEXT NOT NULL,
  location    TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Academic','Sports','Ceremony','Training','Community')),
  created_by  UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  activity_logs
-- ============================================================
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type  TEXT NOT NULL,   -- 'admin' | 'student' | 'faculty'
  actor_id    TEXT NOT NULL,
  actor_name  TEXT NOT NULL,
  action      TEXT NOT NULL,   -- e.g. 'Created student', 'Updated grade'
  target_type TEXT,            -- e.g. 'student', 'faculty', 'event'
  target_id   TEXT,
  target_name TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  INDEXES
-- ============================================================
CREATE INDEX idx_grades_student      ON grades(student_id);
CREATE INDEX idx_schedules_owner     ON schedules(owner_type, owner_id);
CREATE INDEX idx_curriculum_owner    ON curriculum(owner_type, owner_id);
CREATE INDEX idx_lessons_owner       ON lessons(owner_type, owner_id);
CREATE INDEX idx_events_owner        ON events(owner_type, owner_id);
CREATE INDEX idx_activity_actor      ON activity_logs(actor_type, actor_id);
CREATE INDEX idx_activity_created    ON activity_logs(created_at DESC);
CREATE INDEX idx_faculty_subj_fac    ON faculty_subjects(faculty_id);

-- ============================================================
--  ROW LEVEL SECURITY
--  Disable for now (admin full access via service key)
--  Enable per-table when you add Supabase Auth roles
-- ============================================================
ALTER TABLE admins           DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty          DISABLE ROW LEVEL SECURITY;
ALTER TABLE students         DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades           DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules        DISABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum       DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons          DISABLE ROW LEVEL SECURITY;
ALTER TABLE events           DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs    DISABLE ROW LEVEL SECURITY;

-- ============================================================
--  SEED DATA — Admin
-- ============================================================
INSERT INTO admins (name, email) VALUES
  ('Super Admin', 'admin@academicweb.edu.ph');

-- ============================================================
--  SEED DATA — Faculty
-- ============================================================
INSERT INTO faculty (id, initials, name, date_of_birth, email, phone, address, gender, department, position, specialization, years_of_service, education) VALUES
('FAC-2015-004','JR','Dr. Jose Reyes','June 10, 1978','jose.reyes@faculty.edu.ph','09171112222','Brgy. Loyola Heights, Quezon City','Male','Computer Science','Associate Professor','Artificial Intelligence & Machine Learning','9 years','Ph.D. Computer Science, UP Diliman'),
('FAC-2018-011','AL','Prof. Ana Lim','February 22, 1985','ana.lim@faculty.edu.ph','09282223333','Brgy. Pinyahan, Quezon City','Female','Information Technology','Assistant Professor','Web Technologies & Software Engineering','6 years','M.S. Information Technology, DLSU'),
('FAC-2010-002','MS','Engr. Marco Santos','September 3, 1975','marco.santos@faculty.edu.ph','09393334444','Brgy. Kapitolyo, Pasig City','Male','Computer Engineering','Full Professor','Embedded Systems & IoT','14 years','Ph.D. Computer Engineering, ADMU');

-- ============================================================
--  SEED DATA — Students
-- ============================================================
INSERT INTO students (id, initials, name, date_of_birth, email, phone, address, gender, program, year_level, section, semester, adviser_id) VALUES
('2021-00142','MA','Maria Santos','March 14, 2002','maria.santos@student.edu.ph','09171234567','Brgy. Bagong Silang, Caloocan City','Female','BS Computer Science','3rd Year','BSCS 3-A','1st Semester, A.Y. 2024-2025','FAC-2015-004'),
('2022-00315','JC','Juan Cruz','July 5, 2003','juan.cruz@student.edu.ph','09281234567','Brgy. Sta. Cruz, Manila','Male','BS Information Technology','2nd Year','BSIT 2-B','1st Semester, A.Y. 2024-2025','FAC-2018-011'),
('2023-00478','AC','Angela Dela Cruz','November 20, 2004','angela.dc@student.edu.ph','09391234567','Brgy. Poblacion, Makati City','Female','BS Computer Engineering','1st Year','BSCpE 1-C','1st Semester, A.Y. 2024-2025','FAC-2010-002');

-- ============================================================
--  SEED DATA — Grades (Maria Santos)
-- ============================================================
INSERT INTO grades (student_id, code, description, units, midterm, finals, final_grade, remarks) VALUES
('2021-00142','CS301','Data Structures & Algorithms',3,88,91,1.50,'Passed'),
('2021-00142','CS302','Object-Oriented Programming',3,92,94,1.25,'Passed'),
('2021-00142','CS303','Database Management Systems',3,85,87,1.75,'Passed'),
('2021-00142','MATH201','Discrete Mathematics',3,78,80,2.00,'Passed'),
('2021-00142','GE101','Ethics & Values',3,90,92,1.50,'Passed'),
('2022-00315','IT201','Web Development',3,83,86,1.75,'Passed'),
('2022-00315','IT202','Networking Fundamentals',3,79,81,2.00,'Passed'),
('2022-00315','IT203','Systems Analysis & Design',3,88,90,1.50,'Passed'),
('2023-00478','ENG101','Engineering Drawing',3,91,93,1.25,'Passed'),
('2023-00478','MATH101','Calculus I',4,87,89,1.50,'Passed');

-- ============================================================
--  SEED DATA — Faculty Subjects
-- ============================================================
INSERT INTO faculty_subjects (faculty_id, code, description, section, units, schedule, room, enrolled) VALUES
('FAC-2015-004','CS301','Data Structures & Algorithms','BSCS 3-A',3,'MWF 7:30-8:30 AM','CS Lab 1',32),
('FAC-2015-004','CS401','Machine Learning','BSCS 4-A',3,'TTH 9:00-10:30 AM','CS Lab 2',28),
('FAC-2015-004','CS402','Artificial Intelligence','BSCS 4-B',3,'MWF 10:30-11:30 AM','CS Lab 1',30),
('FAC-2018-011','IT201','Web Development','BSIT 2-B',3,'MWF 8:30-9:30 AM','IT Lab 3',35),
('FAC-2018-011','IT301','Software Engineering','BSIT 3-A',3,'TTH 1:00-2:30 PM','IT Lab 1',30),
('FAC-2018-011','IT302','Mobile App Development','BSIT 3-B',3,'MWF 2:30-3:30 PM','IT Lab 2',27),
('FAC-2010-002','ENG101','Engineering Drawing','BSCpE 1-C',3,'TTH 7:30-9:00 AM','Eng Room 2',38),
('FAC-2010-002','CPE301','Microprocessor Systems','BSCpE 3-A',3,'MWF 11:30 AM-12:30 PM','Eng Lab 1',25),
('FAC-2010-002','CPE401','Embedded Systems Design','BSCpE 4-A',3,'TTH 2:30-4:00 PM','Eng Lab 2',22);

-- ============================================================
--  SEED DATA — Schedules (Maria + Dr. Reyes)
-- ============================================================
INSERT INTO schedules (owner_type, owner_id, code, description, section, days, time, room, instructor) VALUES
('student','2021-00142','CS301','Data Structures & Algorithms','BSCS 3-A','MWF','7:30-8:30 AM','CS Lab 1','Dr. Jose Reyes'),
('student','2021-00142','CS302','Object-Oriented Programming','BSCS 3-A','TTH','9:00-10:30 AM','CS Lab 2','Prof. Ana Lim'),
('student','2021-00142','CS303','Database Management Systems','BSCS 3-A','MWF','10:30-11:30 AM','CS Lab 1','Dr. Jose Reyes'),
('student','2021-00142','MATH201','Discrete Mathematics','BSCS 3-A','TTH','1:00-2:30 PM','Math 101','Prof. R. Garcia'),
('student','2021-00142','GE101','Ethics & Values','BSCS 3-A','F','2:30-5:30 PM','Room 205','Dr. M. Cruz');

INSERT INTO schedules (owner_type, owner_id, code, description, section, days, time, room, enrolled) VALUES
('faculty','FAC-2015-004','CS301','Data Structures & Algorithms','BSCS 3-A','MWF','7:30-8:30 AM','CS Lab 1',32),
('faculty','FAC-2015-004','CS401','Machine Learning','BSCS 4-A','TTH','9:00-10:30 AM','CS Lab 2',28),
('faculty','FAC-2015-004','CS402','Artificial Intelligence','BSCS 4-B','MWF','10:30-11:30 AM','CS Lab 1',30);

-- ============================================================
--  SEED DATA — Curriculum (Maria + Dr. Reyes)
-- ============================================================
INSERT INTO curriculum (owner_type, owner_id, code, description, lec, lab, units, prereq, status) VALUES
('student','2021-00142','CS101','Introduction to Computing',2,3,3,NULL,'Completed'),
('student','2021-00142','CS102','Computer Programming 1',2,3,3,'CS101','Completed'),
('student','2021-00142','CS201','Data Structures & Algorithms',2,3,3,'CS102','Completed'),
('student','2021-00142','CS202','Object-Oriented Programming',2,3,3,'CS102','Completed'),
('student','2021-00142','CS301','Database Management Systems',2,3,3,'CS201','In Progress'),
('student','2021-00142','CS302','Operating Systems',3,0,3,'CS201','In Progress'),
('student','2021-00142','CS401','Machine Learning',3,0,3,'CS302','Not Yet Taken'),
('student','2021-00142','CS402','Capstone Project',0,6,3,'CS401','Not Yet Taken');

INSERT INTO curriculum (owner_type, owner_id, code, description, lec, lab, units, prereq, assigned_to) VALUES
('faculty','FAC-2015-004','CS301','Data Structures & Algorithms',2,3,3,'CS201','BSCS 3-A'),
('faculty','FAC-2015-004','CS401','Machine Learning',3,0,3,'CS302','BSCS 4-A'),
('faculty','FAC-2015-004','CS402','Artificial Intelligence',3,0,3,'CS401','BSCS 4-B');

-- ============================================================
--  SEED DATA — Lessons (Maria + Dr. Reyes)
-- ============================================================
INSERT INTO lessons (owner_type, owner_id, subject, title, type, date, status) VALUES
('student','2021-00142','CS301','Introduction to Linked Lists','Lecture','Mar 3, 2025','Published'),
('student','2021-00142','CS301','Binary Trees and Traversal','Lecture','Mar 6, 2025','Published'),
('student','2021-00142','CS302','Encapsulation & Inheritance','Lecture','Mar 4, 2025','Published'),
('student','2021-00142','CS302','Polymorphism Lab Exercise','Lab','Mar 7, 2025','Published'),
('student','2021-00142','CS303','ER Diagrams & Normalization','Lecture','Mar 5, 2025','Published'),
('faculty','FAC-2015-004','CS301','Introduction to Linked Lists','Lecture','Mar 3, 2025','Published'),
('faculty','FAC-2015-004','CS301','Binary Trees and Traversal','Lecture','Mar 6, 2025','Published'),
('faculty','FAC-2015-004','CS401','Supervised Learning Overview','Lecture','Mar 4, 2025','Published'),
('faculty','FAC-2015-004','CS401','Linear Regression Lab','Lab','Mar 6, 2025','Published'),
('faculty','FAC-2015-004','CS402','Search Algorithms','Lecture','Mar 5, 2025','Draft');

-- ============================================================
--  SEED DATA — Events
-- ============================================================
INSERT INTO events (owner_type, owner_id, date, title, location, type) VALUES
('student','2021-00142','Mar 15, 2025','CS Department Seminar','AVR Building A','Academic'),
('student','2021-00142','Mar 20, 2025','Intramural Sports Week','University Gym','Sports'),
('student','2021-00142','Apr 2, 2025','Mid-Year Recognition Day','Main Auditorium','Ceremony'),
('student','2021-00142','Apr 10, 2025','Research Symposium','CS Building','Academic'),
('student','2021-00142','Apr 22, 2025','Earth Day Campus Clean-Up','Whole Campus','Community'),
('faculty','FAC-2015-004','Mar 15, 2025','CS Department Seminar','AVR Building A','Academic'),
('faculty','FAC-2015-004','Mar 28, 2025','Faculty Development Training','Conference Room','Training'),
('faculty','FAC-2015-004','Apr 2, 2025','Mid-Year Recognition Day','Main Auditorium','Ceremony'),
('faculty','FAC-2015-004','Apr 10, 2025','Research Symposium','CS Building','Academic');

-- ============================================================
--  SEED DATA — Activity Logs
-- ============================================================
INSERT INTO activity_logs (actor_type, actor_id, actor_name, action, target_type, target_id, target_name) VALUES
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Created student','student','2021-00142','Maria Santos'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Created student','student','2022-00315','Juan Cruz'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Created student','student','2023-00478','Angela Dela Cruz'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Created faculty','faculty','FAC-2015-004','Dr. Jose Reyes'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Created faculty','faculty','FAC-2018-011','Prof. Ana Lim'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Created faculty','faculty','FAC-2010-002','Engr. Marco Santos'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Added event','event',NULL,'CS Department Seminar'),
('admin','00000000-0000-0000-0000-000000000001','Super Admin','Added event','event',NULL,'Intramural Sports Week');
