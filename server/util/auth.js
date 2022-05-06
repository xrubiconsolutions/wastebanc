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
validateUser.userValidation = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.status(401).jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    if (token === "undefined" || token === null || token === undefined) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    var validated = jwt_decode(req.headers.authorization.split(" ")[1]);
    ////console.log("valid", validated);
    if (Date.now() >= validated.exp * 1000) {
      return res.status(401).json({
        error: true,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    const user = await MODEL.userModel.findById(validated.userId);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.status === "disable") {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.roles === "client") {
      req.user = user;
      NEXT();
    } else {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "client"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.userCollectorData = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.status(401).jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Invalid token",
    });
  }

  if (token === "undefined" || token === null || token === undefined) {
    return res.status(400).json({
      error: true,
      message: "Invalid token",
    });
  }

  var validated = jwt_decode(req.headers.authorization.split(" ")[1]);
  ////console.log("valid", validated);

  if (Date.now() >= validated.exp * 1000) {
    return res.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disable") {
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.roles === "admin" || user.roles === "analytics-admin") {
    req.user = user;
    NEXT();
  } else {
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

//   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   (validated && validated.roles === "admin") ||
  //   validated.roles == "analytics-admin"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.companyPakamDataValidation = async (req, res, NEXT) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    if (token === "undefined" || token === null || token === undefined) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    var validated = jwt_decode(req.headers.authorization.split(" ")[1]);
    //console.log("valid", validated);

    if (Date.now() >= validated.exp * 1000) {
      return res.status(401).json({
        error: true,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    const user = await MODEL.organisationModel.findById(validated.userId);
    if (!user) {
      //console.log("here");
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.status === "disable") {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 401,
      });
    }

    if (user.roles === "admin" || user.roles === "company") {
      req.user = user;
      NEXT();
    } else {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 401,
      });
    }
  } catch (error) {
    //console.log(error);
    console.log(error);
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   (validated && validated.roles === "admin") || validated.role == "company"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.recyclerValidation = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.status(401).jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    if (token === "undefined" || token === null || token === undefined) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    var validated = jwt_decode(req.headers.authorization.split(" ")[1]);
    //console.log("valid", validated.userId);

    if (Date.now() >= validated.exp * 1000) {
      return res.status(401).json({
        error: true,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    console.log("id", validated.userId);
    const user = await MODEL.collectorModel.findById(validated.userId);
    console.log("user", user);
    if (!user) {
      //console.log("here 1");
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 401,
      });
    }

    if (user.status === "disable") {
      //console.log("here 2");
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 401,
      });
    }

    if (user.roles === "collector" || user.roles === "company") {
      req.user = user;
      NEXT();
    } else {
      //console.log("here 3");
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 401,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "collector"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

/********************************
 ****** admin authentication ****
 ********************************/
validateUser.adminValidation = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    if (token === "undefined" || token === null) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    var validated = jwt_decode(req.headers.authorization.split(" ")[1]);
    //console.log("valid", validated);

    if (Date.now() >= validated.exp * 1000) {
      return res.status(401).json({
        error: true,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    const user = await MODEL.userModel.findById(validated.userId);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.status === "disable") {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.roles === "analytics-admin" || user.roles === "admin") {
      req.user = user;
      NEXT();
    } else {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 401,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "analytics-admin"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.adminPakamValidation = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.status(401).jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    if (token === "undefined" || token === null || token === undefined) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    var validated = jwt_decode(req.headers.authorization.split(" ")[1]);

    if (Date.now() >= validated.exp * 1000) {
      return res.status(401).json({
        error: true,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    const user = await MODEL.userModel.findById(validated.userId);

    if (!user) {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.status === "disable") {
      return res.status(401).json({
        error: true,
        message: "Account disabled, Please contact support team",
        statusCode: 403,
      });
    }

    if (user.roles === "admin") {
      req.user = user;
      NEXT();
    } else {
      //console.log("here");
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.roles === "admin"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.companyValidation = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.status(401).jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    if (token === "undefined" || token === null || token === undefined) {
      return res.status(400).json({
        error: true,
        message: "Invalid token",
      });
    }

    var validated = jwt_decode(req.headers.authorization.split(" ")[1]);

    if (Date.now() >= validated.exp * 1000) {
      return res.status(401).json({
        error: true,
        message: "Token time out. Login again",
        statusCode: 401,
      });
    }

    const user = await MODEL.organisationModel.findById(validated.userId);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.status === "disable") {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }

    if (user.roles === "company") {
      req.user = user;
      NEXT();
    } else {
      return res.status(401).json({
        error: true,
        message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
        statusCode: 403,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   validated && validated.role === "company"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.lcdValidation = async (req, res, NEXT) => {
  if (!req.headers.authorization) {
    return res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Invalid token",
    });
  }

  if (token === "undefined" || token === null || token === undefined) {
    return res.status(400).json({
      error: true,
      message: "Invalid token",
    });
  }

  var validated = jwt_decode(req.headers.authorization.split(" ")[1]);

  if (Date.now() >= validated.exp * 1000) {
    return res.status(401).json({
      error: true,
      message: "Token time out. Login again",
      statusCode: 401,
    });
  }

  const user = await MODEL.userModel.findById(validated.userId);
  if (!user) {
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (user.status === "disable") {
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }

  if (
    user.roles === "client" ||
    user.roles === "company" ||
    user.roles === "admin" ||
    user.roles === "collector"
  ) {
    req.user = user;
    NEXT();
  } else {
    return res.status(401).json({
      error: true,
      message: CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED,
      statusCode: 403,
    });
  }
  //   let status = res.headers.authorization
  //     ? JWT.decode(res.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY)
  //     : JWT.decode(res.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
  //   (validated && validated.roles === "client") ||
  //   validated.roles === "collector" ||
  //   validated.role === "company" ||
  //   validated.roles === "admin"
  //     ? NEXT()
  //     : res.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

/********************************
 ****** admin check model ********
 *********************************/
validateUser.adminCheck = (req, res, NEXT) => {
  let dataObj = req.query.username;
  if (req.query.username) {
    dataObj = req.query;
  } else {
    dataObj = req.body;
  }

  /** Check required properties **/
  COMMON_FUN.objProperties(dataObj, (ERR, RESULT) => {
    if (ERR) {
      return res.jsonp(COMMON_FUN.sendError(ERR));
    } else {
      MODEL.userModel.findOne(
        {
          $or: [{ username: dataObj.username }, { email: dataObj.username }],
        },
        {},
        { lean: true },
        (ERR, RESULT) => {
          if (ERR) {
            return res.jsonp(COMMON_FUN.sendError(ERR));
          } else if (!RESULT) {
            return res.jsonp(
              COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_USERNAME)
            );
          } else {
            RESULT.roles === admin
              ? NEXT()
              : res
                  .status(400)
                  .jsonp(
                    COMMON_FUN.sendError(
                      CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED
                    )
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
validateUser.userCheck = (req, res, NEXT) => {
  let dataObj = req.query.username;
  if (req.query.username) {
    dataObj = req.query;
  } else {
    dataObj = req.body;
  }
  COMMON_FUN.objProperties(dataObj, (ERR, RESULT) => {
    if (ERR) {
      return res.jsonp(COMMON_FUN.sendError(ERR));
    } else {
      MODEL.userModel.findOne(
        {
          $or: [{ username: dataObj.username }, { email: dataObj.username }],
        },
        {},
        { lean: true },
        (ERR, RESULT) => {
          if (ERR) {
            return res.jsonp(COMMON_FUN.sendError(ERR));
          } else if (!RESULT) {
            return res.jsonp(
              COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_USERNAME)
            );
          } else {
            RESULT.roles === CONSTANTS.DATABASE.USER_ROLES.USER
              ? NEXT()
              : res.jsonp(
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
