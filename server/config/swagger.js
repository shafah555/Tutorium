const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tutorium API',
      version: '1.0.0',
      description: 'REST API documentation for the Tutorium Student Management System (single-tutor).',
    },
    servers: [
      { url: '/api', description: 'API base path' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/auth/register': { post: { summary: 'Register the single teacher account (one-time only)', tags: ['Auth'] } },
      '/auth/login': { post: { summary: 'Login with email/phone + password', tags: ['Auth'] } },
      '/auth/forgot-password': { post: { summary: 'Request OTP for password reset', tags: ['Auth'] } },
      '/auth/reset-password': { post: { summary: 'Reset password using OTP', tags: ['Auth'] } },
      '/auth/me': { get: { summary: 'Get current logged in teacher profile', tags: ['Auth'] } },
      '/students': {
        get: { summary: 'List students (search, filter, paginate)', tags: ['Students'] },
        post: { summary: 'Create a new student (auto roll number + payable months)', tags: ['Students'] },
      },
      '/students/{id}': {
        get: { summary: 'Get student profile with payment history', tags: ['Students'] },
        put: { summary: 'Update student', tags: ['Students'] },
        delete: { summary: 'Delete student', tags: ['Students'] },
      },
      '/students/{id}/complete': { post: { summary: 'Mark student as completed', tags: ['Students'] } },
      '/payments': {
        get: { summary: 'List monthly payments', tags: ['Payments'] },
        post: { summary: 'Receive payment for one or more months', tags: ['Payments'] },
      },
      '/payments/pending/{studentId}': { get: { summary: 'Get pending due/partial months for a student', tags: ['Payments'] } },
      '/payments/{id}': { put: { summary: 'Manually edit a monthly payment record', tags: ['Payments'] } },
      '/model-tests': {
        get: { summary: 'List model tests', tags: ['Model Tests'] },
        post: { summary: 'Create model test', tags: ['Model Tests'] },
      },
      '/model-tests/{id}': {
        put: { summary: 'Update model test', tags: ['Model Tests'] },
        delete: { summary: 'Delete model test', tags: ['Model Tests'] },
      },
      '/model-tests/{id}/pay': { post: { summary: 'Record a model test fee payment', tags: ['Model Tests'] } },
      '/receipt/{id}': { get: { summary: 'Get receipt JSON detail', tags: ['Receipts'] } },
      '/receipt/pdf/{id}': { get: { summary: 'Download/print receipt PDF', tags: ['Receipts'] } },
      '/dashboard': { get: { summary: 'Get dashboard analytics summary', tags: ['Dashboard'] } },
      '/reports/monthly': { get: { summary: 'Monthly collection report (json/excel/csv/pdf)', tags: ['Reports'] } },
      '/reports/due': { get: { summary: 'Due report', tags: ['Reports'] } },
      '/reports/students': { get: { summary: 'Student report (active/completed)', tags: ['Reports'] } },
      '/reports/model-tests': { get: { summary: 'Model test report', tags: ['Reports'] } },
      '/reports/income': { get: { summary: 'Income report grouped by month/year', tags: ['Reports'] } },
      '/settings': {
        get: { summary: 'Get institute settings', tags: ['Settings'] },
        put: { summary: 'Update institute settings (logo/signature upload)', tags: ['Settings'] },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
