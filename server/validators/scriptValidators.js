const { body } = require("express-validator");

module.exports = {
  usersSMS: [body("message", "Provide message to send").isString().notEmpty()],
};
