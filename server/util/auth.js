"use strict";

/************** Modules **************/
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let CONSTANTS = require("../util/constants");
const JWT = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");

let validateUser = {};

/********************************
 ********* validate user ********
 ********************************/
validateUser.userValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);
  console.log("valid", validated);
  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "client") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "client"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.userCollectorData = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);
  console.log("valid", validated);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "admin" || user.roles === "analytics-admin") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   (validated && validated.roles === "admin") ||
  //   validated.roles == "analytics-admin"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.companyPakamDataValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);
  console.log("valid", validated);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "admin" || user.roles === "company") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   (validated && validated.roles === "admin") || validated.role == "company"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.recyclerValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);
  console.log("valid", validated);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "collector") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }
  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "collector"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

/********************************
 ****** admin authentication ****
 ********************************/
validateUser.adminValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);
  console.log("valid", validated);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "analytics-admin") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "analytics-admin"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.adminPakamValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "admin") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "admin"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.companyValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "company") {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.role === "company"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.lcdValidation = async (REQUEST, RESPONSE, NEXT) => {
  if (!REQUEST.headers.authorization) {
    return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }
  var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1]);

  if (Date.now() >= validated.exp * 1000) {
    return RESPONSE.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disabled") {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if ((user.roles === "client") || (user.roles === 'company') || (user.roles === 'admin') || (user.roles === 'collector')) {
    REQUEST.user = user;
    NEXT();
  } else {
    return RESPONSE.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }
  //   let status = REQUEST.headers.authorization
  //     ? JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   (validated && validated.roles === "client") ||
  //   validated.roles === "collector" ||
  //   validated.role === "company" ||
  //   validated.roles === "admin"
  //     ? NEXT()
  //     : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

/********************************
 ****** admin check model ********
 *********************************/
validateUser.adminCheck = (REQUEST, RESPONSE, NEXT) => {
  let dataObj = REQUEST.query.username;
  if (REQUEST.query.username) {
    dataObj = REQUEST.query;
  } else {
    dataObj = REQUEST.body;
  }

  /** Check required properties **/
  COMMON_FUN.objProperties(dataObj, (ERR, RESULT) => {
    if (ERR) {
      return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    } else {
      MODEL.userModel.findOne(
        {
          $or: [{ username: dataObj.username }, { email: dataObj.username }],
        },
        {},
        { lean: true },
        (ERR, RESULT) => {
          if (ERR) {
            return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
          } else if (!RESULT) {
            return RESPONSE.jsonp(
              COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_USERNAME)
            );
          } else {
            RESULT.roles === admin
              ? NEXT()
              : RESPONSE.status(400).jsonp(
                  COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
                );
          }
        }
      );
    }
  });
};

/********************************
 ****** User check model ********
 *********************************/
validateUser.userCheck = (REQUEST, RESPONSE, NEXT) => {
  let dataObj = REQUEST.query.username;
  if (REQUEST.query.username) {
    dataObj = REQUEST.query;
  } else {
    dataObj = REQUEST.body;
  }
  COMMON_FUN.objProperties(dataObj, (ERR, RESULT) => {
    if (ERR) {
      return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    } else {
      MODEL.userModel.findOne(
        {
          $or: [{ username: dataObj.username }, { email: dataObj.username }],
        },
        {},
        { lean: true },
        (ERR, RESULT) => {
          if (ERR) {
            return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
          } else if (!RESULT) {
            return RESPONSE.jsonp(
              COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_USERNAME)
            );
          } else {
            RESULT.roles === CONSTANTS.DATABASE.USER_ROLES.USER
              ? NEXT()
              : RESPONSE.jsonp(
                  COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
                );
          }
        }
      );
    }
  });
};

/* export userControllers */
module.exports = validateUser;
