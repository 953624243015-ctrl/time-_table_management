/**
 * Seed All Departments with Staff, Classes, Subjects and Faculty Assignments
 * Run: node src/utils/seedAllDepts.js
 *
 * Rules:
 * - Uses real department IDs from the DB
 * - Does NOT overwrite existing data (INSERT IGNORE)
 * - Creates proper faculty-subject-class assignments
 * - Respects existing staff_availability defaults
 */

require('dotenv').config();
const { pool } = require('../config/database');

// ─── Department Definitions ───────────────────────────────────────────────────
// Matches DB: id 1=CSE, 2=ECE, 3=ME, 4=CE, 5=IT, 6=EEE, 7=AIDS, 8=CSBS
//             9=BME, 10=AERO, 11=AUTO, 12=CHEM, 13=AGRI

const DEPT_DATA = {
  3:  { code: 'ME',   staff: ['Dr. Harish Patel','Prof. Sanjay Joshi'],
        existing_staff_ids: [9,10] },
  4:  { code: 'CE',   staff: ['Dr. Anita Singh','Prof. Ramesh Kumar'] },
  6:  { code: 'EEE',  staff: ['Dr. Lakshmi Devi','Prof. Venkat Rao','Prof. Priya Krishnan'] },
  7:  { code: 'AIDS', staff: ['Dr. Meena Lakshmi','Prof. Ravi Shankar','Prof. Divya Nair'] },
  8:  { code: 'CSBS', staff: ['Dr. Pradeep Kumar','Prof. Ananya Roy','Prof. Kiran Babu'] },
  9:  { code: 'BME',  staff: ['Dr. Vijaya Lakshmi','Prof. Arun Menon'] },
  10: { code: 'AERO', staff: ['Dr. Suresh Babu','Prof. Mani Iyer','Prof. Preethi Sharma'] },
  11: { code: 'AUTO', staff: ['Dr. Ramesh Nair','Prof. Selvam Raj'] },
  12: { code: 'CHEM', staff: ['Dr. Anand Selvam','Prof. Kavitha Mohan'] },
  13: { code: 'AGRI', staff: ['Dr. Sundari Devi','Prof. Murugan Pillai'] },
};

// Subject templates per type (reused across depts with dept-specific codes)
const SUBJECT_TEMPLATES = {
  3: { // ME
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'ME101', name:'Engineering Mechanics',          type:'theory', hrs:3, credits:3 },
      { code:'ME102', name:'Engineering Drawing',            type:'theory', hrs:3, credits:3 },
      { code:'PH101', name:'Engineering Physics',            type:'theory', hrs:3, credits:3 },
      { code:'ME103', name:'Workshop Practice',              type:'lab',    hrs:2, credits:2 },
      { code:'ME104', name:'Engineering Drawing Lab',        type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'ME301', name:'Thermodynamics',                 type:'theory', hrs:4, credits:4 },
      { code:'ME302', name:'Fluid Mechanics',                type:'theory', hrs:3, credits:3 },
      { code:'ME303', name:'Kinematics of Machinery',        type:'theory', hrs:3, credits:3 },
      { code:'ME304', name:'Manufacturing Technology',       type:'theory', hrs:3, credits:3 },
      { code:'ME305', name:'Fluid Mechanics Lab',            type:'lab',    hrs:2, credits:2 },
      { code:'ME306', name:'Manufacturing Lab',              type:'lab',    hrs:2, credits:2 },
    ],
  },
  4: { // CE
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'CE101', name:'Engineering Mechanics',          type:'theory', hrs:3, credits:3 },
      { code:'CE102', name:'Building Materials',             type:'theory', hrs:3, credits:3 },
      { code:'CE103', name:'Surveying',                      type:'theory', hrs:3, credits:3 },
      { code:'CE104', name:'Surveying Lab',                  type:'lab',    hrs:2, credits:2 },
      { code:'CE105', name:'Material Testing Lab',           type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'CE301', name:'Structural Analysis',            type:'theory', hrs:4, credits:4 },
      { code:'CE302', name:'Fluid Mechanics',                type:'theory', hrs:3, credits:3 },
      { code:'CE303', name:'Geotechnical Engineering',       type:'theory', hrs:3, credits:3 },
      { code:'CE304', name:'Transportation Engineering',     type:'theory', hrs:3, credits:3 },
      { code:'CE305', name:'Fluid Mechanics Lab',            type:'lab',    hrs:2, credits:2 },
      { code:'CE306', name:'Soil Mechanics Lab',             type:'lab',    hrs:2, credits:2 },
    ],
  },
  6: { // EEE
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'EE101', name:'Circuit Theory',                 type:'theory', hrs:3, credits:3 },
      { code:'EE102', name:'Electrical Machines I',          type:'theory', hrs:3, credits:3 },
      { code:'EE103', name:'Electronic Devices',             type:'theory', hrs:3, credits:3 },
      { code:'EE104', name:'Circuits Lab',                   type:'lab',    hrs:2, credits:2 },
      { code:'EE105', name:'Electronic Devices Lab',         type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'EE301', name:'Power Systems I',                type:'theory', hrs:4, credits:4 },
      { code:'EE302', name:'Electrical Machines II',         type:'theory', hrs:3, credits:3 },
      { code:'EE303', name:'Control Systems',                type:'theory', hrs:3, credits:3 },
      { code:'EE304', name:'Measurement & Instrumentation',  type:'theory', hrs:3, credits:3 },
      { code:'EE305', name:'Power Systems Lab',              type:'lab',    hrs:2, credits:2 },
      { code:'EE306', name:'Control Systems Lab',            type:'lab',    hrs:2, credits:2 },
    ],
  },
  7: { // AIDS
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'AI101', name:'Introduction to AI',             type:'theory', hrs:3, credits:3 },
      { code:'AI102', name:'Python Programming',             type:'theory', hrs:3, credits:3 },
      { code:'AI103', name:'Data Structures',                type:'theory', hrs:3, credits:3 },
      { code:'AI104', name:'Python Lab',                     type:'lab',    hrs:2, credits:2 },
      { code:'AI105', name:'Data Structures Lab',            type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'AI301', name:'Machine Learning',               type:'theory', hrs:4, credits:4 },
      { code:'AI302', name:'Deep Learning',                  type:'theory', hrs:3, credits:3 },
      { code:'AI303', name:'Natural Language Processing',    type:'theory', hrs:3, credits:3 },
      { code:'AI304', name:'Data Science',                   type:'theory', hrs:3, credits:3 },
      { code:'AI305', name:'ML Lab',                         type:'lab',    hrs:2, credits:2 },
      { code:'AI306', name:'Deep Learning Lab',              type:'lab',    hrs:2, credits:2 },
    ],
  },
  8: { // CSBS
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'CB101', name:'Programming Fundamentals',       type:'theory', hrs:3, credits:3 },
      { code:'CB102', name:'Business Communication',         type:'theory', hrs:3, credits:3 },
      { code:'CB103', name:'Principles of Management',       type:'theory', hrs:3, credits:3 },
      { code:'CB104', name:'Programming Lab',                type:'lab',    hrs:2, credits:2 },
      { code:'CB105', name:'Office Tools Lab',               type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'CB301', name:'Database Systems',               type:'theory', hrs:4, credits:4 },
      { code:'CB302', name:'Business Analytics',             type:'theory', hrs:3, credits:3 },
      { code:'CB303', name:'Web Technologies',               type:'theory', hrs:3, credits:3 },
      { code:'CB304', name:'Entrepreneurship',               type:'theory', hrs:3, credits:3 },
      { code:'CB305', name:'DBMS Lab',                       type:'lab',    hrs:2, credits:2 },
      { code:'CB306', name:'Web Tech Lab',                   type:'lab',    hrs:2, credits:2 },
    ],
  },
  9: { // BME
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'BM101', name:'Human Anatomy & Physiology',     type:'theory', hrs:3, credits:3 },
      { code:'BM102', name:'Biophysics',                     type:'theory', hrs:3, credits:3 },
      { code:'BM103', name:'Biochemistry',                   type:'theory', hrs:3, credits:3 },
      { code:'BM104', name:'Anatomy Lab',                    type:'lab',    hrs:2, credits:2 },
      { code:'BM105', name:'Biochemistry Lab',               type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'BM301', name:'Biomedical Instrumentation',     type:'theory', hrs:4, credits:4 },
      { code:'BM302', name:'Medical Imaging',                type:'theory', hrs:3, credits:3 },
      { code:'BM303', name:'Biomaterials',                   type:'theory', hrs:3, credits:3 },
      { code:'BM304', name:'Signal Processing',              type:'theory', hrs:3, credits:3 },
      { code:'BM305', name:'Instrumentation Lab',            type:'lab',    hrs:2, credits:2 },
      { code:'BM306', name:'Medical Imaging Lab',            type:'lab',    hrs:2, credits:2 },
    ],
  },
  10: { // AERO
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'AE101', name:'Aerodynamics I',                 type:'theory', hrs:3, credits:3 },
      { code:'AE102', name:'Aircraft Structures',            type:'theory', hrs:3, credits:3 },
      { code:'AE103', name:'Engineering Mechanics',          type:'theory', hrs:3, credits:3 },
      { code:'AE104', name:'Aero Structures Lab',            type:'lab',    hrs:2, credits:2 },
      { code:'AE105', name:'CAD Lab',                        type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'AE301', name:'Propulsion I',                   type:'theory', hrs:4, credits:4 },
      { code:'AE302', name:'Flight Mechanics',               type:'theory', hrs:3, credits:3 },
      { code:'AE303', name:'Aircraft Materials',             type:'theory', hrs:3, credits:3 },
      { code:'AE304', name:'Avionics',                       type:'theory', hrs:3, credits:3 },
      { code:'AE305', name:'Propulsion Lab',                 type:'lab',    hrs:2, credits:2 },
      { code:'AE306', name:'Avionics Lab',                   type:'lab',    hrs:2, credits:2 },
    ],
  },
  11: { // AUTO
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'AU101', name:'Engineering Mechanics',          type:'theory', hrs:3, credits:3 },
      { code:'AU102', name:'Automotive Engineering',         type:'theory', hrs:3, credits:3 },
      { code:'AU103', name:'Engineering Drawing',            type:'theory', hrs:3, credits:3 },
      { code:'AU104', name:'Auto Workshop',                  type:'lab',    hrs:2, credits:2 },
      { code:'AU105', name:'CAD Lab',                        type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'AU301', name:'Vehicle Dynamics',               type:'theory', hrs:4, credits:4 },
      { code:'AU302', name:'IC Engines',                     type:'theory', hrs:3, credits:3 },
      { code:'AU303', name:'Transmission Systems',           type:'theory', hrs:3, credits:3 },
      { code:'AU304', name:'Automotive Electronics',         type:'theory', hrs:3, credits:3 },
      { code:'AU305', name:'Engine Lab',                     type:'lab',    hrs:2, credits:2 },
      { code:'AU306', name:'Vehicle Dynamics Lab',           type:'lab',    hrs:2, credits:2 },
    ],
  },
  12: { // CHEM
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'CH101', name:'Engineering Chemistry',          type:'theory', hrs:3, credits:3 },
      { code:'CH102', name:'Chemical Process Principles',    type:'theory', hrs:3, credits:3 },
      { code:'CH103', name:'Fluid Mechanics',                type:'theory', hrs:3, credits:3 },
      { code:'CH104', name:'Chemistry Lab',                  type:'lab',    hrs:2, credits:2 },
      { code:'CH105', name:'Process Lab',                    type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'CH301', name:'Chemical Reaction Engineering',  type:'theory', hrs:4, credits:4 },
      { code:'CH302', name:'Mass Transfer',                  type:'theory', hrs:3, credits:3 },
      { code:'CH303', name:'Heat Transfer',                  type:'theory', hrs:3, credits:3 },
      { code:'CH304', name:'Process Control',                type:'theory', hrs:3, credits:3 },
      { code:'CH305', name:'Mass Transfer Lab',              type:'lab',    hrs:2, credits:2 },
      { code:'CH306', name:'Heat Transfer Lab',              type:'lab',    hrs:2, credits:2 },
    ],
  },
  13: { // AGRI
    sem1: [
      { code:'MA101', name:'Engineering Mathematics I',      type:'theory', hrs:4, credits:4 },
      { code:'AG101', name:'Soil Science',                   type:'theory', hrs:3, credits:3 },
      { code:'AG102', name:'Crop Production',                type:'theory', hrs:3, credits:3 },
      { code:'AG103', name:'Agricultural Meteorology',       type:'theory', hrs:3, credits:3 },
      { code:'AG104', name:'Soil Lab',                       type:'lab',    hrs:2, credits:2 },
      { code:'AG105', name:'Crop Science Lab',               type:'lab',    hrs:2, credits:2 },
    ],
    sem3: [
      { code:'AG301', name:'Irrigation Engineering',         type:'theory', hrs:4, credits:4 },
      { code:'AG302', name:'Farm Machinery',                 type:'theory', hrs:3, credits:3 },
      { code:'AG303', name:'Agricultural Economics',         type:'theory', hrs:3, credits:3 },
      { code:'AG304', name:'Plant Pathology',                type:'theory', hrs:3, credits:3 },
      { code:'AG305', name:'Irrigation Lab',                 type:'lab',    hrs:2, credits:2 },
      { code:'AG306', name:'Farm Machinery Lab',             type:'lab',    hrs:2, credits:2 },
    ],
  },
};

// Also add missing CSE Sem5 and IT Sem3 assignments
const MISSING_ASSIGNMENTS = {
  // CSE Sem5 (class_id=5), subjects CS501-CS506
  cse_sem5: { class_id: 5, dept_id: 1, sem: 5 },
  // IT Sem3 (class_id=10), subjects IT related
  it_sem3:  { class_id: 10, dept_id: 5, sem: 3 },
};

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seedAllDepartments() {
  const conn = await pool.getConnection();
  const ACADEMIC_YEAR_ID = 1;

  try {
    await conn.beginTransaction();
    console.log('\n🌱 Starting department seed...\n');

    // ── Fix CSE Sem5 missing assignments ─────────────────────────────────────
    console.log('📋 Fixing CSE Sem5 faculty assignments...');
    const [cse5Subjects] = await conn.execute(
      'SELECT id, subject_type FROM subjects WHERE department_id=1 AND semester=5'
    );
    const [cseStaff] = await conn.execute(
      "SELECT id FROM staff WHERE department_id=1 AND status='active' LIMIT 5"
    );
    if (cse5Subjects.length && cseStaff.length) {
      for (let i = 0; i < cse5Subjects.length; i++) {
        const staff = cseStaff[i % cseStaff.length];
        await conn.execute(
          'INSERT IGNORE INTO subject_faculty (subject_id, staff_id, class_id) VALUES (?,?,?)',
          [cse5Subjects[i].id, staff.id, 5]
        );
      }
      console.log(`  ✓ CSE Sem5: ${cse5Subjects.length} assignments done`);
    }

    // ── Fix IT Sem3 missing assignments ──────────────────────────────────────
    console.log('📋 Fixing IT Sem3 faculty assignments...');
    // Add IT Sem3 subjects if not exist
    const itSem3Subjects = [
      { code:'IT301', name:'Database Management Systems', type:'theory', hrs:4, credits:4 },
      { code:'IT302', name:'Computer Networks',           type:'theory', hrs:3, credits:3 },
      { code:'IT303', name:'Operating Systems',           type:'theory', hrs:3, credits:3 },
      { code:'IT304', name:'Software Engineering',        type:'theory', hrs:3, credits:3 },
      { code:'IT305', name:'DBMS Lab',                    type:'lab',    hrs:2, credits:2 },
      { code:'IT306', name:'Networks Lab',                type:'lab',    hrs:2, credits:2 },
    ];
    for (const s of itSem3Subjects) {
      await conn.execute(
        'INSERT IGNORE INTO subjects (subject_code, subject_name, department_id, semester, hours_per_week, subject_type, credits) VALUES (?,?,?,?,?,?,?)',
        [s.code, s.name, 5, 3, s.hrs, s.type, s.credits]
      );
    }
    const [it3Subjects] = await conn.execute(
      'SELECT id, subject_type FROM subjects WHERE department_id=5 AND semester=3'
    );
    const [itStaff] = await conn.execute(
      "SELECT id FROM staff WHERE department_id=5 AND status='active'"
    );
    if (it3Subjects.length && itStaff.length) {
      for (let i = 0; i < it3Subjects.length; i++) {
        const staff = itStaff[i % itStaff.length];
        await conn.execute(
          'INSERT IGNORE INTO subject_faculty (subject_id, staff_id, class_id) VALUES (?,?,?)',
          [it3Subjects[i].id, staff.id, 10]
        );
      }
      console.log(`  ✓ IT Sem3: ${it3Subjects.length} assignments done`);
    }

    // ── Seed each new department ──────────────────────────────────────────────
    for (const [deptId, deptInfo] of Object.entries(DEPT_DATA)) {
      const dId = parseInt(deptId);
      const templates = SUBJECT_TEMPLATES[dId];
      if (!templates) { console.log(`  ⚠ No subject templates for dept ${deptInfo.code}`); continue; }

      console.log(`\n📚 Seeding ${deptInfo.code} (dept_id=${dId})...`);

      // Check if already has staff (use existing if available)
      let staffIds = [];
      if (deptInfo.existing_staff_ids) {
        staffIds = deptInfo.existing_staff_ids;
        console.log(`  ↪ Using existing staff: ${staffIds.join(',')}`);
      } else {
        // Insert new staff
        for (let i = 0; i < deptInfo.staff.length; i++) {
          const name = deptInfo.staff[i];
          const staffCode = `${deptInfo.code}${String(i + 1).padStart(3, '0')}`;
          const email = `${staffCode.toLowerCase()}@college.edu`;
          const [existing] = await conn.execute('SELECT id FROM staff WHERE staff_id=?', [staffCode]);
          if (existing.length) {
            staffIds.push(existing[0].id);
            console.log(`  ↪ Staff exists: ${staffCode}`);
          } else {
            const [res] = await conn.execute(
              'INSERT INTO staff (staff_id, name, department_id, designation, email, max_hours_per_week, status) VALUES (?,?,?,?,?,?,?)',
              [staffCode, name, dId, i === 0 ? 'Associate Professor' : 'Assistant Professor', email, 18, 'active']
            );
            staffIds.push(res.insertId);
            // Add availability for all days
            const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            for (const day of days) {
              await conn.execute(
                'INSERT IGNORE INTO staff_availability (staff_id, day_of_week, is_available) VALUES (?,?,1)',
                [res.insertId, day]
              );
            }
            console.log(`  ✓ Staff created: ${staffCode} - ${name}`);
          }
        }
      }

      // Create classes for Sem1 and Sem3 if not exist
      const semesters = [1, 3];
      for (const sem of semesters) {
        const year = sem === 1 ? 1 : 2;
        const [existingClass] = await conn.execute(
          'SELECT id FROM classes WHERE department_id=? AND semester=? AND section=? AND academic_year_id=?',
          [dId, sem, 'A', ACADEMIC_YEAR_ID]
        );
        let classId;
        if (existingClass.length) {
          classId = existingClass[0].id;
          console.log(`  ↪ Class exists: ${deptInfo.code} Y${year} S${sem} A (id=${classId})`);
        } else {
          const [res] = await conn.execute(
            'INSERT INTO classes (department_id, year, semester, section, strength, academic_year_id) VALUES (?,?,?,?,?,?)',
            [dId, year, sem, 'A', 60, ACADEMIC_YEAR_ID]
          );
          classId = res.insertId;
          console.log(`  ✓ Class created: ${deptInfo.code} Y${year} S${sem} A (id=${classId})`);
        }

        // Insert subjects for this semester
        const subjKey = `sem${sem}`;
        const subjectList = templates[subjKey] || [];
        const subjectIds = [];
        for (const subj of subjectList) {
          // Prefix all codes with dept code to ensure global uniqueness
          const uniqueCode = `${deptInfo.code}_${subj.code}`;

          const [existing] = await conn.execute(
            'SELECT id FROM subjects WHERE subject_code=? AND department_id=?',
            [uniqueCode, dId]
          );
          let subjId;
          if (existing.length) {
            subjId = existing[0].id;
          } else {
            const [res] = await conn.execute(
              'INSERT INTO subjects (subject_code, subject_name, department_id, semester, hours_per_week, subject_type, credits) VALUES (?,?,?,?,?,?,?)',
              [uniqueCode, subj.name, dId, sem, subj.hrs, subj.type, subj.credits]
            );
            subjId = res.insertId;
          }
          subjectIds.push({ id: subjId, type: subj.type });
        }
        console.log(`  ✓ ${subjectList.length} subjects ready for ${deptInfo.code} Sem${sem}`);

        // Assign faculty to subjects for this class
        let assignCount = 0;
        for (let i = 0; i < subjectIds.length; i++) {
          const staff = staffIds[i % staffIds.length];
          const subj  = subjectIds[i];
          const [ex] = await conn.execute(
            'SELECT id FROM subject_faculty WHERE subject_id=? AND staff_id=? AND class_id=?',
            [subj.id, staff, classId]
          );
          if (!ex.length) {
            await conn.execute(
              'INSERT INTO subject_faculty (subject_id, staff_id, class_id) VALUES (?,?,?)',
              [subj.id, staff, classId]
            );
            assignCount++;
          }
        }
        console.log(`  ✓ ${assignCount} new faculty assignments for ${deptInfo.code} Sem${sem} Class${classId}`);

        // Add subject colors
        for (const subj of subjectIds) {
          const colors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#a855f7'];
          await conn.execute(
            'INSERT IGNORE INTO subject_colors (subject_id, color_hex) VALUES (?,?)',
            [subj.id, colors[subj.id % colors.length]]
          );
        }
      }
    }

    await conn.commit();
    console.log('\n✅ All departments seeded successfully!\n');

    // Summary
    const [summary] = await conn.execute(`
      SELECT d.code,
        (SELECT COUNT(*) FROM staff s WHERE s.department_id=d.id AND s.status='active') as staff,
        (SELECT COUNT(*) FROM classes c WHERE c.department_id=d.id) as classes,
        (SELECT COUNT(*) FROM subjects sub WHERE sub.department_id=d.id) as subjects,
        (SELECT COUNT(*) FROM subject_faculty sf JOIN classes c ON sf.class_id=c.id WHERE c.department_id=d.id) as assignments
      FROM departments d ORDER BY d.id`);

    console.log('\n📊 Summary:');
    console.log('Dept | Staff | Classes | Subjects | Assignments');
    console.log('-----|-------|---------|----------|------------');
    for (const r of summary) {
      console.log(`${r.code.padEnd(4)} | ${String(r.staff).padEnd(5)} | ${String(r.classes).padEnd(7)} | ${String(r.subjects).padEnd(8)} | ${r.assignments}`);
    }

  } catch (err) {
    await conn.rollback();
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedAllDepartments();
