const StudentHub = (() => {
  const student = {
    firstName: "wassim",
    lastName: "baabaa",
    id: "STU-20418",
    email: "wassim.baabaa@studenthub.edu",
    program: "Computer Science, BSc",
    year: "Year 3",
    campus: "North Campus",
    advisor: "Dr. Elena Ruiz",
    phone: "+216 22222222",
    enrolled: "September 2024",
    credits: 84,
    creditsRequired: 120,
  };

  const courses = [
    {
      id: "cs301",
      code: "CS 301",
      name: "Intelligence Artificielle",
      instructor: "Dr. Boudour Ammar",
      credits: 4,
      progress: 72,
      color: "#4f46e5",
      next: "Tue 10:00 · Lecture Hall B",
    },
    {
      id: "cs320",
      code: "CS 320",
      name: "Langage de programmation evolue BI",
      instructor: "Prof. Nahla Fendri",
      credits: 3,
      progress: 65,
      color: "#0d9488",
      next: "Wed 13:00 · Lab 2",
    },
    {
      id: "math210",
      code: "MATH 210",
      name: "Linear Algebra",
      instructor: "Dr. Henrik Berg",
      credits: 4,
      progress: 80,
      color: "#d97706",
      next: "Mon 09:00 · Room 114",
    },
    {
      id: "eng220",
      code: "ENG 220",
      name: "Technical Writing",
      instructor: "Prof. Sarah Kim",
      credits: 3,
      progress: 58,
      color: "#db2777",
      next: "Thu 15:00 · Seminar 4",
    },
    {
      id: "cs340",
      code: "CS 340",
      name: "Human-Computer Interaction",
      instructor: "Dr. Lila Santos",
      credits: 3,
      progress: 70,
      color: "#7c3aed",
      next: "Fri 11:00 · Studio A",
    },
    {
      id: "stat240",
      code: "STAT 240",
      name: "Probability & Stats",
      instructor: "Prof. Omar Haddad",
      credits: 3,
      progress: 61,
      color: "#0284c7",
      next: "Tue 14:00 · Room 220",
    },
  ];

  const assignments = [
    {
      id: "a1",
      title: "Dijkstra lab report",
      course: "CS 301",
      due: "2026-09-28",
      status: "in-progress",
      type: "Lab",
    },
    {
      id: "a2",
      title: "ER diagram for campus library",
      course: "CS 320",
      due: "2026-09-26",
      status: "due-soon",
      type: "Project",
    },
    {
      id: "a3",
      title: "Eigenvalues problem set",
      course: "MATH 210",
      due: "2026-10-02",
      status: "upcoming",
      type: "Homework",
    },
    {
      id: "a4",
      title: "Usability test protocol",
      course: "CS 340",
      due: "2026-09-24",
      status: "overdue",
      type: "Report",
    },
    {
      id: "a5",
      title: "API documentation draft",
      course: "ENG 220",
      due: "2026-10-05",
      status: "upcoming",
      type: "Essay",
    },
    {
      id: "a6",
      title: "Hypothesis testing worksheet",
      course: "STAT 240",
      due: "2026-09-30",
      status: "in-progress",
      type: "Homework",
    },
    {
      id: "a7",
      title: "SQL query challenge",
      course: "CS 320",
      due: "2026-10-08",
      status: "upcoming",
      type: "Lab",
    },
    {
      id: "a8",
      title: "Midterm review notes",
      course: "CS 301",
      due: "2026-10-12",
      status: "upcoming",
      type: "Exam prep",
    },
  ];

  const grades = [
    { course: "CS 301", item: "Quiz 1", weight: 10, score: 88 },
    { course: "CS 301", item: "Midterm", weight: 25, score: 91 },
    { course: "CS 301", item: "Lab 3", weight: 15, score: 84 },
    { course: "CS 320", item: "Project 1", weight: 20, score: 93 },
    { course: "CS 320", item: "Quiz 2", weight: 10, score: 79 },
    { course: "MATH 210", item: "Problem set 4", weight: 15, score: 95 },
    { course: "MATH 210", item: "Midterm", weight: 30, score: 87 },
    { course: "ENG 220", item: "Memo assignment", weight: 20, score: 90 },
    { course: "CS 340", item: "Persona study", weight: 20, score: 86 },
    { course: "STAT 240", item: "Lab 2", weight: 15, score: 82 },
    { course: "STAT 240", item: "Quiz 1", weight: 10, score: 76 },
  ];

  const schedule = [
    { day: "Mon", start: 9, end: 11, course: "MATH 210", room: "Room 114", title: "Linear Algebra" },
    { day: "Mon", start: 13, end: 15, course: "CS 320", room: "Lab 2", title: "Databases lab" },
    { day: "Tue", start: 10, end: 12, course: "CS 301", room: "Hall B", title: "Algorithms" },
    { day: "Tue", start: 14, end: 16, course: "STAT 240", room: "Room 220", title: "Probability" },
    { day: "Wed", start: 9, end: 10, course: "ENG 220", room: "Seminar 4", title: "Writing workshop" },
    { day: "Wed", start: 13, end: 15, course: "CS 320", room: "Lab 2", title: "Databases" },
    { day: "Thu", start: 11, end: 13, course: "CS 340", room: "Studio A", title: "HCI studio" },
    { day: "Thu", start: 15, end: 17, course: "ENG 220", room: "Seminar 4", title: "Technical Writing" },
    { day: "Fri", start: 10, end: 12, course: "CS 301", room: "Hall B", title: "Algorithms recitation" },
    { day: "Fri", start: 13, end: 15, course: "MATH 210", room: "Room 114", title: "Problem session" },
  ];

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return { student, courses, assignments, grades, schedule, hours, days };
})();
