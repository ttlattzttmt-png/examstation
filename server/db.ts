/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_FILE = path.join(DATA_DIR, 'albashmohandes.db');

let db: Database | null = null;

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error loading existing SQLite database, initializing fresh:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  initTables(db);
  saveDbToDisk();
  return db;
}

export function saveDbToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initTables(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      full_name TEXT,
      role TEXT,
      student_id TEXT,
      national_id TEXT,
      phone TEXT,
      parent_phone TEXT,
      email TEXT,
      school TEXT,
      grade TEXT,
      class_name TEXT,
      section TEXT,
      gender TEXT,
      birth_date TEXT,
      photo_url TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      name_ar TEXT,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT,
      email TEXT,
      phone TEXT,
      subject_ids_json TEXT,
      permissions_json TEXT,
      assigned_grades_json TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS question_banks (
      id TEXT PRIMARY KEY,
      title TEXT,
      subject_id TEXT,
      chapter TEXT,
      lesson TEXT,
      topic TEXT,
      description TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      bank_id TEXT,
      type TEXT,
      text TEXT,
      subject TEXT,
      chapter TEXT,
      lesson TEXT,
      topic TEXT,
      difficulty TEXT,
      estimated_time INTEGER,
      score REAL,
      tags_json TEXT,
      hints TEXT,
      explanation TEXT,
      options_json TEXT,
      correct_answer_json TEXT,
      media_url TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      subject_id TEXT,
      bank_id TEXT,
      created_by TEXT,
      mode TEXT,
      duration_minutes INTEGER,
      passing_percentage REAL,
      start_date TEXT,
      end_date TEXT,
      allowed_attempts INTEGER,
      show_result_immediately INTEGER,
      show_answers INTEGER,
      negative_marking INTEGER,
      calculator_allowed INTEGER,
      fullscreen_required INTEGER,
      randomization_enabled INTEGER,
      auto_submit INTEGER,
      password_protected INTEGER,
      exam_password TEXT,
      random_question_count INTEGER,
      smart_distribution_json TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      exam_id TEXT,
      exam_title TEXT,
      student_id TEXT,
      student_name TEXT,
      student_code TEXT,
      start_time TEXT,
      end_time TEXT,
      status TEXT,
      current_question_index INTEGER,
      remaining_seconds INTEGER,
      warnings_count INTEGER,
      fullscreen_violations_count INTEGER,
      answers_json TEXT,
      flagged_questions_json TEXT,
      assigned_questions_json TEXT,
      watermark_text TEXT,
      ip_address TEXT,
      last_activity TEXT,
      score REAL,
      total_score REAL,
      pass_status TEXT
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      student_id TEXT,
      student_name TEXT,
      student_code TEXT,
      exam_id TEXT,
      exam_title TEXT,
      subject_name TEXT,
      score REAL,
      total_possible_score REAL,
      percentage REAL,
      grade_letter TEXT,
      correct_count INTEGER,
      wrong_count INTEGER,
      skipped_count INTEGER,
      time_spent_seconds INTEGER,
      completed_at TEXT,
      pass_status TEXT,
      answers_review_json TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      action TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      target_role TEXT,
      created_by TEXT,
      created_at TEXT,
      is_pinned INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
    CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(bank_id);
    CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_exam_student ON exam_sessions(exam_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
  `);

  // Ensure essential subjects (including Math / الرياضيات) exist in every database
  const now = new Date().toISOString();
  const defaultSubjects = [
    ['sub-math', 'MATH-101', 'Mathematics', 'الرياضيات', 'الرياضيات العامة والجبر والهندسة والتفاضل والتكامل'],
    ['sub-phys', 'PHYS-101', 'Physics', 'الفيزياء', 'الفيزياء الكلاسيكية والحديثة والكهربية'],
    ['sub-chem', 'CHEM-101', 'Chemistry', 'الكيمياء', 'الكيمياء العضوية والتحليلية والحرارية'],
    ['sub-bio', 'BIO-101', 'Biology', 'الأحياء والعلوم الحيوية', 'علم الأحياء ووراثة وتكاثر وتراكيب خلوية'],
    ['sub-cs', 'CS-201', 'Computer Science & IT', 'الحاسب الآلي والشبكات', 'أساسيات البرمجة وقواعد البيانات والشبكات المحليّة'],
    ['sub-eng', 'ENG-101', 'English Language', 'اللغة الإنجليزية', 'قواعد وتطبيقات ولغويات ومفردات اللغة الإنجليزية'],
  ];

  for (const sub of defaultSubjects) {
    database.run(
      `INSERT OR IGNORE INTO subjects (id, code, name, name_ar, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [sub[0], sub[1], sub[2], sub[3], sub[4], now]
    );
  }

  // Check if admin user exists, seed if empty
  const adminCheck = database.exec("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!adminCheck || adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    seedDefaultData(database);
  }
}

function seedDefaultData(database: Database) {
  const now = new Date().toISOString();

  // Admin user
  database.run(
    `INSERT INTO users (id, username, password_hash, full_name, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['u-admin-1', 'admin', 'admin123', 'البشمهندس / Admin', 'admin', 'active', now]
  );

  // Demo Student
  database.run(
    `INSERT INTO users (id, username, password_hash, full_name, role, student_id, national_id, phone, school, grade, class_name, section, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['u-student-1', 'student1', '123456', 'احمد محمود السعيد', 'student', 'STU-2026-001', '30105201209988', '01012345678', 'مدرسة البشمهندس الثانوية', 'Grade 12', '12/A', 'Science', 'active', now]
  );

  database.run(
    `INSERT INTO users (id, username, password_hash, full_name, role, student_id, national_id, phone, school, grade, class_name, section, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['u-student-2', 'student2', '123456', 'سارة علي حسن', 'student', 'STU-2026-002', '30208151207766', '01198765432', 'مدرسة البشمهندس الثانوية', 'Grade 12', '12/A', 'Science', 'active', now]
  );

  // Demo Teacher
  database.run(
    `INSERT INTO users (id, username, password_hash, full_name, role, phone, email, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['u-teacher-1', 'teacher1', '123456', 'د. محمد مصطفى', 'teacher', '01200000000', 'teacher@albashmohandes.local', 'active', now]
  );

  // Demo Subjects
  database.run(
    `INSERT INTO subjects (id, code, name, name_ar, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ['sub-phys', 'PHYS-101', 'Physics', 'الفيزياء', 'الفيزياء الحديثة والكهربية', now]
  );
  database.run(
    `INSERT INTO subjects (id, code, name, name_ar, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ['sub-cs', 'CS-201', 'Computer Science & Networks', 'الحاسب الآلي والشبكات', 'أساسيات البرمجة وقواعد البيانات والشبكات المحليّة', now]
  );
  database.run(
    `INSERT INTO subjects (id, code, name, name_ar, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ['sub-chem', 'CHEM-101', 'Chemistry', 'الكيمياء', 'الكيمياء العضوية والتحليلية', now]
  );

  // Demo Question Bank
  const bankId = 'qb-phys-1';
  database.run(
    `INSERT INTO question_banks (id, title, subject_id, chapter, lesson, topic, description, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [bankId, 'بنك أسئلة الفيزياء - الكهربية الكهرومغناطيسية', 'sub-phys', 'الوحدة الأولى', 'الدرس الأول', 'قانون أوم وتوصيل المقاومات', 'بنك أسئلة شامل للكهربية والمقاومات والدوائر المغلقة', 'u-admin-1', now, now]
  );

  // Demo Questions (With LaTeX, MCQ, True/False, Matching)
  const q1Options = JSON.stringify([
    { id: 'opt-1', text: 'تزداد إلى أربعة أمثالها', isCorrect: true },
    { id: 'opt-2', text: 'تقل إلى النصف', isCorrect: false },
    { id: 'opt-3', text: 'تظل ثابته', isCorrect: false },
    { id: 'opt-4', text: 'تزداد للضعف', isCorrect: false }
  ]);
  database.run(
    `INSERT INTO questions (id, bank_id, type, text, subject, chapter, lesson, topic, difficulty, estimated_time, score, tags_json, hints, explanation, options_json, correct_answer_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'q-phys-1', bankId, 'mcq',
      'إذا زاد طول موصل معدني إلى الضعف وقلت مساحة مقطعه إلى النصف، فإن مقاومته الكهربية R تحسب بالقانون R = \\rho_e \\frac{L}{A}:',
      'الفيزياء', 'الوحدة الأولى', 'الدرس الأول', 'المقاومة الكهربية', 'medium', 60, 2,
      JSON.stringify(['كهربية', 'مقاومات', 'قانون أوم']),
      'تذكر أن المقاومة تتناسب طردياً مع الطول وعكسياً مع المساحة.',
      'R_2 = \\rho_e \\frac{2L}{A/2} = 4 R_1',
      q1Options, JSON.stringify('opt-1'), now, now
    ]
  );

  const q2Options = JSON.stringify([
    { id: 'opt-tf-1', text: 'صواب (True)', isCorrect: true },
    { id: 'opt-tf-2', text: 'خطأ (False)', isCorrect: false }
  ]);
  database.run(
    `INSERT INTO questions (id, bank_id, type, text, subject, chapter, lesson, topic, difficulty, estimated_time, score, tags_json, hints, explanation, options_json, correct_answer_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'q-phys-2', bankId, 'tf',
      'اتجاه التيار الكهربي التقليدي (الاصطلاحي) يكون من القطب الموجب إلى القطب السالب خارج المصدر.',
      'الفيزياء', 'الوحدة الأولى', 'الدرس الأول', 'التيار الكهربي', 'easy', 30, 1,
      JSON.stringify(['التيار الاصطلاحي']),
      'التيار الاصطلاحي يمثل حركة الشحنات الموجبة.',
      'العبارة صحيحة تماماً حسب التعريف الاصطلاحي.',
      q2Options, JSON.stringify('opt-tf-1'), now, now
    ]
  );

  const q3Options = JSON.stringify([
    { id: 'm1', text: 'المقاومة النوعية (\\rho_e)', matchTarget: 'Ohm · m' },
    { id: 'm2', text: 'التوصيلية الكهربية (\\sigma)', matchTarget: 'Ohm^{-1} · m^{-1}' },
    { id: 'm3', text: 'القوة الدافعة الكهربية (V_B)', matchTarget: 'Volt' }
  ]);
  database.run(
    `INSERT INTO questions (id, bank_id, type, text, subject, chapter, lesson, topic, difficulty, estimated_time, score, tags_json, hints, explanation, options_json, correct_answer_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'q-phys-3', bankId, 'matching',
      'صل كل كمية فيزيائية مع وحدة قياسها الدولية المناسبة:',
      'الفيزياء', 'الوحدة الأولى', 'الدرس الأول', 'وحدات القياس', 'hard', 90, 3,
      JSON.stringify(['وحدات', 'مطابقة']),
      'تذكر أن التوصيلية هي مقلوب المقاومة النوعية.',
      'وحدات القياس الدولية الرسمية للفيزياء.',
      q3Options, JSON.stringify({ m1: 'Ohm · m', m2: 'Ohm^{-1} · m^{-1}', m3: 'Volt' }), now, now
    ]
  );

  // Demo Exam
  const examId = 'exam-phys-2026';
  database.run(
    `INSERT INTO exams (
      id, title, description, subject_id, bank_id, created_by, mode,
      duration_minutes, passing_percentage, start_date, end_date, allowed_attempts,
      show_result_immediately, show_answers, negative_marking, calculator_allowed,
      fullscreen_required, randomization_enabled, auto_submit, password_protected,
      random_question_count, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      examId,
      'اختبار الفيزياء النهائي - التجريبي 2026',
      'اختبار شامل في وحدة الفيزياء الكهربية مع نظام حماية ومنع الغش المتقدم.',
      'sub-phys', bankId, 'u-admin-1', 'official',
      45, 60.0, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 3,
      1, 1, 0, 1,
      1, 1, 1, 0,
      20, 1, now
    ]
  );

  // Demo Announcement
  database.run(
    `INSERT INTO announcements (id, title, content, target_role, created_by, created_at, is_pinned)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'ann-1',
      'مرحباً بكم في منصة "البشمهندس" للاختبارات المحليّة (LAN)',
      'المنصة تعمل بالكامل على الشبكة الداخلية بدون الحاجة للاتصال بالإنترنت. يرجى الاطمئنان وحفظ بيانات تسجيل الدخول وتحديد الجلسة.',
      'all', 'u-admin-1', now, 1
    ]
  );

  // Initial settings
  database.run(`INSERT INTO settings (key, value) VALUES ('platformName', 'البشمهندس')`);
  database.run(`INSERT INTO settings (key, value) VALUES ('platformNameAr', 'منصة البشمهندس لإدارة الامتحانات المحليّة')`);
  database.run(`INSERT INTO settings (key, value) VALUES ('primaryColor', '#FFD600')`);
  database.run(`INSERT INTO settings (key, value) VALUES ('secondaryColor', '#000000')`);
  database.run(`INSERT INTO settings (key, value) VALUES ('maxWarningsAllowed', '3')`);

  // Activity Log
  database.run(
    `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, ip_address, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['log-1', 'u-admin-1', 'البشمهندس / Admin', 'admin', 'SYSTEM_INIT', 'تم تهيئة قاعدة البيانات المحلية SQLite بنجاح', '127.0.0.1', now]
  );
}
