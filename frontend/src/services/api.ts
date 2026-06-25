import axios from "axios";

// ✅ VITE ENV FIX (IMPORTANT)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// 🔐 REQUEST INTERCEPTOR (TOKEN)
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// 🚨 RESPONSE INTERCEPTOR (401)
// ===============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ===============================
// 🔑 AUTH SERVICE
// ===============================
export const authService = {
  login: (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    return api.post("/login/access-token", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },
};

// ===============================
// 👤 USER SERVICE
// ===============================
export const userService = {
  getUsers: () => api.get("/users/"),
  getUser: (id: number) => api.get(`/users/${id}`),
  getDirectory: () => api.get("/users/directory"),
  sendEmail: (payload: { to_email: string; subject: string; body: string }) =>
    api.post("/users/send-email", payload),
};

// ===============================
// 🎓 STUDENT SERVICE
// ===============================
export const studentService = {
  getStudents: () => api.get("/students/"),
  getStudent: (id: number) => api.get(`/students/${id}`),
  createStudent: (studentData: any) => api.post("/students/", studentData),
  updateStudent: (id: number, studentData: any) => api.put(`/students/${id}`, studentData),
  deleteStudent: (id: number) => api.delete(`/students/${id}`),
};

// ===============================
// 👨‍🏫 FACULTY SERVICE
// ===============================
export const facultyService = {
  getFaculty: () => api.get("/faculty/"),
  getFacultyMember: (id: number) => api.get(`/faculty/${id}`),
  createFaculty: (facultyData: any) => api.post("/faculty/", facultyData),
  updateFaculty: (id: number, facultyData: any) => api.put(`/faculty/${id}`, facultyData),
  deleteFaculty: (id: number) => api.delete(`/faculty/${id}`),
  makeHod: (id: number) => api.post(`/faculty/${id}/make-hod`),
};

// ===============================
// 💰 FEES SERVICE
// ===============================
export const feeService = {
  getStructures: () => api.get("/fees/structures"),
  getPayments: (studentId: number) =>
    api.get(`/fees/payments/${studentId}`),
  createPayment: (paymentData: any) =>
    api.post("/fees/payments", paymentData),
  paySalaries: (month: string, year: number) =>
    api.post("/fees/salaries/pay", { month, year }),
  getSalaries: () => api.get("/fees/salaries"),
  getMySalaries: () => api.get("/fees/salaries/me"),
};

// ===============================
// 📝 EXAM SERVICE
// ===============================
export const examService = {
  getSchedules: () => api.get("/exams/schedules"),
  getResults: (studentId: number) =>
    api.get(`/exams/results/${studentId}`),
};

// ===============================
// 📚 ASSIGNMENT SERVICE
// ===============================
export const assignmentService = {
  getAssignments: () => api.get("/assignments/"),
  getSubmissions: (assignmentId: number) =>
    api.get(`/assignments/${assignmentId}/submissions`),
  submitAssignment: (assignmentId: number, studentId: number, filePath: string) =>
    api.post(`/assignments/${assignmentId}/submit?student_id=${studentId}&file_path=${encodeURIComponent(filePath)}`),
};

// ===============================
// 📖 LIBRARY SERVICE
// ===============================
export const libraryService = {
  getBooks: () => api.get("/library/books"),
  getIssuance: (studentId: number) =>
    api.get(`/library/issuance/${studentId}`),
  getIssuances: () => api.get("/library/issuances"),
  issueBook: (studentId?: number, facultyId?: number, bookId?: number) => {
    let query = `book_id=${bookId}`;
    if (studentId) query += `&student_id=${studentId}`;
    if (facultyId) query += `&faculty_id=${facultyId}`;
    return api.post(`/library/issue?${query}`);
  },
  addBook: (bookData: any) => api.post("/library/books", bookData),
  updateIssuanceStatus: (issuanceId: number, status: string) =>
    api.put(`/library/issuance/${issuanceId}/status`, { status }),
};

// ===============================
// 📅 HOLIDAY SERVICE
// ===============================
export const holidayService = {
  getHolidays: () => api.get("/holidays/"),
};

// ===============================
// 🏫 MASTER DATA SERVICE
// ===============================
export const masterDataService = {
  getDepartments: () => api.get("/departments"),
  createDepartment: (deptData: any) => api.post("/departments", deptData),
  getCourses: () => api.get("/courses"),
  createCourse: (courseData: any) => api.post("/courses", courseData),
  getSubjects: () => api.get("/subjects"),
};

// ===============================
// 🌴 LEAVE SERVICE
// ===============================
export const leaveService = {
  applyLeave: (leaveData: { leave_type: string; start_date: string; end_date: string; reason: string }) =>
    api.post("/leaves/apply", leaveData),
  getMyLeaves: () => api.get("/leaves/my"),
  getPendingLeaves: () => api.get("/leaves/pending"),
  approveLeave: (leaveId: number) => api.put(`/leaves/${leaveId}/approve`),
  rejectLeave: (leaveId: number) => api.put(`/leaves/${leaveId}/reject`),
};

// ===============================
// 📅 ATTENDANCE SERVICE
// ===============================
export const attendanceService = {
  markStudentAttendance: (payload: { subject_id: number; date: string; students: { student_id: number; status: string }[] }) =>
    api.post("/attendance/student", payload),
  getMyAttendance: () => api.get("/attendance/student/my"),
  markMyStaffAttendance: (payload: { date: string }) =>
    api.post("/attendance/staff/mark", payload),
  getMyStaffAttendance: () => api.get("/attendance/staff/my"),
  getPendingStaffAttendance: () => api.get("/attendance/staff/pending"),
  approveStaffAttendance: (id: number) => api.put(`/attendance/staff/${id}/approve`),
  rejectStaffAttendance: (id: number) => api.put(`/attendance/staff/${id}/reject`),
};