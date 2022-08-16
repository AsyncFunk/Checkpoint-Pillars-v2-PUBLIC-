const Sequelize = require('sequelize');
const db = require('./db');

const User = db.define('user', {
  // Add your Sequelize fields here
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate: { notEmpty: true },
  },
  userType: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'STUDENT',
    validate: {
      studentOrTeacherValidator(value) {
        if (value === 'STUDENT') {
          return;
        }
        if (value === 'TEACHER') {
          return;
        }
        throw 'userType Error!';
      },
    },
  },
  isStudent: {
    type: Sequelize.VIRTUAL,
    get() {
      if (this.userType === 'STUDENT') {
        return true;
      }
      return false;
    },
  },
  isTeacher: {
    type: Sequelize.VIRTUAL,
    get() {
      if (this.userType === 'TEACHER') {
        return true;
      }
      return false;
    },
  },
});

User.findUnassignedStudents = async function () {
  return await User.findAll({
    where: {
      [Sequelize.Op.and]: [{ mentorId: null }, { userType: 'STUDENT' }],
    },
  });
};

User.findTeachersAndMentees = async function () {
  return await User.findAll({
    where: {
      userType: 'TEACHER',
    },
    include: 'mentees',
  });
};

// //I could not get this hook to NOT break eveything else and i don't know what i'm doing wrong. I cannot access theTEACHER with the id that is trying to be assigned as the mentees' mentorId
// User.addHook('beforeUpdate', async (userInstance) => {
//   const mentor = await User.findOne({
//     where: {
//       [Sequelize.Op.and]: [
//         { id: userInstance.mentorId },
//         { userType: 'TEACHER' },
//       ],
//     },
//   });

//   if (mentor.userType === 'STUDENT') {
//     throw 'Cannot update a user with a mentor who is not a TEACHER!';
//   } else return;
// });

User.addHook('beforeUpdate', (userInstance) => {
  if (userInstance.userType === 'TEACHER' && userInstance.mentorId > 0) {
    throw 'Cannot change userType from STUDENT to TEACHER when user has a mentor';
  } else return;
});

User.addHook('beforeUpdate', async (userInstance) => {
  let listOfUsersWithMentees = await User.findTeachersAndMentees();
  listOfUsersWithMentees = listOfUsersWithMentees
    .filter((userObj) => {
      return userObj.dataValues.mentees.length > 0;
    })
    .map((userObj) => {
      return userObj.name;
    });

  if (
    userInstance.userType === 'STUDENT' &&
    listOfUsersWithMentees.includes(userInstance.name)
  ) {
    throw 'cannot change userType from TEACHER to STUDENT when user has mentees';
  } else return;
});

/**
 * We've created the association for you!
 *
 * A user can be related to another user as a mentor:
 *       SALLY (mentor)
 *         |
 *       /   \
 *     MOE   WANDA
 * (mentee)  (mentee)
 *
 * You can find the mentor of a user by the mentorId field
 * In Sequelize, you can also use the magic method getMentor()
 * You can find a user's mentees with the magic method getMentees()
 */

User.belongsTo(User, { as: 'mentor' });
User.hasMany(User, { as: 'mentees', foreignKey: 'mentorId' });

module.exports = User;
