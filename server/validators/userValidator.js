const { body } = require("express-validator");

module.exports = {
  login: [
    body("email", "email is required").isString(),
    body("password", "password is required").isString(),
  ],
};
