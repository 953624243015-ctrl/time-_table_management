-- ============================================================
-- AI College Timetable Management System
-- Complete MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS timetable_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE timetable_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','staff') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  hod_name VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB;

-- ============================================================
-- ACADEMIC YEARS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_label VARCHAR(20) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEMESTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS semesters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  academic_year_id INT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  INDEX idx_academic_year (academic_year_id)
) ENGINE=InnoDB;

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  designation VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20),
  max_hours_per_week INT DEFAULT 20,
  status ENUM('active','inactive','on_leave') DEFAULT 'active',
  user_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_department (department_id),
  INDEX idx_staff_id (staff_id)
) ENGINE=InnoDB;

-- ============================================================
-- STAFF AVAILABILITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE KEY uq_staff_day (staff_id, day_of_week),
  INDEX idx_staff (staff_id)
) ENGINE=InnoDB;

-- ============================================================
-- ROOMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  room_type ENUM('classroom','computer_lab','electronics_lab','seminar_hall') NOT NULL,
  capacity INT DEFAULT 60,
  building VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_type (room_type)
) ENGINE=InnoDB;

-- ============================================================
-- CLASSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(5) NOT NULL,
  strength INT DEFAULT 60,
  academic_year_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  UNIQUE KEY uq_class (department_id, year, semester, section),
  INDEX idx_dept_sem (department_id, semester)
) ENGINE=InnoDB;

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(20) NOT NULL UNIQUE,
  subject_name VARCHAR(150) NOT NULL,
  department_id INT NOT NULL,
  semester INT NOT NULL,
  hours_per_week INT DEFAULT 3,
  subject_type ENUM('theory','lab') DEFAULT 'theory',
  credits INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  INDEX idx_dept_sem (department_id, semester),
  INDEX idx_subject_code (subject_code)
) ENGINE=InnoDB;

-- ============================================================
-- SUBJECT FACULTY ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subject_faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  staff_id INT NOT NULL,
  class_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  UNIQUE KEY uq_subj_staff_class (subject_id, staff_id, class_id),
  INDEX idx_subject (subject_id),
  INDEX idx_staff (staff_id)
) ENGINE=InnoDB;

-- ============================================================
-- TIME SLOTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_name VARCHAR(30) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  period_number INT NOT NULL,
  is_break TINYINT(1) DEFAULT 0,
  break_type ENUM('lunch','short') DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_period (period_number),
  INDEX idx_period (period_number)
) ENGINE=InnoDB;

-- ============================================================
-- ACADEMIC SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TIMETABLE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  staff_id INT NOT NULL,
  room_id INT NOT NULL,
  time_slot_id INT NOT NULL,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  academic_year_id INT,
  semester_id INT,
  generation INT DEFAULT 1,
  fitness_score DECIMAL(5,2) DEFAULT 0.00,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
  UNIQUE KEY uq_timetable (class_id, time_slot_id, day_of_week, academic_year_id),
  INDEX idx_class (class_id),
  INDEX idx_staff (staff_id),
  INDEX idx_room (room_id),
  INDEX idx_day_slot (day_of_week, time_slot_id)
) ENGINE=InnoDB;

-- ============================================================
-- STAFF WORKLOAD TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_workload (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  academic_year_id INT,
  total_hours INT DEFAULT 0,
  assigned_hours INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  UNIQUE KEY uq_staff_year (staff_id, academic_year_id)
) ENGINE=InnoDB;

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- TIMETABLE GENERATION LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable_generation_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT,
  semester INT,
  academic_year_id INT,
  generation_count INT DEFAULT 0,
  fitness_score DECIMAL(5,2) DEFAULT 0.00,
  conflict_count INT DEFAULT 0,
  status ENUM('running','completed','failed') DEFAULT 'running',
  generated_by INT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin User (password: Admin@123)
-- Password: Admin@123
-- Hash generated with: node src/utils/generateHash.js
-- Then run: UPDATE users SET password='<hash>' WHERE email='admin@college.edu';
-- OR just use the backend login endpoint after running the seed (password will be set via the hash below)
-- bcrypt hash for 'Admin@123' with 12 rounds:
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@college.edu', '$2b$12$K9RJK.r1JdO/9n5VRzWVIeBlFnGUAnpJ8MfGAVJimDjEV5XJLMK3S', 'admin');

-- Academic Year
INSERT INTO academic_years (year_label, start_date, end_date, is_current) VALUES
('2025-2026', '2025-06-01', '2026-05-31', 1),
('2024-2025', '2024-06-01', '2025-05-31', 0);

-- Semesters
INSERT INTO semesters (name, academic_year_id, start_date, end_date, is_current) VALUES
('Semester I', 1, '2025-06-01', '2025-11-30', 1),
('Semester II', 1, '2025-12-01', '2026-05-31', 0),
('Semester I', 2, '2024-06-01', '2024-11-30', 0),
('Semester II', 2, '2024-12-01', '2025-05-31', 0);

-- Departments
INSERT INTO departments (name, code, hod_name) VALUES
('Computer Science and Engineering', 'CSE', 'Dr. Rajesh Kumar'),
('Electronics and Communication Engineering', 'ECE', 'Dr. Priya Sharma'),
('Mechanical Engineering', 'ME', 'Dr. Suresh Patel'),
('Civil Engineering', 'CE', 'Dr. Anita Singh'),
('Information Technology', 'IT', 'Dr. Mohit Verma');

-- Rooms
INSERT INTO rooms (room_number, room_type, capacity, building) VALUES
('101', 'classroom', 60, 'Block A'),
('102', 'classroom', 60, 'Block A'),
('103', 'classroom', 60, 'Block A'),
('104', 'classroom', 60, 'Block A'),
('201', 'classroom', 60, 'Block B'),
('202', 'classroom', 60, 'Block B'),
('CL01', 'computer_lab', 40, 'Block C'),
('CL02', 'computer_lab', 40, 'Block C'),
('EL01', 'electronics_lab', 30, 'Block D'),
('EL02', 'electronics_lab', 30, 'Block D'),
('SH01', 'seminar_hall', 150, 'Block E'),
('ML01', 'computer_lab', 40, 'Block C');

-- Time Slots
INSERT INTO time_slots (slot_name, start_time, end_time, period_number, is_break, break_type) VALUES
('Period 1', '09:00:00', '09:50:00', 1, 0, NULL),
('Period 2', '09:50:00', '10:40:00', 2, 0, NULL),
('Period 3', '10:40:00', '11:30:00', 3, 0, NULL),
('Period 4', '11:30:00', '12:20:00', 4, 0, NULL),
('Lunch Break', '12:20:00', '13:10:00', 5, 1, 'lunch'),
('Period 5', '13:10:00', '14:00:00', 6, 0, NULL),
('Period 6', '14:00:00', '14:50:00', 7, 0, NULL),
('Period 7', '14:50:00', '15:40:00', 8, 0, NULL),
('Period 8', '15:40:00', '16:30:00', 9, 0, NULL);

-- Staff
INSERT INTO staff (staff_id, name, department_id, designation, email, phone, max_hours_per_week, status) VALUES
('CSE001', 'Prof. Amit Sharma', 1, 'Associate Professor', 'amit.sharma@college.edu', '9876543210', 18, 'active'),
('CSE002', 'Prof. Neha Gupta', 1, 'Assistant Professor', 'neha.gupta@college.edu', '9876543211', 16, 'active'),
('CSE003', 'Dr. Vikram Singh', 1, 'Professor', 'vikram.singh@college.edu', '9876543212', 14, 'active'),
('CSE004', 'Prof. Pooja Mehta', 1, 'Assistant Professor', 'pooja.mehta@college.edu', '9876543213', 18, 'active'),
('CSE005', 'Prof. Rajan Das', 1, 'Assistant Professor', 'rajan.das@college.edu', '9876543214', 16, 'active'),
('ECE001', 'Dr. Sunita Rao', 2, 'Associate Professor', 'sunita.rao@college.edu', '9876543220', 18, 'active'),
('ECE002', 'Prof. Manoj Kumar', 2, 'Assistant Professor', 'manoj.kumar@college.edu', '9876543221', 16, 'active'),
('ECE003', 'Prof. Deepa Nair', 2, 'Assistant Professor', 'deepa.nair@college.edu', '9876543222', 18, 'active'),
('ME001', 'Dr. Harish Patel', 3, 'Associate Professor', 'harish.patel@college.edu', '9876543230', 18, 'active'),
('ME002', 'Prof. Sanjay Joshi', 3, 'Assistant Professor', 'sanjay.joshi@college.edu', '9876543231', 16, 'active'),
('IT001', 'Prof. Kavita Reddy', 5, 'Assistant Professor', 'kavita.reddy@college.edu', '9876543240', 18, 'active'),
('IT002', 'Dr. Rahul Mishra', 5, 'Associate Professor', 'rahul.mishra@college.edu', '9876543241', 16, 'active');

-- Classes
INSERT INTO classes (department_id, year, semester, section, strength, academic_year_id) VALUES
(1, 1, 1, 'A', 60, 1),
(1, 1, 1, 'B', 58, 1),
(1, 2, 3, 'A', 55, 1),
(1, 2, 3, 'B', 52, 1),
(1, 3, 5, 'A', 50, 1),
(1, 4, 7, 'A', 48, 1),
(2, 1, 1, 'A', 60, 1),
(2, 2, 3, 'A', 55, 1),
(5, 1, 1, 'A', 60, 1),
(5, 2, 3, 'A', 54, 1);

-- Subjects (CSE Sem 1)
INSERT INTO subjects (subject_code, subject_name, department_id, semester, hours_per_week, subject_type, credits) VALUES
('CS101', 'Engineering Mathematics I', 1, 1, 4, 'theory', 4),
('CS102', 'Programming in C', 1, 1, 3, 'theory', 3),
('CS103', 'Digital Logic Design', 1, 1, 3, 'theory', 3),
('CS104', 'Engineering Physics', 1, 1, 3, 'theory', 3),
('CS105', 'Communication Skills', 1, 1, 2, 'theory', 2),
('CS106', 'C Programming Lab', 1, 1, 2, 'lab', 2),
('CS107', 'Digital Logic Lab', 1, 1, 2, 'lab', 2),
-- CSE Sem 3
('CS301', 'Data Structures', 1, 3, 4, 'theory', 4),
('CS302', 'Computer Organization', 1, 3, 3, 'theory', 3),
('CS303', 'Discrete Mathematics', 1, 3, 3, 'theory', 3),
('CS304', 'Operating Systems', 1, 3, 3, 'theory', 3),
('CS305', 'OOP with Java', 1, 3, 3, 'theory', 3),
('CS306', 'Data Structures Lab', 1, 3, 2, 'lab', 2),
('CS307', 'Java Programming Lab', 1, 3, 2, 'lab', 2),
-- CSE Sem 5
('CS501', 'Database Management Systems', 1, 5, 4, 'theory', 4),
('CS502', 'Computer Networks', 1, 5, 3, 'theory', 3),
('CS503', 'Software Engineering', 1, 5, 3, 'theory', 3),
('CS504', 'Web Technology', 1, 5, 3, 'theory', 3),
('CS505', 'DBMS Lab', 1, 5, 2, 'lab', 2),
('CS506', 'Web Technology Lab', 1, 5, 2, 'lab', 2),
-- ECE Sem 1
('EC101', 'Engineering Mathematics I', 2, 1, 4, 'theory', 4),
('EC102', 'Basic Electronics', 2, 1, 3, 'theory', 3),
('EC103', 'Circuit Theory', 2, 1, 3, 'theory', 3),
('EC104', 'Electronic Devices Lab', 2, 1, 2, 'lab', 2),
-- IT Sem 1
('IT101', 'Engineering Mathematics I', 5, 1, 4, 'theory', 4),
('IT102', 'Programming Fundamentals', 5, 1, 3, 'theory', 3),
('IT103', 'IT Essentials', 5, 1, 3, 'theory', 3),
('IT104', 'Programming Lab', 5, 1, 2, 'lab', 2);

-- Subject Faculty Assignments
INSERT INTO subject_faculty (subject_id, staff_id, class_id) VALUES
(1, 3, 1),(1, 3, 2),(2, 1, 1),(2, 2, 2),(3, 4, 1),(3, 4, 2),
(4, 5, 1),(4, 5, 2),(5, 2, 1),(5, 1, 2),(6, 1, 1),(6, 2, 2),
(7, 4, 1),(7, 4, 2),
(8, 1, 3),(8, 2, 4),(9, 3, 3),(9, 3, 4),(10, 5, 3),(10, 5, 4),
(11, 4, 3),(11, 4, 4),(12, 2, 3),(12, 1, 4),(13, 1, 3),(13, 2, 4),
(14, 2, 3),(14, 1, 4);

-- Staff Availability (all staff available all days by default)
INSERT INTO staff_availability (staff_id, day_of_week, is_available) VALUES
(1,'Monday',1),(1,'Tuesday',1),(1,'Wednesday',1),(1,'Thursday',1),(1,'Friday',1),(1,'Saturday',1),
(2,'Monday',1),(2,'Tuesday',1),(2,'Wednesday',1),(2,'Thursday',1),(2,'Friday',1),(2,'Saturday',0),
(3,'Monday',1),(3,'Tuesday',1),(3,'Wednesday',1),(3,'Thursday',1),(3,'Friday',1),(3,'Saturday',0),
(4,'Monday',1),(4,'Tuesday',1),(4,'Wednesday',1),(4,'Thursday',1),(4,'Friday',1),(4,'Saturday',1),
(5,'Monday',1),(5,'Tuesday',1),(5,'Wednesday',1),(5,'Thursday',1),(5,'Friday',1),(5,'Saturday',1),
(6,'Monday',1),(6,'Tuesday',1),(6,'Wednesday',1),(6,'Thursday',1),(6,'Friday',1),(6,'Saturday',0),
(7,'Monday',1),(7,'Tuesday',1),(7,'Wednesday',1),(7,'Thursday',1),(7,'Friday',1),(7,'Saturday',1),
(8,'Monday',1),(8,'Tuesday',1),(8,'Wednesday',1),(8,'Thursday',1),(8,'Friday',1),(8,'Saturday',0),
(9,'Monday',1),(9,'Tuesday',1),(9,'Wednesday',1),(9,'Thursday',1),(9,'Friday',1),(9,'Saturday',1),
(10,'Monday',1),(10,'Tuesday',1),(10,'Wednesday',1),(10,'Thursday',1),(10,'Friday',1),(10,'Saturday',0),
(11,'Monday',1),(11,'Tuesday',1),(11,'Wednesday',1),(11,'Thursday',1),(11,'Friday',1),(11,'Saturday',1),
(12,'Monday',1),(12,'Tuesday',1),(12,'Wednesday',1),(12,'Thursday',1),(12,'Friday',1),(12,'Saturday',0);

-- Academic Settings
INSERT INTO academic_settings (setting_key, setting_value, description) VALUES
('working_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 'Active working days'),
('periods_per_day', '8', 'Number of teaching periods per day'),
('lunch_period', '5', 'Lunch break period number'),
('academic_year', '2025-2026', 'Current academic year'),
('max_consecutive_periods', '3', 'Max consecutive periods for a faculty'),
('min_lunch_break', '50', 'Minimum lunch break in minutes');

-- Activity Log seed
INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES
(1, 'LOGIN', 'Admin logged into the system', '127.0.0.1'),
(1, 'SETUP', 'Initial system setup completed', '127.0.0.1');
