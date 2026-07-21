/**
 * Seed script - generates demo data:
 * - 1 teacher account (email: demo@tutorium.app / password: Demo@1234)
 * - 50 students across a few HSC years
 * - Random monthly payments (some paid, some partial, some due)
 * - Random model tests + payments
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, User, Student, MonthlyPayment, ModelTest, ModelTestPayment, Receipt, Setting,
} = require('../../models');
const { generateRollNumber } = require('../../utils/rollNumber');
const { generatePayableMonths } = require('../../utils/monthGenerator');
const { generateReceiptNumber } = require('../../utils/receiptNumber');

const CLASSES = ['HSC 1st Year', 'HSC 2nd Year'];
const GROUPS = ['Science', 'Commerce', 'Arts'];
const SCHOOLS = ['Dhaka City College', 'Notre Dame College', 'Viqarunnisa Noon School', 'Ideal College'];
const FIRST_NAMES = ['Rafi', 'Tanvir', 'Nusrat', 'Farhan', 'Mim', 'Sadia', 'Arif', 'Rakib', 'Priya', 'Tamim', 'Nabila', 'Shakib', 'Anika', 'Imran', 'Jannat'];
const LAST_NAMES = ['Ahmed', 'Rahman', 'Islam', 'Hossain', 'Chowdhury', 'Karim', 'Akter', 'Khan', 'Sultana', 'Uddin'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return `01${Math.floor(100000000 + Math.random() * 899999999)}`.slice(0, 11);
}

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync();

  console.log('Seeding database...');

  // Teacher account (only if none exists)
  let user = await User.findOne();
  if (!user) {
    const hashed = await bcrypt.hash('Demo@1234', 10);
    user = await User.create({
      name: 'Demo Tutor',
      email: 'demo@tutorium.app',
      phone: '01700000000',
      password: hashed,
      emailVerified: true,
    });
    console.log('Created demo teacher account: demo@tutorium.app / Demo@1234');
  }

  // Settings
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      instituteName: 'Tutorium',
      tutorName: 'Demo Tutor',
      phone: '01700000000',
      currency: 'BDT',
      monthlyFeeDefault: 1500,
      receiptFooter: 'Thank you for your payment. For queries, contact your institute.',
    });
  }

  // Model tests
  const testTitles = ['Physics Model Test 1', 'Chemistry Model Test 1', 'Math Model Test 1', 'Biology Model Test 1', 'English Model Test 1'];
  const tests = [];
  for (const title of testTitles) {
    const existing = await ModelTest.findOne({ where: { title } });
    if (existing) {
      tests.push(existing);
      continue;
    }
    const test = await ModelTest.create({
      title,
      examDate: new Date(2026, Math.floor(Math.random() * 6), Math.floor(Math.random() * 27) + 1),
      fee: randomFrom([200, 250, 300]),
      description: `${title} covering full syllabus.`,
    });
    tests.push(test);
  }

  const existingCount = await Student.count();
  if (existingCount > 0) {
    console.log(`Students already exist (${existingCount}). Skipping student seeding.`);
    await sequelize.close();
    return;
  }

  for (let i = 0; i < 50; i += 1) {
    const hscYear = randomFrom([2024, 2025, 2026]);
    const rollNo = await generateRollNumber(hscYear);
    const monthlyFee = randomFrom([1000, 1200, 1500, 1800, 2000]);

    const joinMonth = Math.floor(Math.random() * 6); // Jan-Jun
    const joiningDate = new Date(hscYear === 2026 ? 2026 : hscYear - 1, joinMonth, Math.floor(Math.random() * 27) + 1);

    const student = await Student.create({
      rollNo,
      name: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`,
      fatherName: `${randomFrom(LAST_NAMES)} Sr.`,
      phone: randomPhone(),
      guardianPhone: randomPhone(),
      school: randomFrom(SCHOOLS),
      class: randomFrom(CLASSES),
      group: randomFrom(GROUPS),
      hscYear,
      address: 'Dhaka, Bangladesh',
      joiningDate,
      monthlyFee,
      status: randomFrom(['active', 'active', 'active', 'completed']),
      notes: '',
    });

    const months = generatePayableMonths(joiningDate);
    for (const m of months) {
      const roll = Math.random();
      let paidAmount = 0;
      let status = 'due';
      if (roll < 0.6) {
        paidAmount = monthlyFee;
        status = 'paid';
      } else if (roll < 0.8) {
        paidAmount = Math.floor(monthlyFee * 0.5);
        status = 'partial';
      }
      const dueAmount = monthlyFee - paidAmount;

      const payment = await MonthlyPayment.create({
        studentId: student.id,
        month: m.month,
        year: m.year,
        monthlyFee,
        paidAmount,
        dueAmount,
        status,
        paymentDate: status !== 'due' ? new Date(m.year, m.month - 1, Math.floor(Math.random() * 27) + 1) : null,
        paymentMethod: status !== 'due' ? randomFrom(['Cash', 'bKash', 'Bank Transfer']) : null,
      });

      if (status !== 'due') {
        const receiptNo = await generateReceiptNumber();
        payment.receiptNo = receiptNo;
        await payment.save();
        await Receipt.create({
          receiptNo,
          studentId: student.id,
          paymentType: 'tuition',
          details: [{ month: m.month, year: m.year, amount: paidAmount }],
          amount: paidAmount,
          paymentMethod: payment.paymentMethod,
        });
      }
    }

    // Random model test payments
    if (Math.random() < 0.5) {
      const test = randomFrom(tests);
      const receiptNo = await generateReceiptNumber();
      await ModelTestPayment.create({
        studentId: student.id,
        testId: test.id,
        paidAmount: test.fee,
        paymentDate: new Date(),
        receiptNo,
      });
      await Receipt.create({
        receiptNo,
        studentId: student.id,
        paymentType: 'model_test',
        details: { testId: test.id, title: test.title },
        amount: test.fee,
      });
    }
  }

  console.log('Seeding complete: 50 students with random payments, dues, and model test payments created.');
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
