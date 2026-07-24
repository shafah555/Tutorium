-- Tutorium Database Schema (PostgreSQL)
-- This file is a reference/backup schema mirroring the Sequelize models.
-- Sequelize's sequelize.sync() or migrations will create these automatically;
-- use this file for manual setup, backups, or restoring on a fresh PostgreSQL instance.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    "phoneVerified" BOOLEAN DEFAULT FALSE,
    "otpCode" VARCHAR(10),
    "otpExpiresAt" TIMESTAMP,
    "resetToken" VARCHAR(255),
    "resetTokenExpiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "rollNo" VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    "fatherName" VARCHAR(255),
    "motherName" VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    "guardianPhone" VARCHAR(50),
    school VARCHAR(255),
    class VARCHAR(50),
    "group" VARCHAR(50),
    "hscYear" INTEGER NOT NULL,
    address TEXT,
    "joiningDate" DATE NOT NULL,
    "completionDate" DATE,
    "monthlyFee" NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','inactive')),
    photo VARCHAR(255),
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_payments (
    id SERIAL PRIMARY KEY,
    "studentId" INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "monthlyFee" NUMERIC(10,2) NOT NULL DEFAULT 0,
    "paidAmount" NUMERIC(10,2) NOT NULL DEFAULT 0,
    "dueAmount" NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'due' CHECK (status IN ('paid','partial','due')),
    "paymentDate" DATE,
    "paymentMethod" VARCHAR(50),
    "receiptNo" VARCHAR(50),
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE ("studentId", month, year)
);

CREATE TABLE IF NOT EXISTS model_tests (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    "examDate" DATE,
    fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_test_payments (
    id SERIAL PRIMARY KEY,
    "studentId" INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    "testId" INTEGER NOT NULL REFERENCES model_tests(id) ON DELETE CASCADE,
    "paidAmount" NUMERIC(10,2) NOT NULL DEFAULT 0,
    "paymentDate" DATE NOT NULL,
    "receiptNo" VARCHAR(50),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_receipts (
    id SERIAL PRIMARY KEY,
    "receiptNo" VARCHAR(50) NOT NULL UNIQUE,
    "studentId" INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    "paymentType" VARCHAR(20) NOT NULL CHECK ("paymentType" IN ('tuition','model_test')),
    details JSONB,
    amount NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    "paymentMethod" VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    "instituteName" VARCHAR(255) DEFAULT 'Tutorium',
    "tutorName" VARCHAR(255),
    phone VARCHAR(50),
    logo TEXT,
    signature TEXT,
    "googleFormLink" VARCHAR(500),
    "receiptFooter" TEXT,
    "monthlyFeeDefault" NUMERIC(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'BDT',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    meta JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_roll_no ON students("userId", "rollNo");
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_hscyear ON students("hscYear");
CREATE INDEX IF NOT EXISTS idx_payments_student ON monthly_payments("studentId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON monthly_payments(status);