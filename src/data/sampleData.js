// ─── Sample Database ──────────────────────────────────────────────────────────

export const students = [
  {
    id: '2021-00142', initials: 'MA', name: 'Maria Santos',
    dateOfBirth: 'March 14, 2002', email: 'maria.santos@student.edu.ph',
    phone: '09171234567', address: 'Brgy. Bagong Silang, Caloocan City', gender: 'Female',
    program: 'BS Computer Science', yearLevel: '3rd Year', section: 'BSCS 3-A',
    semester: '1st Semester, A.Y. 2024–2025', adviser: 'Dr. Jose Reyes',
    grades: [
      { code: 'CS301', description: 'Data Structures & Algorithms', units: 3, midterm: 88, finals: 91, finalGrade: 1.5,  remarks: 'Passed' },
      { code: 'CS302', description: 'Object-Oriented Programming',  units: 3, midterm: 92, finals: 94, finalGrade: 1.25, remarks: 'Passed' },
      { code: 'CS303', description: 'Database Management Systems',  units: 3, midterm: 85, finals: 87, finalGrade: 1.75, remarks: 'Passed' },
      { code: 'MATH201', description: 'Discrete Mathematics',       units: 3, midterm: 78, finals: 80, finalGrade: 2.0,  remarks: 'Passed' },
      { code: 'GE101',  description: 'Ethics & Values',             units: 3, midterm: 90, finals: 92, finalGrade: 1.5,  remarks: 'Passed' },
    ],
    schedule: [
      { code: 'CS301', description: 'Data Structures & Algorithms', section: 'BSCS 3-A', days: 'MWF', time: '7:30–8:30 AM',   room: 'CS Lab 1',  instructor: 'Dr. Jose Reyes' },
      { code: 'CS302', description: 'Object-Oriented Programming',  section: 'BSCS 3-A', days: 'TTH', time: '9:00–10:30 AM',  room: 'CS Lab 2',  instructor: 'Prof. Ana Lim' },
      { code: 'CS303', description: 'Database Management Systems',  section: 'BSCS 3-A', days: 'MWF', time: '10:30–11:30 AM', room: 'CS Lab 1',  instructor: 'Dr. Jose Reyes' },
      { code: 'MATH201', description: 'Discrete Mathematics',       section: 'BSCS 3-A', days: 'TTH', time: '1:00–2:30 PM',   room: 'Math 101',  instructor: 'Prof. R. Garcia' },
      { code: 'GE101',  description: 'Ethics & Values',             section: 'BSCS 3-A', days: 'F',   time: '2:30–5:30 PM',   room: 'Room 205',  instructor: 'Dr. M. Cruz' },
    ],
    curriculum: [
      { code: 'CS101', description: 'Introduction to Computing',    lec: 2, lab: 3, units: 3, prereq: 'None',   status: 'Completed' },
      { code: 'CS102', description: 'Computer Programming 1',       lec: 2, lab: 3, units: 3, prereq: 'CS101',  status: 'Completed' },
      { code: 'CS201', description: 'Data Structures & Algorithms', lec: 2, lab: 3, units: 3, prereq: 'CS102',  status: 'Completed' },
      { code: 'CS202', description: 'Object-Oriented Programming',  lec: 2, lab: 3, units: 3, prereq: 'CS102',  status: 'Completed' },
      { code: 'CS301', description: 'Database Management Systems',  lec: 2, lab: 3, units: 3, prereq: 'CS201',  status: 'In Progress' },
      { code: 'CS302', description: 'Operating Systems',            lec: 3, lab: 0, units: 3, prereq: 'CS201',  status: 'In Progress' },
      { code: 'CS401', description: 'Machine Learning',             lec: 3, lab: 0, units: 3, prereq: 'CS302',  status: 'Not Yet Taken' },
      { code: 'CS402', description: 'Capstone Project',             lec: 0, lab: 6, units: 3, prereq: 'CS401',  status: 'Not Yet Taken' },
    ],
    lessons: [
      { subject: 'CS301', title: 'Introduction to Linked Lists',   type: 'Lecture', date: 'Mar 3, 2025',  status: 'Published' },
      { subject: 'CS301', title: 'Binary Trees and Traversal',     type: 'Lecture', date: 'Mar 6, 2025',  status: 'Published' },
      { subject: 'CS302', title: 'Encapsulation & Inheritance',    type: 'Lecture', date: 'Mar 4, 2025',  status: 'Published' },
      { subject: 'CS302', title: 'Polymorphism Lab Exercise',      type: 'Lab',     date: 'Mar 7, 2025',  status: 'Published' },
      { subject: 'CS303', title: 'ER Diagrams & Normalization',    type: 'Lecture', date: 'Mar 5, 2025',  status: 'Published' },
    ],
    events: [
      { date: 'Mar 15, 2025', title: 'CS Department Seminar',       location: 'AVR Building A', type: 'Academic'  },
      { date: 'Mar 20, 2025', title: 'Intramural Sports Week',       location: 'University Gym', type: 'Sports'    },
      { date: 'Apr 2, 2025',  title: 'Mid-Year Recognition Day',     location: 'Main Auditorium', type: 'Ceremony' },
      { date: 'Apr 10, 2025', title: 'Research Symposium',           location: 'CS Building',    type: 'Academic'  },
      { date: 'Apr 22, 2025', title: 'Earth Day Campus Clean-Up',    location: 'Whole Campus',   type: 'Community' },
    ]
  },
  {
    id: '2022-00315', initials: 'JC', name: 'Juan Cruz',
    dateOfBirth: 'July 5, 2003', email: 'juan.cruz@student.edu.ph',
    phone: '09281234567', address: 'Brgy. Sta. Cruz, Manila', gender: 'Male',
    program: 'BS Information Technology', yearLevel: '2nd Year', section: 'BSIT 2-B',
    semester: '1st Semester, A.Y. 2024–2025', adviser: 'Prof. Ana Lim',
    grades: [
      { code: 'IT201', description: 'Web Development',           units: 3, midterm: 83, finals: 86, finalGrade: 1.75, remarks: 'Passed' },
      { code: 'IT202', description: 'Networking Fundamentals',   units: 3, midterm: 79, finals: 81, finalGrade: 2.0,  remarks: 'Passed' },
      { code: 'IT203', description: 'Systems Analysis & Design', units: 3, midterm: 88, finals: 90, finalGrade: 1.5,  remarks: 'Passed' },
    ],
    schedule: [
      { code: 'IT201', description: 'Web Development',           section: 'BSIT 2-B', days: 'MWF', time: '8:30–9:30 AM',  room: 'IT Lab 3', instructor: 'Prof. Ana Lim' },
      { code: 'IT202', description: 'Networking Fundamentals',   section: 'BSIT 2-B', days: 'TTH', time: '10:30–12:00 PM', room: 'Net Lab 1', instructor: 'Engr. R. Santos' },
      { code: 'IT203', description: 'Systems Analysis & Design', section: 'BSIT 2-B', days: 'MWF', time: '1:00–2:00 PM',   room: 'Room 302', instructor: 'Prof. Ana Lim' },
    ],
    curriculum: [
      { code: 'IT101', description: 'IT Fundamentals',           lec: 2, lab: 3, units: 3, prereq: 'None',  status: 'Completed' },
      { code: 'IT102', description: 'Programming Basics',        lec: 2, lab: 3, units: 3, prereq: 'IT101', status: 'Completed' },
      { code: 'IT201', description: 'Web Development',           lec: 2, lab: 3, units: 3, prereq: 'IT102', status: 'In Progress' },
      { code: 'IT202', description: 'Networking Fundamentals',   lec: 2, lab: 3, units: 3, prereq: 'IT101', status: 'In Progress' },
      { code: 'IT301', description: 'Software Engineering',      lec: 3, lab: 0, units: 3, prereq: 'IT201', status: 'Not Yet Taken' },
    ],
    lessons: [
      { subject: 'IT201', title: 'HTML & CSS Fundamentals',      type: 'Lecture', date: 'Mar 3, 2025', status: 'Published' },
      { subject: 'IT201', title: 'JavaScript Basics Lab',        type: 'Lab',     date: 'Mar 5, 2025', status: 'Published' },
      { subject: 'IT202', title: 'OSI Model Overview',           type: 'Lecture', date: 'Mar 4, 2025', status: 'Published' },
    ],
    events: [
      { date: 'Mar 15, 2025', title: 'IT Department Tech Talk',    location: 'IT Building Room 1', type: 'Academic' },
      { date: 'Mar 20, 2025', title: 'Intramural Sports Week',     location: 'University Gym',     type: 'Sports'   },
      { date: 'Apr 2,  2025', title: 'Mid-Year Recognition Day',   location: 'Main Auditorium',    type: 'Ceremony' },
    ]
  },
  {
    id: '2023-00478', initials: 'AC', name: 'Angela Dela Cruz',
    dateOfBirth: 'November 20, 2004', email: 'angela.dc@student.edu.ph',
    phone: '09391234567', address: 'Brgy. Poblacion, Makati City', gender: 'Female',
    program: 'BS Computer Engineering', yearLevel: '1st Year', section: 'BSCpE 1-C',
    semester: '1st Semester, A.Y. 2024–2025', adviser: 'Engr. Marco Santos',
    grades: [
      { code: 'ENG101',  description: 'Engineering Drawing', units: 3, midterm: 91, finals: 93, finalGrade: 1.25, remarks: 'Passed' },
      { code: 'MATH101', description: 'Calculus I',          units: 4, midterm: 87, finals: 89, finalGrade: 1.5,  remarks: 'Passed' },
    ],
    schedule: [
      { code: 'ENG101',  description: 'Engineering Drawing', section: 'BSCpE 1-C', days: 'TTH', time: '7:30–9:00 AM',   room: 'Eng Room 2', instructor: 'Engr. Marco Santos' },
      { code: 'MATH101', description: 'Calculus I',          section: 'BSCpE 1-C', days: 'MWF', time: '9:00–10:00 AM',  room: 'Math 102',   instructor: 'Dr. L. Bautista' },
    ],
    curriculum: [
      { code: 'ENG101',  description: 'Engineering Drawing', lec: 2, lab: 3, units: 3, prereq: 'None', status: 'In Progress' },
      { code: 'MATH101', description: 'Calculus I',          lec: 3, lab: 3, units: 4, prereq: 'None', status: 'In Progress' },
      { code: 'CPE101',  description: 'Digital Logic Design', lec: 2, lab: 3, units: 3, prereq: 'None', status: 'Not Yet Taken' },
    ],
    lessons: [
      { subject: 'ENG101',  title: 'Orthographic Projection',  type: 'Lecture', date: 'Mar 4, 2025', status: 'Published' },
      { subject: 'MATH101', title: 'Limits and Continuity',    type: 'Lecture', date: 'Mar 3, 2025', status: 'Published' },
    ],
    events: [
      { date: 'Mar 20, 2025', title: 'Intramural Sports Week',  location: 'University Gym',  type: 'Sports'   },
      { date: 'Apr 2,  2025', title: 'Mid-Year Recognition Day', location: 'Main Auditorium', type: 'Ceremony' },
    ]
  }
]

export const faculty = [
  {
    id: 'FAC-2015-004', initials: 'JR', name: 'Dr. Jose Reyes',
    dateOfBirth: 'June 10, 1978', email: 'jose.reyes@faculty.edu.ph',
    phone: '09171112222', address: 'Brgy. Loyola Heights, Quezon City', gender: 'Male',
    department: 'Computer Science', position: 'Associate Professor',
    specialization: 'Artificial Intelligence & Machine Learning',
    yearsOfService: '9 years', education: 'Ph.D. Computer Science, UP Diliman',
    subjects: [
      { code: 'CS301', description: 'Data Structures & Algorithms', section: 'BSCS 3-A', units: 3, schedule: 'MWF 7:30–8:30 AM',   room: 'CS Lab 1', enrolled: 32 },
      { code: 'CS401', description: 'Machine Learning',             section: 'BSCS 4-A', units: 3, schedule: 'TTH 9:00–10:30 AM',  room: 'CS Lab 2', enrolled: 28 },
      { code: 'CS402', description: 'Artificial Intelligence',      section: 'BSCS 4-B', units: 3, schedule: 'MWF 10:30–11:30 AM', room: 'CS Lab 1', enrolled: 30 },
    ],
    schedule: [
      { code: 'CS301', description: 'Data Structures & Algorithms', section: 'BSCS 3-A', days: 'MWF', time: '7:30–8:30 AM',   room: 'CS Lab 1', enrolled: 32 },
      { code: 'CS401', description: 'Machine Learning',             section: 'BSCS 4-A', days: 'TTH', time: '9:00–10:30 AM',  room: 'CS Lab 2', enrolled: 28 },
      { code: 'CS402', description: 'Artificial Intelligence',      section: 'BSCS 4-B', days: 'MWF', time: '10:30–11:30 AM', room: 'CS Lab 1', enrolled: 30 },
    ],
    curriculum: [
      { code: 'CS301', description: 'Data Structures & Algorithms', lec: 2, lab: 3, units: 3, prereq: 'CS201', assignedTo: 'BSCS 3-A' },
      { code: 'CS401', description: 'Machine Learning',             lec: 3, lab: 0, units: 3, prereq: 'CS302', assignedTo: 'BSCS 4-A' },
      { code: 'CS402', description: 'Artificial Intelligence',      lec: 3, lab: 0, units: 3, prereq: 'CS401', assignedTo: 'BSCS 4-B' },
    ],
    lessons: [
      { subject: 'CS301', title: 'Introduction to Linked Lists',    type: 'Lecture', date: 'Mar 3, 2025',  status: 'Published' },
      { subject: 'CS301', title: 'Binary Trees and Traversal',      type: 'Lecture', date: 'Mar 6, 2025',  status: 'Published' },
      { subject: 'CS401', title: 'Supervised Learning Overview',    type: 'Lecture', date: 'Mar 4, 2025',  status: 'Published' },
      { subject: 'CS401', title: 'Linear Regression Lab',           type: 'Lab',     date: 'Mar 6, 2025',  status: 'Published' },
      { subject: 'CS402', title: 'Search Algorithms',               type: 'Lecture', date: 'Mar 5, 2025',  status: 'Draft'     },
    ],
    events: [
      { date: 'Mar 15, 2025', title: 'CS Department Seminar',       location: 'AVR Building A',  type: 'Academic'  },
      { date: 'Mar 28, 2025', title: 'Faculty Development Training', location: 'Conference Room', type: 'Training'  },
      { date: 'Apr 2,  2025', title: 'Mid-Year Recognition Day',     location: 'Main Auditorium', type: 'Ceremony'  },
      { date: 'Apr 10, 2025', title: 'Research Symposium',           location: 'CS Building',     type: 'Academic'  },
    ]
  },
  {
    id: 'FAC-2018-011', initials: 'AL', name: 'Prof. Ana Lim',
    dateOfBirth: 'February 22, 1985', email: 'ana.lim@faculty.edu.ph',
    phone: '09282223333', address: 'Brgy. Pinyahan, Quezon City', gender: 'Female',
    department: 'Information Technology', position: 'Assistant Professor',
    specialization: 'Web Technologies & Software Engineering',
    yearsOfService: '6 years', education: 'M.S. Information Technology, DLSU',
    subjects: [
      { code: 'IT201', description: 'Web Development',        section: 'BSIT 2-B', units: 3, schedule: 'MWF 8:30–9:30 AM',  room: 'IT Lab 3', enrolled: 35 },
      { code: 'IT301', description: 'Software Engineering',   section: 'BSIT 3-A', units: 3, schedule: 'TTH 1:00–2:30 PM',  room: 'IT Lab 1', enrolled: 30 },
      { code: 'IT302', description: 'Mobile App Development', section: 'BSIT 3-B', units: 3, schedule: 'MWF 2:30–3:30 PM',  room: 'IT Lab 2', enrolled: 27 },
    ],
    schedule: [
      { code: 'IT201', description: 'Web Development',        section: 'BSIT 2-B', days: 'MWF', time: '8:30–9:30 AM',  room: 'IT Lab 3', enrolled: 35 },
      { code: 'IT301', description: 'Software Engineering',   section: 'BSIT 3-A', days: 'TTH', time: '1:00–2:30 PM',  room: 'IT Lab 1', enrolled: 30 },
      { code: 'IT302', description: 'Mobile App Development', section: 'BSIT 3-B', days: 'MWF', time: '2:30–3:30 PM',  room: 'IT Lab 2', enrolled: 27 },
    ],
    curriculum: [
      { code: 'IT201', description: 'Web Development',        lec: 2, lab: 3, units: 3, prereq: 'IT102', assignedTo: 'BSIT 2-B' },
      { code: 'IT301', description: 'Software Engineering',   lec: 3, lab: 0, units: 3, prereq: 'IT201', assignedTo: 'BSIT 3-A' },
      { code: 'IT302', description: 'Mobile App Development', lec: 2, lab: 3, units: 3, prereq: 'IT201', assignedTo: 'BSIT 3-B' },
    ],
    lessons: [
      { subject: 'IT201', title: 'HTML & CSS Fundamentals',   type: 'Lecture', date: 'Mar 3, 2025', status: 'Published' },
      { subject: 'IT201', title: 'JavaScript Basics',         type: 'Lab',     date: 'Mar 5, 2025', status: 'Published' },
      { subject: 'IT301', title: 'Agile & Scrum Overview',    type: 'Lecture', date: 'Mar 4, 2025', status: 'Published' },
      { subject: 'IT302', title: 'Flutter Introduction',      type: 'Lecture', date: 'Mar 6, 2025', status: 'Draft'     },
    ],
    events: [
      { date: 'Mar 15, 2025', title: 'IT Department Tech Talk', location: 'IT Building Room 1', type: 'Academic' },
      { date: 'Mar 28, 2025', title: 'Faculty Development Training', location: 'Conference Room', type: 'Training' },
      { date: 'Apr 2,  2025', title: 'Mid-Year Recognition Day', location: 'Main Auditorium',  type: 'Ceremony' },
    ]
  },
  {
    id: 'FAC-2010-002', initials: 'MS', name: 'Engr. Marco Santos',
    dateOfBirth: 'September 3, 1975', email: 'marco.santos@faculty.edu.ph',
    phone: '09393334444', address: 'Brgy. Kapitolyo, Pasig City', gender: 'Male',
    department: 'Computer Engineering', position: 'Full Professor',
    specialization: 'Embedded Systems & IoT',
    yearsOfService: '14 years', education: 'Ph.D. Computer Engineering, ADMU',
    subjects: [
      { code: 'ENG101', description: 'Engineering Drawing',     section: 'BSCpE 1-C', units: 3, schedule: 'TTH 7:30–9:00 AM',      room: 'Eng Room 2', enrolled: 38 },
      { code: 'CPE301', description: 'Microprocessor Systems',  section: 'BSCpE 3-A', units: 3, schedule: 'MWF 11:30 AM–12:30 PM', room: 'Eng Lab 1',  enrolled: 25 },
      { code: 'CPE401', description: 'Embedded Systems Design', section: 'BSCpE 4-A', units: 3, schedule: 'TTH 2:30–4:00 PM',      room: 'Eng Lab 2',  enrolled: 22 },
    ],
    schedule: [
      { code: 'ENG101', description: 'Engineering Drawing',     section: 'BSCpE 1-C', days: 'TTH', time: '7:30–9:00 AM',      room: 'Eng Room 2', enrolled: 38 },
      { code: 'CPE301', description: 'Microprocessor Systems',  section: 'BSCpE 3-A', days: 'MWF', time: '11:30 AM–12:30 PM', room: 'Eng Lab 1',  enrolled: 25 },
      { code: 'CPE401', description: 'Embedded Systems Design', section: 'BSCpE 4-A', days: 'TTH', time: '2:30–4:00 PM',      room: 'Eng Lab 2',  enrolled: 22 },
    ],
    curriculum: [
      { code: 'ENG101', description: 'Engineering Drawing',     lec: 2, lab: 3, units: 3, prereq: 'None',   assignedTo: 'BSCpE 1-C' },
      { code: 'CPE301', description: 'Microprocessor Systems',  lec: 2, lab: 3, units: 3, prereq: 'CPE201', assignedTo: 'BSCpE 3-A' },
      { code: 'CPE401', description: 'Embedded Systems Design', lec: 2, lab: 3, units: 3, prereq: 'CPE301', assignedTo: 'BSCpE 4-A' },
    ],
    lessons: [
      { subject: 'ENG101', title: 'Orthographic Projection',      type: 'Lecture', date: 'Mar 4, 2025', status: 'Published' },
      { subject: 'CPE301', title: 'Intel 8086 Architecture',      type: 'Lecture', date: 'Mar 3, 2025', status: 'Published' },
      { subject: 'CPE401', title: 'Arduino & GPIO Introduction',  type: 'Lab',     date: 'Mar 5, 2025', status: 'Published' },
      { subject: 'CPE401', title: 'Sensor Integration Lab',       type: 'Lab',     date: 'Mar 7, 2025', status: 'Draft'     },
    ],
    events: [
      { date: 'Mar 20, 2025', title: 'Engineering Week Exhibit', location: 'Engineering Building', type: 'Academic' },
      { date: 'Mar 28, 2025', title: 'Faculty Development Training', location: 'Conference Room', type: 'Training' },
      { date: 'Apr 2,  2025', title: 'Mid-Year Recognition Day',  location: 'Main Auditorium',    type: 'Ceremony' },
    ]
  }
]

export const defaultStudent = students[0]
export const defaultFaculty = faculty[0]
