const router = require('express').Router();
const {
  models: { User },
} = require('../db');

/**
 * All of the routes in this are mounted on /api/users
 * For instance:
 *
 * router.get('/hello', () => {...})
 *
 * would be accessible on the browser at http://localhost:3000/api/users/hello
 *
 * These route tests depend on the User Sequelize Model tests. However, it is
 * possible to pass the bulk of these tests after having properly configured
 * the User model's name and userType fields.
 */

// Add your routes here:

router.get('/', async (req, res, next) => {
  try {
    let users = await User.findAll();
    users = users.filter((user) => {
      let testTheQuery = new RegExp(`(${req.query.name})`, `i`);
      return testTheQuery.test(user.name);
    });
    res.status(200).send(users);
  } catch (err) {
    next(err);
  }
});

router.get('/unassigned', async (req, res, next) => {
  try {
    const response = await User.findUnassignedStudents();
    res.status(200).send(response);
  } catch (err) {
    next(err);
  }
});

router.get('/teachers', async (req, res, next) => {
  try {
    const response = await User.findTeachersAndMentees();
    res.status(200).send(response);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  let id = req.params.id;
  try {
    if (/(\d+)/.test(id)) {
      const userToDelete = await User.findOne({
        where: { id: id },
      });

      if (userToDelete) {
        await User.destroy({ where: { id: id } });
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    } else {
      res.sendStatus(400);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const count = await User.count({
      where: { name: req.body.name },
    });

    if (count > 0) {
      res.sendStatus(409);
      return;
    }
    const response = await User.create(req.body);
    res.status(201).send(response);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const toUpdate = await User.findOne({
      where: { id: req.params.id },
    });
    if (!toUpdate) {
      res.sendStatus(404);
      return;
    }
    const updatedUser = await toUpdate.update(req.body);
    res.status(200).send(updatedUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
