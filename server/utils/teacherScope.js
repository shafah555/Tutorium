/**
 * Returns a Sequelize where clause scoped to the logged-in teacher.
 */
function teacherWhere(req, extra = {}) {
  return { userId: req.user.id, ...extra };
}

module.exports = { teacherWhere };
