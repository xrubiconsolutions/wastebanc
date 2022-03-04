const jwt = require("jsonwebtoken");
const MODEL = require("../models");
const jwt_decode = require("jwt-decode");
const CONSTANTS = require("../util/constants");
module.exports = (canPass = false) => {
  return (req, res, next) => {
    return AuthTokenVerify(
      req,
      res,
      function () {
        next();
      },
      canPass
    );
  };
};

async function AuthTokenVerify(req, res, next, canPass) {
  req.user = {};

  const authorization = req.headers["authorization"];
  console.log("authorization", authorization);

  if (!authorization) {
    return res.status(401).json({
      error: true,
      canPass,
      message: "Invalid authorization",
      status: 401,
    });
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    const { userId, exp } = jwt.verify(
      token.trim(),
      CONSTANTS.SERVER.JWT_SECRET_KEY
    );
    console.log("user id", userId);
    console.log("expire in", exp);

    if (Date.now() >= exp * 1000) {
      return res.status(401).json({
        error: true,
        canPass,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    const checkUser = await MODEL.userModel.findById(userId);
    if (!checkUser) {
      return res.status(403).json({
        error: true,
        canPass,
        message: "Invalid token",
        statusCode: 403,
      });
    }

    if (checkUser.role !== "collector") {
      return res.status(401).json({
        error: true,
        message: error.message || "Invalid authorization",
        statusCode: 401,
      });
    }

    req.user = checkUser;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      error: true,
      message: error.message || "Invalid authorization",
      statusCode: 401,
    });
  }
}
