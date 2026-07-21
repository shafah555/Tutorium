const { Student } = require('../models');
const { Op } = require('sequelize');

/**
 * Generates the next roll number for a given HSC year.
 * Format: HSC-{YY}{NNN}  e.g. HSC-25001, HSC-25002 ...
 * Each HSC year has its own independent, never-duplicated sequence.
 */
async function generateRollNumber(hscYear) {
  const yy = String(hscYear).slice(-2);
  const prefix = `HSC-${yy}`;

  const lastStudent = await Student.findOne({
    where: { rollNo: { [Op.like]: `${prefix}%` } },
    order: [['rollNo', 'DESC']],
  });

  let nextSeq = 1;
  if (lastStudent) {
    const lastSeq = parseInt(lastStudent.rollNo.replace(prefix, ''), 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  const seqStr = String(nextSeq).padStart(3, '0');
  return `${prefix}${seqStr}`;
}

module.exports = { generateRollNumber };
