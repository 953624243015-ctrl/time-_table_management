import api from './axios';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  getDashboard:   ()     => api.get('/auth/dashboard'),
};

// ─── Departments ──────────────────────────────────────────────────────────────
export const departmentAPI = {
  getAll:  (params)    => api.get('/departments', { params }),
  getById: (id)        => api.get(`/departments/${id}`),
  create:  (data)      => api.post('/departments', data),
  update:  (id, data)  => api.put(`/departments/${id}`, data),
  remove:  (id)        => api.delete(`/departments/${id}`),
};

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staffAPI = {
  getAll:  (params)    => api.get('/staff', { params }),
  getById: (id)        => api.get(`/staff/${id}`),
  create:  (data)      => api.post('/staff', data),
  update:  (id, data)  => api.put(`/staff/${id}`, data),
  remove:  (id)        => api.delete(`/staff/${id}`),
};

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const subjectAPI = {
  getAll:        (params)    => api.get('/subjects', { params }),
  getById:       (id)        => api.get(`/subjects/${id}`),
  create:        (data)      => api.post('/subjects', data),
  update:        (id, data)  => api.put(`/subjects/${id}`, data),
  remove:        (id)        => api.delete(`/subjects/${id}`),
  assignFaculty: (id, data)  => api.post(`/subjects/${id}/assign-faculty`, data),
};

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classAPI = {
  getAll:  (params)    => api.get('/classes', { params }),
  getById: (id)        => api.get(`/classes/${id}`),
  create:  (data)      => api.post('/classes', data),
  update:  (id, data)  => api.put(`/classes/${id}`, data),
  remove:  (id)        => api.delete(`/classes/${id}`),
};

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const roomAPI = {
  getAll:  (params)    => api.get('/rooms', { params }),
  getById: (id)        => api.get(`/rooms/${id}`),
  create:  (data)      => api.post('/rooms', data),
  update:  (id, data)  => api.put(`/rooms/${id}`, data),
  remove:  (id)        => api.delete(`/rooms/${id}`),
};

// ─── Time Slots ───────────────────────────────────────────────────────────────
export const timeslotAPI = {
  getAll:         ()       => api.get('/timeslots'),
  getById:        (id)     => api.get(`/timeslots/${id}`),
  create:         (data)   => api.post('/timeslots', data),
  update:         (id, d)  => api.put(`/timeslots/${id}`, d),
  remove:         (id)     => api.delete(`/timeslots/${id}`),
  getSettings:    ()       => api.get('/timeslots/academic-settings'),
  updateSettings: (data)   => api.put('/timeslots/academic-settings', data),
  getAcademicYears: ()     => api.get('/timeslots/academic-years'),
  getSemesters:   (params) => api.get('/timeslots/semesters', { params }),
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const timetableAPI = {
  generate:         (data)         => api.post('/timetable/generate', data),
  list:             ()             => api.get('/timetable/list'),
  getClassTimetable:(id, params)   => api.get(`/timetable/class/${id}`, { params }),
  getStaffTimetable:(id, params)   => api.get(`/timetable/staff/${id}`, { params }),
  getRoomTimetable: (id, params)   => api.get(`/timetable/room/${id}`, { params }),
  getDeptTimetable: (id, params)   => api.get(`/timetable/department/${id}`, { params }),
  exportPDF:        (params)       => api.get('/timetable/export/pdf',   { params, responseType: 'blob' }),
  exportExcel:      (params)       => api.get('/timetable/export/excel', { params, responseType: 'blob' }),
};

// ─── Intervals / Auto-time calculation ───────────────────────────────────────
export const intervalAPI = {
  getSettings:  ()     => api.get('/intervals/settings'),
  saveSettings: (data) => api.post('/intervals/settings', data),
  calculate:    (data) => api.post('/intervals/calculate', data),
  apply:        (data) => api.post('/intervals/apply', data),
};

// ─── Conflict Detection ───────────────────────────────────────────────────────
export const conflictAPI = {
  check:  (data)   => api.post('/conflicts/check', data),
  report: (params) => api.get('/conflicts/report', { params }),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll:   (params) => api.get('/attendance', { params }),
  getToday: ()       => api.get('/attendance/today'),
  mark:     (data)   => api.post('/attendance', data),
  bulkMark: (data)   => api.post('/attendance/bulk', data),
};

// ─── Timetable History ────────────────────────────────────────────────────────
export const historyAPI = {
  list:    (params) => api.get('/history', { params }),
  getOne:  (id)     => api.get(`/history/${id}`),
  save:    (data)   => api.post('/history/save', data),
  restore: (id)     => api.post(`/history/${id}/restore`),
};

// ─── Statistics ───────────────────────────────────────────────────────────────
export const statisticsAPI = {
  workload:    (params) => api.get('/statistics/workload',    { params }),
  subjects:    (params) => api.get('/statistics/subjects',    { params }),
  departments: ()       => api.get('/statistics/departments'),
  audit:       (params) => api.get('/statistics/audit',       { params }),
  weekly:      (params) => api.get('/statistics/weekly',      { params }),
  getColors:   ()       => api.get('/statistics/colors'),
  setColor:    (data)   => api.post('/statistics/colors', data),
};
