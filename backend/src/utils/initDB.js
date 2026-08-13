/**
 * Production Database Initializer
 * Run on Render after deploy: node src/utils/initDB.js
 *
 * Creates all tables and seeds essential data
 */
require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDB() {
  const conn = await pool.getConnection();
  console.log('✅ Connected to database');

  try {
    await conn.beginTransaction();

    // ── Tables ────────────────────────────────────────────────────────────────
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','staff') DEFAULT 'admin',
        is_active TINYINT(1) DEFAULT 1,
        last_login DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE,
        hod_name VARCHAR(100),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year_label VARCHAR(20) NOT NULL,
        start_date DATE,
        end_date DATE,
        is_current TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS semesters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        academic_year_id INT NOT NULL,
        start_date DATE,
        end_date DATE,
        is_current TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id VARCHAR(30) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        department_id INT NOT NULL,
        designation VARCHAR(100),
        email VARCHAR(150) UNIQUE,
        phone VARCHAR(20),
        max_hours_per_week INT DEFAULT 20,
        status ENUM('active','inactive','on_leave') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS staff_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
        is_available TINYINT(1) DEFAULT 1,
        UNIQUE KEY uq_staff_day (staff_id, day_of_week)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_number VARCHAR(20) NOT NULL UNIQUE,
        room_type ENUM('classroom','computer_lab','electronics_lab','seminar_hall') NOT NULL,
        capacity INT DEFAULT 60,
        building VARCHAR(100),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        year INT NOT NULL,
        semester INT NOT NULL,
        section VARCHAR(5) NOT NULL,
        strength INT DEFAULT 60,
        academic_year_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_class (department_id, year, semester, section)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_code VARCHAR(20) NOT NULL UNIQUE,
        subject_name VARCHAR(150) NOT NULL,
        department_id INT NOT NULL,
        semester INT NOT NULL,
        hours_per_week INT DEFAULT 3,
        subject_type ENUM('theory','lab') DEFAULT 'theory',
        credits INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS subject_faculty (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        staff_id INT NOT NULL,
        class_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_subj_staff_class (subject_id, staff_id, class_id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS time_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_name VARCHAR(30) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        period_number INT NOT NULL,
        is_break TINYINT(1) DEFAULT 0,
        break_type ENUM('lunch','short') DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        UNIQUE KEY uq_period (period_number)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS timetable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        subject_id INT NOT NULL,
        staff_id INT NOT NULL,
        room_id INT NOT NULL,
        time_slot_id INT NOT NULL,
        day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
        academic_year_id INT,
        generation INT DEFAULT 1,
        fitness_score DECIMAL(5,2) DEFAULT 0.00,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_timetable (class_id, time_slot_id, day_of_week, academic_year_id),
        INDEX idx_class (class_id), INDEX idx_staff (staff_id), INDEX idx_room (room_id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS timetable_generation_log (
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
        completed_at TIMESTAMP NULL
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS academic_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS interval_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_name VARCHAR(100) NOT NULL DEFAULT 'default',
        start_time TIME NOT NULL DEFAULT '09:00:00',
        period_duration INT NOT NULL DEFAULT 60,
        num_periods INT NOT NULL DEFAULT 8,
        interval_duration INT NOT NULL DEFAULT 15,
        interval_after_period INT NOT NULL DEFAULT 2,
        lunch_duration INT NOT NULL DEFAULT 50,
        lunch_after_period INT NOT NULL DEFAULT 4,
        include_saturday TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timetable_id INT,
        class_id INT NOT NULL,
        subject_id INT NOT NULL,
        staff_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
        time_slot_id INT NOT NULL,
        status ENUM('conducted','cancelled','holiday','substituted') DEFAULT 'conducted',
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_attendance (class_id, attendance_date, time_slot_id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS timetable_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT,
        semester INT,
        academic_year_id INT,
        version_number INT NOT NULL DEFAULT 1,
        version_label VARCHAR(100),
        snapshot JSON NOT NULL,
        fitness_score DECIMAL(5,2) DEFAULT 0.00,
        total_entries INT DEFAULT 0,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active TINYINT(1) DEFAULT 0
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS subject_colors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL UNIQUE,
        color_hex VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS staff_workload (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        academic_year_id INT,
        total_hours INT DEFAULT 0,
        assigned_hours INT DEFAULT 0,
        UNIQUE KEY uq_staff_year (staff_id, academic_year_id)
      ) ENGINE=InnoDB`,
    ];

    for (const sql of tables) {
      await conn.execute(sql);
    }
    console.log('✅ All tables created');

    // ── Seed essential data ───────────────────────────────────────────────────

    // Admin user
    const hash = await bcrypt.hash('Admin@123', 12);
    await conn.execute(
      `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      ['System Admin', 'admin@college.edu', hash]
    );

    // Academic year
    await conn.execute(
      `INSERT IGNORE INTO academic_years (id, year_label, start_date, end_date, is_current)
       VALUES (1, '2025-2026', '2025-06-01', '2026-05-31', 1)`
    );

    // Departments
    const depts = [
      [1,'Computer Science and Engineering','CSE','Dr. Rajesh Kumar'],
      [2,'Electronics and Communication Engineering','ECE','Dr. Priya Sharma'],
      [3,'Mechanical Engineering','ME','Dr. Suresh Patel'],
      [4,'Civil Engineering','CE','Dr. Anita Singh'],
      [5,'Information Technology','IT','Dr. Mohit Verma'],
      [6,'Electrical and Electronics Engineering','EEE','Dr. Karthik Rajan'],
      [7,'Artificial Intelligence and Data Science','AIDS','Dr. Meena Lakshmi'],
      [8,'Computer Science and Business Systems','CSBS','Dr. Pradeep Kumar'],
      [9,'Biomedical Engineering','BME','Dr. Vijaya Lakshmi'],
      [10,'Aeronautical Engineering','AERO','Dr. Suresh Babu'],
      [11,'Automobile Engineering','AUTO','Dr. Ramesh Nair'],
      [12,'Chemical Engineering','CHEM','Dr. Anand Selvam'],
      [13,'Agriculture Engineering','AGRI','Dr. Sundari Devi'],
    ];
    for (const [id, name, code, hod] of depts) {
      await conn.execute(
        `INSERT IGNORE INTO departments (id, name, code, hod_name) VALUES (?, ?, ?, ?)`,
        [id, name, code, hod]
      );
    }

    // Rooms
    const rooms = [
      ['101','classroom',60,'Block A'],['102','classroom',60,'Block A'],
      ['103','classroom',60,'Block A'],['104','classroom',60,'Block A'],
      ['201','classroom',60,'Block B'],['202','classroom',60,'Block B'],
      ['CL01','computer_lab',40,'Block C'],['CL02','computer_lab',40,'Block C'],
      ['EL01','electronics_lab',30,'Block D'],['EL02','electronics_lab',30,'Block D'],
      ['SH01','seminar_hall',150,'Block E'],['ML01','computer_lab',40,'Block C'],
    ];
    for (const [num, type, cap, bldg] of rooms) {
      await conn.execute(
        `INSERT IGNORE INTO rooms (room_number, room_type, capacity, building) VALUES (?, ?, ?, ?)`,
        [num, type, cap, bldg]
      );
    }

    // Time slots
    const slots = [
      ['Period 1','09:00:00','09:50:00',1,0,null],
      ['Period 2','09:50:00','10:40:00',2,0,null],
      ['Period 3','10:40:00','11:30:00',3,0,null],
      ['Period 4','11:30:00','12:20:00',4,0,null],
      ['Lunch Break','12:20:00','13:10:00',5,1,'lunch'],
      ['Period 5','13:10:00','14:00:00',6,0,null],
      ['Period 6','14:00:00','14:50:00',7,0,null],
      ['Period 7','14:50:00','15:40:00',8,0,null],
      ['Period 8','15:40:00','16:30:00',9,0,null],
    ];
    for (const [name, start, end, period, isBreak, breakType] of slots) {
      await conn.execute(
        `INSERT IGNORE INTO time_slots (slot_name, start_time, end_time, period_number, is_break, break_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, start, end, period, isBreak, breakType]
      );
    }

    // Academic settings
    const settings = [
      ['working_days','Monday,Tuesday,Wednesday,Thursday,Friday,Saturday','Active working days'],
      ['periods_per_day','8','Number of teaching periods per day'],
      ['lunch_period','5','Lunch break period number'],
      ['academic_year','2025-2026','Current academic year'],
      ['max_consecutive_periods','3','Max consecutive periods for a faculty'],
    ];
    for (const [key, val, desc] of settings) {
      await conn.execute(
        `INSERT IGNORE INTO academic_settings (setting_key, setting_value, description) VALUES (?, ?, ?)`,
        [key, val, desc]
      );
    }

    // Interval settings
    await conn.execute(
      `INSERT IGNORE INTO interval_settings
       (setting_name, start_time, period_duration, num_periods, interval_duration,
        interval_after_period, lunch_duration, lunch_after_period)
       VALUES ('default', '09:00:00', 60, 8, 15, 2, 50, 4)`
    );

    await conn.commit();
    console.log('✅ Database initialized successfully!');
    console.log('\n📌 Login credentials:');
    console.log('   Email   : admin@college.edu');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  Run seedAllDepts.js next to add departments, staff, subjects and generate timetables.\n');

  } catch (err) {
    await conn.rollback();
    console.error('❌ DB init failed:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

initDB();
