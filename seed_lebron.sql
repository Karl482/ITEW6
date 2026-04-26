-- ============================================================
--  Dr. Lebron James — Faculty + Subjects + 100 Students
--  Run this AFTER seed_students.sql
--  Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Faculty record ───────────────────────────────────────────
INSERT INTO faculty (id, initials, name, date_of_birth, email, phone, address, gender, department, position, specialization, years_of_service, education) VALUES
('FAC-2005-001','LJ','Dr. Lebron James','December 30, 1984','lebron.james@faculty.edu.ph','09171110001','Brgy. Akron, Quezon City','Male','Computer Science','Full Professor','Software Engineering & Distributed Systems','19 years','Ph.D. Computer Science, MIT');

-- ── Faculty Subjects (sections matching the 100 students) ────
INSERT INTO faculty_subjects (faculty_id, code, description, section, units, schedule, room, enrolled) VALUES
('FAC-2005-001','CS201','Object-Oriented Programming',  'BSCS 3-A', 3, 'MWF 9:30-10:30 AM',  'CS Lab 3', 20),
('FAC-2005-001','CS202','Software Design Patterns',     'BSCS 3-B', 3, 'TTH 10:30-12:00 PM', 'CS Lab 3', 10),
('FAC-2005-001','CS403','Distributed Systems',          'BSCS 4-A', 3, 'MWF 1:00-2:00 PM',   'CS Lab 4', 10),
('FAC-2005-001','IT101','Introduction to Programming',  'BSIT 2-A', 3, 'TTH 7:30-9:00 AM',   'IT Lab 4', 10),
('FAC-2005-001','IT102','Data Structures',              'BSIT 2-B', 3, 'MWF 2:30-3:30 PM',   'IT Lab 4', 10),
('FAC-2005-001','IT201','Web Systems & Technologies',   'BSIT 3-A', 3, 'TTH 1:00-2:30 PM',   'IT Lab 5', 10),
('FAC-2005-001','CPE101','Computer Programming',        'BSCpE 1-A',3, 'MWF 7:30-8:30 AM',   'Eng Lab 3',10),
('FAC-2005-001','CPE102','Digital Logic Design',        'BSCpE 1-C',3, 'TTH 9:00-10:30 AM',  'Eng Lab 3',10),
('FAC-2005-001','CPE201','Computer Architecture',       'BSCpE 3-A',3, 'MWF 11:30 AM-12:30 PM','Eng Lab 4',10);

-- ── Reassign all 100 students to Dr. Lebron James ────────────
UPDATE students SET adviser_id = 'FAC-2005-001' WHERE id IN (
  '2021-00143','2021-00144','2021-00145','2021-00146','2021-00147',
  '2021-00148','2021-00149','2021-00150','2021-00151','2021-00152',
  '2021-00153','2021-00154','2021-00155','2021-00156','2021-00157',
  '2021-00158','2021-00159','2021-00160','2021-00161','2021-00162',
  '2021-00163','2021-00164','2021-00165','2021-00166','2021-00167',
  '2021-00168','2021-00169','2021-00170','2021-00171','2021-00172',
  '2022-00316','2022-00317','2022-00318','2022-00319','2022-00320',
  '2022-00321','2022-00322','2022-00323','2022-00324','2022-00325',
  '2022-00326','2022-00327','2022-00328','2022-00329','2022-00330',
  '2022-00331','2022-00332','2022-00333','2022-00334','2022-00335',
  '2023-00479','2023-00480','2023-00481','2023-00482','2023-00483',
  '2023-00484','2023-00485','2023-00486','2023-00487','2023-00488',
  '2023-00489','2023-00490','2023-00491','2023-00492','2023-00493',
  '2023-00494','2023-00495','2023-00496','2023-00497','2023-00498',
  '2020-00201','2020-00202','2020-00203','2020-00204','2020-00205',
  '2020-00206','2020-00207','2020-00208','2020-00209','2020-00210',
  '2021-00173','2021-00174','2021-00175','2021-00176','2021-00177',
  '2021-00178','2021-00179','2021-00180','2021-00181','2021-00182',
  '2021-00183','2021-00184','2021-00185','2021-00186','2021-00187',
  '2021-00188','2021-00189','2021-00190','2021-00191','2021-00192'
);
