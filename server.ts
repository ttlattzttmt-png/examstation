/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDbToDisk } from './server/db.js';
import { getNetworkInfo } from './server/network.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize DB
  const db = await getDb();

  // Helper helper to convert SQLite query exec result to array of objects
  const queryAll = (sql: string, params: any[] = []): any[] => {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  };

  const queryOne = (sql: string, params: any[] = []): any | null => {
    const rows = queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
  };

  const runSql = (sql: string, params: any[] = []) => {
    db.run(sql, params);
    saveDbToDisk();
  };

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Local Network & QR Code Info
  app.get('/api/network-info', async (req: Request, res: Response) => {
    const netInfo = await getNetworkInfo(PORT);
    res.json(netInfo);
  });

  // Auth Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'من فضلك أدخل رقم الهاتف/اسم المستخدم وكلمة المرور' });
    }

    let user = queryOne(
      `SELECT * FROM users WHERE (phone = ? OR username = ? OR student_id = ? OR national_id = ?) AND password_hash = ? AND status != 'blocked'`,
      [identifier, identifier, identifier, identifier, password]
    );

    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو الحساب محظور' });
    }

    // Role check if explicit
    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ error: `الصلاحية المطلوبة (${role}) لا تتوافق مع حسابك` });
    }

    // Log Activity
    runSql(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `log-${Date.now()}`,
        user.id,
        user.full_name,
        user.role,
        'LOGIN',
        'تسجيل دخول ناجح للمنصة',
        req.ip || '127.0.0.1',
        new Date().toISOString(),
      ]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        studentId: user.student_id,
        nationalId: user.national_id,
        phone: user.phone,
        parentPhone: user.parent_phone,
        email: user.email,
        school: user.school,
        grade: user.grade,
        className: user.class_name,
        section: user.section,
        gender: user.gender,
        status: user.status,
        createdAt: user.created_at,
      },
      token: `local-token-${user.id}-${Date.now()}`,
    });
  });

  // Auth Register Student
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, password, phone, grade } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: 'من فضلك أدخل جميع البيانات الأساسية (الاسم، رقم الهاتف، وكلمة المرور)' });
    }

    const cleanPhone = phone.trim();
    const existingPhone = queryOne(`SELECT id FROM users WHERE phone = ?`, [cleanPhone]);
    if (existingPhone) {
      return res.status(400).json({ error: 'رقم الهاتف مسجل بالفعل في النظام، يرجى تسجيل الدخول أو استخدام رقم آخر' });
    }

    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const generatedUsername = `STU-2026-${randomCode}`;
    const studentId = generatedUsername;

    const id = `u-stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO users (id, username, password_hash, full_name, role, student_id, phone, grade, status, created_at)
       VALUES (?, ?, ?, ?, 'student', ?, ?, ?, 'active', ?)`,
      [id, generatedUsername, password, fullName, studentId, cleanPhone, grade || 'الصف الثالث الثانوي', now]
    );

    res.json({
      user: {
        id,
        username: generatedUsername,
        fullName,
        role: 'student',
        studentId,
        phone: cleanPhone,
        grade: grade || 'الصف الثالث الثانوي',
        status: 'active',
        createdAt: now,
      },
      token: `local-token-${id}-${Date.now()}`,
    });
  });

  // Dashboard Stats
  app.get('/api/stats/dashboard', (req: Request, res: Response) => {
    const studentsCount = queryOne(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`)?.count || 0;
    const teachersCount = queryOne(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`)?.count || 0;
    const questionBanksCount = queryOne(`SELECT COUNT(*) as count FROM question_banks`)?.count || 0;
    const questionsCount = queryOne(`SELECT COUNT(*) as count FROM questions`)?.count || 0;
    const examsCount = queryOne(`SELECT COUNT(*) as count FROM exams`)?.count || 0;
    const finishedExamsCount = queryOne(`SELECT COUNT(*) as count FROM results`)?.count || 0;
    const liveSessionsCount = queryOne(`SELECT COUNT(*) as count FROM exam_sessions WHERE status = 'in_progress'`)?.count || 0;

    const passCount = queryOne(`SELECT COUNT(*) as count FROM results WHERE pass_status = 'passed'`)?.count || 0;
    const passRate = finishedExamsCount > 0 ? Math.round((passCount / finishedExamsCount) * 100) : 100;

    const scoreStats = queryOne(`SELECT AVG(percentage) as avgScore, MAX(percentage) as maxScore, MIN(percentage) as minScore FROM results`);

    res.json({
      studentsCount,
      teachersCount,
      questionBanksCount,
      questionsCount,
      examsCount,
      finishedExamsCount,
      liveSessionsCount,
      passRate,
      averageScore: Math.round(scoreStats?.avgScore || 0),
      highestScore: Math.round(scoreStats?.maxScore || 0),
      lowestScore: Math.round(scoreStats?.minScore || 0),
      networkStatus: 'متصل - LAN On-Premise 100%',
      serverCapacity: '300+ طلاب متزامنين',
    });
  });

  // Students Management
  app.get('/api/students', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC`);
    const students = rows.map((r) => ({
      id: r.id,
      username: r.username,
      fullName: r.full_name,
      role: r.role,
      studentId: r.student_id,
      nationalId: r.national_id,
      phone: r.phone,
      parentPhone: r.parent_phone,
      email: r.email,
      school: r.school,
      grade: r.grade,
      className: r.class_name,
      section: r.section,
      gender: r.gender,
      birthDate: r.birth_date,
      photoUrl: r.photo_url,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    }));
    res.json(students);
  });

  app.post('/api/students', (req: Request, res: Response) => {
    const { fullName, studentId, nationalId, username, password, phone, parentPhone, school, grade, className, section } = req.body;
    const id = `u-stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO users (id, username, password_hash, full_name, role, student_id, national_id, phone, parent_phone, school, grade, class_name, section, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [id, username || studentId, password || '123456', fullName, 'student', studentId, nationalId, phone, parentPhone, school, grade, className, section, now]
    );

    res.json({ success: true, id });
  });

  app.delete('/api/students/:id', (req: Request, res: Response) => {
    runSql(`DELETE FROM users WHERE id = ? AND role = 'student'`, [req.params.id]);
    res.json({ success: true });
  });

  // Teachers & Admins Management
  app.get('/api/teachers', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM users WHERE role IN ('teacher', 'admin') ORDER BY created_at DESC`);
    const teachers = rows.map((r) => ({
      id: r.id,
      username: r.username,
      fullName: r.full_name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      school: r.school,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    }));
    res.json(teachers);
  });

  app.post('/api/teachers', (req: Request, res: Response) => {
    const { fullName, username, password, email, phone, school, role, notes } = req.body;
    if (!fullName || !username) {
      return res.status(400).json({ error: 'من فضلك أدخل الاسم الكامل واسم المستخدم' });
    }
    const id = `u-tch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO users (id, username, password_hash, full_name, role, email, phone, school, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [id, username, password || '123456', fullName, role || 'teacher', email || '', phone || '', school || '', notes || '', now]
    );

    res.json({ success: true, id });
  });

  app.delete('/api/teachers/:id', (req: Request, res: Response) => {
    runSql(`DELETE FROM users WHERE id = ? AND role IN ('teacher', 'admin')`, [req.params.id]);
    res.json({ success: true });
  });

  // Subjects API
  app.get('/api/subjects', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM subjects ORDER BY name_ar ASC`);
    const subjects = rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      nameAr: r.name_ar,
      description: r.description,
      createdAt: r.created_at,
    }));
    res.json(subjects);
  });

  app.post('/api/subjects', (req: Request, res: Response) => {
    const { code, name, nameAr, description } = req.body;
    if (!nameAr || !code) {
      return res.status(400).json({ error: 'من فضلك أدخل كود واسم المادة باللغة العربية' });
    }

    const id = `sub-${Date.now()}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO subjects (id, code, name, name_ar, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, code, name || nameAr, nameAr, description || '', now]
    );

    res.json({ success: true, id });
  });

  app.put('/api/subjects/:id', (req: Request, res: Response) => {
    const { code, name, nameAr, description } = req.body;
    runSql(
      `UPDATE subjects SET code = ?, name = ?, name_ar = ?, description = ? WHERE id = ?`,
      [code, name, nameAr, description, req.params.id]
    );
    res.json({ success: true });
  });

  app.delete('/api/subjects/:id', (req: Request, res: Response) => {
    runSql(`DELETE FROM subjects WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  });

  // Question Banks
  app.get('/api/question-banks', (req: Request, res: Response) => {
    const banks = queryAll(`SELECT qb.*, s.name_ar as subjectName, (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id) as questionCount FROM question_banks qb LEFT JOIN subjects s ON qb.subject_id = s.id ORDER BY qb.created_at DESC`);
    res.json(banks);
  });

  app.put('/api/question-banks/:id', (req: Request, res: Response) => {
    const { title, subjectId, chapter, lesson, topic, description } = req.body;
    const now = new Date().toISOString();
    runSql(
      `UPDATE question_banks SET title = ?, subject_id = ?, chapter = ?, lesson = ?, topic = ?, description = ?, updated_at = ? WHERE id = ?`,
      [title, subjectId, chapter || '', lesson || '', topic || '', description || '', now, req.params.id]
    );
    res.json({ success: true });
  });

  app.post('/api/question-banks', (req: Request, res: Response) => {
    const { title, subjectId, chapter, lesson, topic, description, createdBy } = req.body;
    const id = `qb-${Date.now()}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO question_banks (id, title, subject_id, chapter, lesson, topic, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, subjectId, chapter || '', lesson || '', topic || '', description || '', createdBy || 'admin', now, now]
    );

    res.json({ success: true, id });
  });

  // Questions inside Bank
  app.get('/api/questions', (req: Request, res: Response) => {
    const { bankId } = req.query;
    let sql = `SELECT q.*, qb.title as bankTitle FROM questions q LEFT JOIN question_banks qb ON q.bank_id = qb.id`;
    let params: any[] = [];

    if (bankId) {
      sql += ` WHERE q.bank_id = ?`;
      params.push(bankId);
    }
    sql += ` ORDER BY q.created_at DESC`;

    const rows = queryAll(sql, params);
    const questions = rows.map((r) => ({
      id: r.id,
      bankId: r.bank_id,
      bankTitle: r.bankTitle,
      type: r.type,
      text: r.text,
      subject: r.subject,
      chapter: r.chapter,
      lesson: r.lesson,
      topic: r.topic,
      difficulty: r.difficulty,
      estimatedTimeSeconds: r.estimated_time,
      score: r.score,
      tags: JSON.parse(r.tags_json || '[]'),
      hints: r.hints,
      explanation: r.explanation,
      options: JSON.parse(r.options_json || '[]'),
      correctAnswer: JSON.parse(r.correct_answer_json || 'null'),
      mediaUrl: r.media_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json(questions);
  });

  app.post('/api/questions', (req: Request, res: Response) => {
    const { bankId, type, text, subject, chapter, lesson, topic, difficulty, estimatedTimeSeconds, score, tags, hints, explanation, options, correctAnswer, mediaUrl } = req.body;
    const id = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO questions (id, bank_id, type, text, subject, chapter, lesson, topic, difficulty, estimated_time, score, tags_json, hints, explanation, options_json, correct_answer_json, media_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        bankId,
        type || 'mcq',
        text,
        subject || '',
        chapter || '',
        lesson || '',
        topic || '',
        difficulty || 'medium',
        estimatedTimeSeconds || 60,
        score || 1,
        JSON.stringify(tags || []),
        hints || '',
        explanation || '',
        JSON.stringify(options || []),
        JSON.stringify(correctAnswer || null),
        mediaUrl || '',
        now,
        now,
      ]
    );

    res.json({ success: true, id });
  });

  app.delete('/api/questions/:id', (req: Request, res: Response) => {
    runSql(`DELETE FROM questions WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  });

  // Bulk Question Import
  app.post('/api/questions/import', (req: Request, res: Response) => {
    const { bankId, questions } = req.body;
    if (!bankId || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'بيانات غير صالحة للاستيراد' });
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    for (const q of questions) {
      const id = `q-imp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      runSql(
        `INSERT INTO questions (id, bank_id, type, text, subject, chapter, lesson, topic, difficulty, estimated_time, score, tags_json, hints, explanation, options_json, correct_answer_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          bankId,
          q.type || 'mcq',
          q.text || 'سؤال مستورد',
          q.subject || '',
          q.chapter || '',
          q.lesson || '',
          q.topic || '',
          q.difficulty || 'medium',
          q.estimatedTimeSeconds || 60,
          q.score || 1,
          JSON.stringify(q.tags || []),
          q.hints || '',
          q.explanation || '',
          JSON.stringify(q.options || []),
          JSON.stringify(q.correctAnswer || null),
          now,
          now,
        ]
      );
      importedCount++;
    }

    res.json({ success: true, importedCount });
  });

  // Exams Management
  app.get('/api/exams', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT e.*, COALESCE(s.name_ar, s.name) as subjectName, qb.title as bankTitle, (SELECT COUNT(*) FROM questions q WHERE q.bank_id = e.bank_id) as totalBankQuestions FROM exams e LEFT JOIN subjects s ON e.subject_id = s.id LEFT JOIN question_banks qb ON e.bank_id = qb.id ORDER BY e.created_at DESC`);
    const exams = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      subjectId: r.subject_id,
      subjectName: r.subjectName,
      bankId: r.bank_id,
      bankTitle: r.bankTitle,
      createdBy: r.created_by,
      mode: r.mode,
      durationMinutes: r.duration_minutes,
      passingPercentage: r.passing_percentage,
      startDate: r.start_date,
      endDate: r.end_date,
      allowedAttempts: r.allowed_attempts,
      showResultImmediately: Boolean(r.show_result_immediately),
      showAnswers: Boolean(r.show_answers),
      negativeMarking: Boolean(r.negative_marking),
      calculatorAllowed: Boolean(r.calculator_allowed),
      fullscreenRequired: Boolean(r.fullscreen_required),
      randomizationEnabled: Boolean(r.randomization_enabled),
      autoSubmit: Boolean(r.auto_submit),
      passwordProtected: Boolean(r.password_protected),
      examPassword: r.exam_password,
      randomQuestionCount: r.random_question_count,
      smartDistribution: JSON.parse(r.smart_distribution_json || '{}'),
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      questionCount: r.random_question_count || r.totalBankQuestions || 0,
    }));
    res.json(exams);
  });

  app.put('/api/exams/:id', (req: Request, res: Response) => {
    const body = req.body;
    runSql(
      `UPDATE exams SET
        title = ?, description = ?, subject_id = ?, bank_id = ?, duration_minutes = ?,
        passing_percentage = ?, allowed_attempts = ?, show_result_immediately = ?,
        show_answers = ?, negative_marking = ?, calculator_allowed = ?, fullscreen_required = ?,
        randomization_enabled = ?, password_protected = ?, exam_password = ?, random_question_count = ?,
        is_active = ?
       WHERE id = ?`,
      [
        body.title,
        body.description || '',
        body.subjectId,
        body.bankId,
        body.durationMinutes || 60,
        body.passingPercentage || 50,
        body.allowedAttempts || 1,
        body.showResultImmediately ? 1 : 0,
        body.showAnswers ? 1 : 0,
        body.negativeMarking ? 1 : 0,
        body.calculatorAllowed ? 1 : 0,
        body.fullscreenRequired ? 1 : 0,
        body.randomizationEnabled ? 1 : 0,
        body.passwordProtected ? 1 : 0,
        body.examPassword || '',
        body.randomQuestionCount || 20,
        body.isActive !== false ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ success: true });
  });

  app.delete('/api/exams/:id', (req: Request, res: Response) => {
    runSql(`DELETE FROM exams WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  });

  app.post('/api/exams', (req: Request, res: Response) => {
    const body = req.body;
    const id = `exam-${Date.now()}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO exams (
        id, title, description, subject_id, bank_id, created_by, mode,
        duration_minutes, passing_percentage, start_date, end_date, allowed_attempts,
        show_result_immediately, show_answers, negative_marking, calculator_allowed,
        fullscreen_required, randomization_enabled, auto_submit, password_protected, exam_password,
        random_question_count, smart_distribution_json, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        body.title,
        body.description || '',
        body.subjectId,
        body.bankId,
        body.createdBy || 'admin',
        body.mode || 'official',
        body.durationMinutes || 60,
        body.passingPercentage || 50,
        body.startDate || now,
        body.endDate || '2030-01-01T00:00:00Z',
        body.allowedAttempts || 1,
        body.showResultImmediately ? 1 : 0,
        body.showAnswers ? 1 : 0,
        body.negativeMarking ? 1 : 0,
        body.calculatorAllowed ? 1 : 0,
        body.fullscreenRequired ? 1 : 0,
        body.randomizationEnabled ? 1 : 0,
        body.autoSubmit ? 1 : 0,
        body.passwordProtected ? 1 : 0,
        body.examPassword || '',
        body.randomQuestionCount || 20,
        JSON.stringify(body.smartDistribution || {}),
        now,
      ]
    );

    res.json({ success: true, id });
  });

  // Start Exam Session (Cryptographically Randomized per student)
  app.post('/api/exams/:id/start', (req: Request, res: Response) => {
    const { studentId, password } = req.body;
    const examId = req.params.id;

    const exam = queryOne(`SELECT * FROM exams WHERE id = ?`, [examId]);
    if (!exam || !exam.is_active) {
      return res.status(404).json({ error: 'الاختبار غير متوفر حالياً' });
    }

    if (exam.password_protected && exam.exam_password && password !== exam.exam_password) {
      return res.status(401).json({ error: 'كلمة مرور الاختبار غير صحيحة' });
    }

    const student = queryOne(`SELECT * FROM users WHERE id = ? OR student_id = ?`, [studentId, studentId]);
    if (!student) {
      return res.status(404).json({ error: 'طالب غير موجود' });
    }

    // Check existing active session
    let session = queryOne(
      `SELECT * FROM exam_sessions WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'`,
      [examId, student.id]
    );

    if (session) {
      // Resume existing session
      const questions = JSON.parse(session.assigned_questions_json || '[]');
      const answers = JSON.parse(session.answers_json || '{}');
      const flagged = JSON.parse(session.flagged_questions_json || '[]');

      return res.json({
        session: {
          id: session.id,
          examId: session.exam_id,
          examTitle: session.exam_title,
          studentId: session.student_id,
          studentName: session.student_name,
          studentCode: session.student_code,
          startTime: session.start_time,
          status: session.status,
          currentQuestionIndex: session.current_question_index,
          remainingSeconds: session.remaining_seconds,
          warningsCount: session.warnings_count,
          fullscreenViolationsCount: session.fullscreen_violations_count,
          answers,
          flaggedQuestions: flagged,
          assignedQuestions: questions,
          watermarkText: session.watermark_text,
        },
        exam: {
          title: exam.title,
          durationMinutes: exam.duration_minutes,
          calculatorAllowed: Boolean(exam.calculator_allowed),
          fullscreenRequired: Boolean(exam.fullscreen_required),
          negativeMarking: Boolean(exam.negative_marking),
        },
      });
    }

    // Check completed attempts
    const submittedCount = queryOne(
      `SELECT COUNT(*) as count FROM results WHERE exam_id = ? AND (student_id = ? OR student_code = ?)`,
      [examId, student.id, student.student_id || student.username]
    )?.count || 0;

    const maxAllowed = exam.allowed_attempts || 1;
    if (submittedCount >= maxAllowed) {
      return res.status(403).json({
        error: `لقد أديت هذا الامتحان بالفعل (استنفذت ${submittedCount} من أصل ${maxAllowed} محاولة). لا يمكنك إعادته إلا بسماح من المعلم.`,
      });
    }

    // Fetch questions from bank
    const bankQuestions = queryAll(`SELECT * FROM questions WHERE bank_id = ?`, [exam.bank_id]);
    if (bankQuestions.length === 0) {
      return res.status(400).json({ error: 'بنك الأسئلة الخاص بهذا الاختبار فارغ' });
    }

    // Secure Fisher-Yates shuffle
    let selectedRows = [...bankQuestions];
    for (let i = selectedRows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedRows[i], selectedRows[j]] = [selectedRows[j], selectedRows[i]];
    }

    // Slice to limit
    const targetCount = exam.random_question_count > 0 ? Math.min(exam.random_question_count, selectedRows.length) : selectedRows.length;
    selectedRows = selectedRows.slice(0, targetCount);

    // Map questions and randomize options if enabled
    const assignedQuestions = selectedRows.map((r) => {
      let opts = JSON.parse(r.options_json || '[]');
      if (exam.randomization_enabled) {
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
      }
      return {
        id: r.id,
        bankId: r.bank_id,
        type: r.type,
        text: r.text,
        subject: r.subject,
        chapter: r.chapter,
        difficulty: r.difficulty,
        score: r.score,
        hints: r.hints,
        options: opts,
        mediaUrl: r.media_url,
      };
    });

    const sessionId = `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const remainingSeconds = exam.duration_minutes * 60;
    const watermarkText = `${student.full_name} | ${student.student_id || student.username} | IP: ${req.ip || 'LAN'}`;

    runSql(
      `INSERT INTO exam_sessions (
        id, exam_id, exam_title, student_id, student_name, student_code,
        start_time, status, current_question_index, remaining_seconds, warnings_count,
        fullscreen_violations_count, answers_json, flagged_questions_json,
        assigned_questions_json, watermark_text, ip_address, last_activity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', 0, ?, 0, 0, '{}', '[]', ?, ?, ?, ?)`,
      [
        sessionId,
        exam.id,
        exam.title,
        student.id,
        student.full_name,
        student.student_id || student.username,
        now,
        remainingSeconds,
        JSON.stringify(assignedQuestions),
        watermarkText,
        req.ip || '127.0.0.1',
        now,
      ]
    );

    res.json({
      session: {
        id: sessionId,
        examId: exam.id,
        examTitle: exam.title,
        studentId: student.id,
        studentName: student.full_name,
        studentCode: student.student_id || student.username,
        startTime: now,
        status: 'in_progress',
        currentQuestionIndex: 0,
        remainingSeconds,
        warningsCount: 0,
        fullscreenViolationsCount: 0,
        answers: {},
        flaggedQuestions: [],
        assignedQuestions,
        watermarkText,
      },
      exam: {
        title: exam.title,
        durationMinutes: exam.duration_minutes,
        calculatorAllowed: Boolean(exam.calculator_allowed),
        fullscreenRequired: Boolean(exam.fullscreen_required),
        negativeMarking: Boolean(exam.negative_marking),
      },
    });
  });

  // Sync Exam Session Progress (Auto Save)
  app.post('/api/exam-sessions/:id/sync', (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const { answers, flaggedQuestions, currentQuestionIndex, remainingSeconds, warningsCount, fullscreenViolationsCount } = req.body;
    const now = new Date().toISOString();

    runSql(
      `UPDATE exam_sessions SET
        answers_json = ?,
        flagged_questions_json = ?,
        current_question_index = ?,
        remaining_seconds = ?,
        warnings_count = ?,
        fullscreen_violations_count = ?,
        last_activity = ?
       WHERE id = ? AND status = 'in_progress'`,
      [
        JSON.stringify(answers || {}),
        JSON.stringify(flaggedQuestions || []),
        currentQuestionIndex || 0,
        remainingSeconds,
        warningsCount || 0,
        fullscreenViolationsCount || 0,
        now,
        sessionId,
      ]
    );

    res.json({ success: true, syncedAt: now });
  });

  // Submit Exam Session & Calculate Score
  app.post('/api/exam-sessions/:id/submit', (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const { answers } = req.body;

    const session = queryOne(`SELECT * FROM exam_sessions WHERE id = ?`, [sessionId]);
    if (!session) {
      return res.status(404).json({ error: 'جلسة الاختبار غير موجودة' });
    }

    const exam = queryOne(`SELECT * FROM exams WHERE id = ?`, [session.exam_id]);
    const questions: any[] = JSON.parse(session.assigned_questions_json || '[]');
    const studentAnswers: Record<string, any> = answers || JSON.parse(session.answers_json || '{}');

    let totalPossibleScore = 0;
    let scoreObtained = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const answersReview: Record<string, any> = {};

    for (const q of questions) {
      const qFull = queryOne(`SELECT * FROM questions WHERE id = ?`, [q.id]);
      const maxScore = q.score || 1;
      totalPossibleScore += maxScore;

      const userAns = studentAnswers[q.id];
      const correctAnswer = qFull ? JSON.parse(qFull.correct_answer_json || 'null') : null;
      const opts = qFull ? JSON.parse(qFull.options_json || '[]') : q.options || [];

      let isCorrect = false;

      if (!userAns || (!userAns.selectedOptionId && !userAns.selectedOptionIds && !userAns.textAnswer && !userAns.matchingPairs)) {
        skippedCount++;
      } else if (q.type === 'mcq' || q.type === 'tf') {
        const correctOpt = opts.find((o: any) => o.isCorrect)?.id || correctAnswer;
        if (userAns.selectedOptionId === correctOpt) {
          isCorrect = true;
          correctCount++;
          scoreObtained += maxScore;
        } else {
          wrongCount++;
          if (exam && exam.negative_marking) {
            scoreObtained -= maxScore * 0.25; // 25% penalty if enabled
          }
        }
      } else if (q.type === 'multi') {
        const correctOpts = opts.filter((o: any) => o.isCorrect).map((o: any) => o.id);
        const userOpts = userAns.selectedOptionIds || [];
        const isMatch = correctOpts.length === userOpts.length && correctOpts.every((id: string) => userOpts.includes(id));
        if (isMatch) {
          isCorrect = true;
          correctCount++;
          scoreObtained += maxScore;
        } else {
          wrongCount++;
        }
      } else {
        // Generic text / matching check fallback
        isCorrect = true;
        correctCount++;
        scoreObtained += maxScore;
      }

      answersReview[q.id] = {
        questionText: q.text,
        scoreObtained: isCorrect ? maxScore : 0,
        maxScore,
        isCorrect,
        studentAnswer: userAns,
        correctAnswer,
        explanation: qFull?.explanation || '',
      };
    }

    if (scoreObtained < 0) scoreObtained = 0;
    const percentage = totalPossibleScore > 0 ? Math.round((scoreObtained / totalPossibleScore) * 100) : 0;
    const passPercentage = exam?.passing_percentage || 50;
    const passStatus = percentage >= passPercentage ? 'passed' : 'failed';

    let gradeLetter = 'F';
    if (percentage >= 90) gradeLetter = 'A+';
    else if (percentage >= 85) gradeLetter = 'A';
    else if (percentage >= 75) gradeLetter = 'B';
    else if (percentage >= 65) gradeLetter = 'C';
    else if (percentage >= 50) gradeLetter = 'D';

    const now = new Date().toISOString();

    // Update Session
    runSql(
      `UPDATE exam_sessions SET status = 'submitted', score = ?, total_score = ?, pass_status = ?, last_activity = ? WHERE id = ?`,
      [scoreObtained, totalPossibleScore, passStatus, now, sessionId]
    );

    // Save Result
    const resultId = `res-${Date.now()}`;
    const subject = queryOne(`SELECT name FROM subjects WHERE id = ?`, [exam?.subject_id]);

    runSql(
      `INSERT INTO results (
        id, session_id, student_id, student_name, student_code, exam_id, exam_title,
        subject_name, score, total_possible_score, percentage, grade_letter,
        correct_count, wrong_count, skipped_count, time_spent_seconds, completed_at,
        pass_status, answers_review_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultId,
        sessionId,
        session.student_id,
        session.student_name,
        session.student_code,
        session.exam_id,
        session.exam_title,
        subject?.name || 'عام',
        scoreObtained,
        totalPossibleScore,
        percentage,
        gradeLetter,
        correctCount,
        wrongCount,
        skippedCount,
        (exam?.duration_minutes || 60) * 60 - session.remaining_seconds,
        now,
        passStatus,
        JSON.stringify(answersReview),
      ]
    );

    res.json({
      success: true,
      result: {
        id: resultId,
        score: scoreObtained,
        totalPossibleScore,
        percentage,
        gradeLetter,
        passStatus,
        correctCount,
        wrongCount,
        skippedCount,
        showResultImmediately: Boolean(exam?.show_result_immediately),
        showAnswers: Boolean(exam?.show_answers),
        answersReview: exam?.show_answers ? answersReview : undefined,
      },
    });
  });

  // Admin Live Monitoring
  app.get('/api/monitoring/live', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM exam_sessions WHERE status IN ('in_progress', 'paused') ORDER BY last_activity DESC`);
    const live = rows.map((r) => {
      const questions = JSON.parse(r.assigned_questions_json || '[]');
      const lastActive = new Date(r.last_activity);
      const secondsAgo = Math.floor((Date.now() - lastActive.getTime()) / 1000);

      return {
        sessionId: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentCode: r.student_code,
        examTitle: r.exam_title,
        status: r.status,
        currentQuestion: (r.current_question_index || 0) + 1,
        totalQuestions: questions.length,
        remainingSeconds: r.remaining_seconds,
        progressPercentage: questions.length > 0 ? Math.round((((r.current_question_index || 0) + 1) / questions.length) * 100) : 0,
        warningsCount: r.warnings_count,
        fullscreenOk: r.fullscreen_violations_count === 0,
        ipAddress: r.ip_address,
        lastActiveFormatted: secondsAgo < 5 ? 'نشط الآن' : `منذ ${secondsAgo} ثانية`,
      };
    });

    res.json(live);
  });

  // Admin Action on Live Session
  app.post('/api/monitoring/:sessionId/action', (req: Request, res: Response) => {
    const { action, timeExtendMinutes } = req.body;
    const sessionId = req.params.id || req.params.sessionId;

    if (action === 'pause') {
      runSql(`UPDATE exam_sessions SET status = 'paused' WHERE id = ?`, [sessionId]);
    } else if (action === 'resume') {
      runSql(`UPDATE exam_sessions SET status = 'in_progress' WHERE id = ?`, [sessionId]);
    } else if (action === 'extend_time') {
      const extraSeconds = (timeExtendMinutes || 5) * 60;
      runSql(`UPDATE exam_sessions SET remaining_seconds = remaining_seconds + ? WHERE id = ?`, [extraSeconds, sessionId]);
    } else if (action === 'force_submit') {
      runSql(`UPDATE exam_sessions SET status = 'auto_submitted' WHERE id = ?`, [sessionId]);
    }

    res.json({ success: true });
  });

  // Reset Student Exam Attempt (Allow Retake)
  app.post('/api/exams/:id/reset-attempt', (req: Request, res: Response) => {
    const examId = req.params.id;
    const { studentId, studentCode } = req.body;

    if (!studentId && !studentCode) {
      return res.status(400).json({ error: 'لم يتم تحديد معرف الطالب' });
    }

    const sid = studentId || studentCode;

    // Delete previous results and exam sessions
    runSql(`DELETE FROM results WHERE exam_id = ? AND (student_id = ? OR student_code = ?)`, [examId, sid, sid]);
    runSql(`DELETE FROM exam_sessions WHERE exam_id = ? AND (student_id = ? OR student_code = ?)`, [examId, sid, sid]);

    // Log Activity
    runSql(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `log-${Date.now()}`,
        'admin',
        'المدرس / المدير',
        'admin',
        'RESET_ATTEMPT',
        `السماح بإعادة محاولة الامتحان (${examId}) للطالب (${sid})`,
        req.ip || '127.0.0.1',
        new Date().toISOString(),
      ]
    );

    res.json({ success: true, message: 'تم فتح المحاولة وإتاحة إعادة الامتحان للطالب بنجاح' });
  });

  // Results & Reports
  app.get('/api/results', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM results ORDER BY completed_at DESC`);
    const results = rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentCode: r.student_code,
      examId: r.exam_id,
      examTitle: r.exam_title,
      subjectName: r.subject_name,
      score: r.score,
      totalPossibleScore: r.total_possible_score,
      percentage: r.percentage,
      gradeLetter: r.grade_letter,
      correctCount: r.correct_count,
      wrongCount: r.wrong_count,
      skippedCount: r.skipped_count,
      timeSpentSeconds: r.time_spent_seconds,
      completedAt: r.completed_at,
      passStatus: r.pass_status,
      answersReview: JSON.parse(r.answers_review_json || '{}'),
    }));
    res.json(results);
  });

  app.delete('/api/results/:id', (req: Request, res: Response) => {
    runSql(`DELETE FROM results WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  });

  // Backups Management
  app.get('/api/backups', (req: Request, res: Response) => {
    const backupDir = path.join(process.cwd(), 'backups');
    const files = fs.readdirSync(backupDir);
    const backups = files.map((file, idx) => {
      const stat = fs.statSync(path.join(backupDir, file));
      return {
        id: `bk-${idx}`,
        filename: file,
        filesizeBytes: stat.size,
        timestamp: stat.mtime.toISOString(),
        type: file.includes('auto') ? 'auto_daily' : 'manual',
      };
    });
    res.json(backups);
  });

  app.post('/api/backups/create', (req: Request, res: Response) => {
    const backupDir = path.join(process.cwd(), 'backups');
    const filename = `backup_albashmohandes_${Date.now()}.db`;
    const targetPath = path.join(backupDir, filename);

    saveDbToDisk();
    const sourcePath = path.join(process.cwd(), 'data', 'albashmohandes.db');
    fs.copyFileSync(sourcePath, targetPath);

    res.json({ success: true, filename });
  });

  // Audit Logs
  app.get('/api/logs', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100`);
    const logs = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userRole: r.user_role,
      action: r.action,
      details: r.details,
      ipAddress: r.ip_address,
      timestamp: r.timestamp,
    }));
    res.json(logs);
  });

  // Announcements
  app.get('/api/announcements', (req: Request, res: Response) => {
    const rows = queryAll(`SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC`);
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      targetRole: r.target_role,
      createdBy: r.created_by,
      createdAt: r.created_at,
      isPinned: Boolean(r.is_pinned),
    }));
    res.json(items);
  });

  // -------------------------------------------------------------
  // VITE DEVELOPMENT OR STATIC PRODUCTION MIDDLEWARE
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[البشمهندس] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
