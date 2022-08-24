/**
 * Created by Radhey Shyam on 11/14/17.
 */

let CONSTANTS = require("./constants");
const MONGOOSE = require("mongoose");
const BCRYPT = require("bcryptjs");
const JWT = require("jsonwebtoken");
const randomstring = require("randomstring");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const {
  partnersModel,
  centralAccountModel,
  systemChargesModel,
  transactionModel,
  notificationModel,
  scheduleModel,
  userModel,
  collectorModel,
} = require("../models");
/**
 * incrypt password in case user login implementation
 * @param {*} userPassword
 * @param {*} cb
 */
let encryptPswrd = (userPassword, cb) => {
  BCRYPT.hash(userPassword, 10, (err, encryptPswrd) => {
    return err ? cb(err) : cb(null, encryptPswrd);
  });
};

/**
 * @param {** decrypt password in case user login implementation} payloadPassword
 * @param {*} userPassword
 * @param {*} cb
 */
let decryptPswrd = (payloadPassword, userPassword, cb) => {
  BCRYPT.compare(payloadPassword, userPassword, (err, isMatched) => {
    return err ? cb(err) : cb(null, isMatched);
  });
};

const encryptPassword = async (userPassword) => {
  return await BCRYPT.hash(userPassword.trim(), 10);
};

const comparePassword = async (payloadPassword, userPassword) => {
  return await BCRYPT.compare(payloadPassword, userPassword);
};

/** To capitalize a stirng ***/
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * if will take any kind of error and make it in embedded format as per the project require
 * @param {*} data  (data could be object or string depecds upon the error type)
 */
let sendError = function (data) {
  let errorToSend = "",
    errorCode = data.code ? data.code : 0;

  if (
    typeof data === "object" &&
    data.hasOwnProperty("statusCode") &&
    data.hasOwnProperty("customMessage")
  ) {
    data.data = null;
    return data;
  } else {
    if (typeof data === "object") {
      if (data.name === "MongoError" || data.name === "BulkWriteError") {
        errorToSend += CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage;

        if ((data.code = 11000)) {
          let duplicateValue = data.errmsg.split(":");
          duplicateValue = duplicateValue[2].split("_1")[0];
          duplicateValue = duplicateValue.trim().capitalize();
          duplicateValue += CONSTANTS.ERROR_MESSAGE.isAlreadyExist;
          errorToSend = duplicateValue;
        }
      } else if (data.name === "ApplicationError") {
        errorToSend +=
          CONSTANTS.STATUS_MSG.ERROR.APP_ERROR.customMessage + " : ";
      } else if (data.name === "ValidationError") {
        let keys = Object.keys(data.errors, []);
        errorToSend = data.errors[keys[0]].message;
        errorCode = 422;
        errorToSend = replaceValueFromString(errorToSend, "Path", "");
        errorToSend = replaceValueFromString(errorToSend, /\`/g, "");
        errorToSend = replaceValueFromString(errorToSend, /\./g, "");
        errorToSend = errorToSend.trim();
        errorToSend = errorToSend.capitalize();
      } else if (data.name === "CastError") {
        errorToSend +=
          CONSTANTS.STATUS_MSG.ERROR.DB_ERROR.customMessage +
          CONSTANTS.STATUS_MSG.ERROR.INVALID_ID.customMessage +
          data.value;
      } else {
        errorToSend = data.message;
      }
    } else {
      errorToSend = data;
    }
    let customErrorMessage = errorToSend;
    if (typeof customErrorMessage == "string") {
      if (errorToSend.indexOf("[") > -1) {
        customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
      }
      customErrorMessage =
        customErrorMessage && customErrorMessage.replace(/"/g, "");
      customErrorMessage =
        customErrorMessage && customErrorMessage.replace("[", "");
      customErrorMessage =
        customErrorMessage && customErrorMessage.replace("]", "");
    }
    return {
      statusCode: errorCode ? errorCode : 400,
      customMessage: customErrorMessage,
      data: null,
    };
  }
};

/**
 * Send success message to frontend
 * @param {*} successMsg
 * @param {*} data
 */
let sendSuccess = (successMsg, data) => {
  successMsg = successMsg || CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT.customMessage;
  if (
    typeof successMsg == "object" &&
    successMsg.hasOwnProperty("statusCode") &&
    successMsg.hasOwnProperty("customMessage")
  ) {
    return {
      statusCode: successMsg.statusCode,
      customMessage: successMsg.customMessage,
      data: data || null,
    };
  } else {
    return { statusCode: 200, customMessage: successMsg, data: data || null };
  }
};

/**
 * Check duplicate value in array
 * @param {*} request
 * @param {*} reply
 * @param {*} source
 * @param {*} error
 */
let checkDuplicateValuesInArray = (array) => {
  let storeArray = [];
  let duplicateFlag = false;
  if (array && array.length > 0) {
    for (let i = 0; i < array.length; i++) {
      if (storeArray.indexOf(array[i]) == -1) {
        storeArray.push(array[i]);
      } else {
        duplicateFlag = true;
        break;
      }
    }
  }
  storeArray = [];
  return duplicateFlag;
};

/**
 * Generate random string according to the requirement, it will generate 7 character string
 */
let generateRandomString = (length = 7, charset = "numeric") => {
  return randomstring.generate({
    length,
    charset,
  });
};

/**
 * Filter the array
 * @param {*} array
 */
let filterArray = (array) => {
  return array.filter(function (n) {
    return n !== undefined && n !== "";
  });
};

/**
 * sanitizer for spliting a string corresponding to space if string has value otherwise it will join the space in it
 * @param {*} string
 */
let sanitizeName = (string) => {
  return filterArray((string && string.split(" ")) || []).join(" ");
};

/**
 * Verify email is in correct format or not
 * @param {*} string
 */
let verifyEmailFormat = (email) => {
  return validator.isEmail(email);
};

/**************************************
 *  check all fields are filed with ***
 *** values in request body or not ****/
let objProperties = (obj, callback) => {
  for (i in obj) {
    if (!obj[i]) {
      return callback(
        i + CONSTANTS.STATUS_MSG.ERROR.CUSTOME_ERROR.customMessage
      );
    } else if (typeof obj[i] == "object") {
      for (j in obj[i]) {
        if (!obj[i][j]) {
          return callback(
            j + CONSTANTS.STATUS_MSG.ERROR.CUSTOME_ERROR.customMessage
          );
        }
      }
    }
  }
  return callback(null);
};

/** check all fields are available */
let objToArray = (obj) => {
  let arr = [];
  for (i in obj) {
    if (typeof obj[i] == "object") {
      for (j in obj[i]) {
        arr.push(obj[i][j]);
      }
    } else {
      arr.push(obj[i]);
    }
  }
  return arr;
};

/**
 * @param {*} errObj error obj from constants
 * @param {*} customMsg custom new msg
 * @param {*} callback callback back to api || controller || service || routes
 */
let customErrorResponse = (errObj, customMsg, callback) => {
  errObj.message = customMsg;
  callback(errObj);
};

/** used for converting string id to mongoose object id */
let convertIdToMongooseId = (stringId) => {
  return MONGOOSE.Types.ObjectId(stringId);
};

/** create jsonwebtoken **/
let createToken = (objData) => {
  return JWT.sign({ userId: objData._id }, CONSTANTS.SERVER.JWT_SECRET_KEY, {
    expiresIn: "365d",
  });
};

const authToken = (user) => {
  return JWT.sign({ userId: user._id }, CONSTANTS.SERVER.JWT_SECRET_KEY, {
    expiresIn: "5s",
  });
};

const adminToken = (user) => {
  return JWT.sign({ userId: user._id }, CONSTANTS.SERVER.JWT_SECRET_KEY, {
    expiresIn: "7h",
  });
};

/*search filter*/
let dataFilter = (data, cb) => {
  let CRITERIA = {};
  data.type = Number(data.type);
  switch (data.filteredData) {
    case "status":
      CRITERIA = { [data.filteredData]: data.type };
      cb(null, CRITERIA);
      break;
    default:
      cb(null, CRITERIA);
      break;
  }
};

/**
 * replace . with  :
 */
let replaceValueFromString = (stringValue, valueToReplace, value) => {
  /** for special character ayou have to pass /\./g, **/
  return stringValue.replace(valueToReplace, value);
};

/***************************************
 **** Logger for error and success *****
 ***************************************/
let messageLogs = (error, success) => {
  if (error) console.log(`\x1b[31m` + error);
  else console.log(`\x1b[32m` + success);
};

const checkRequestErrs = (req, res, next) => {
  const errs = validationResult(req);
  if (errs.isEmpty()) return next();
  console.log("error", errs);
  return res.status(422).json({
    error: true,
    statusCode: 422,
    message: "Invalid body request",
    errors: errs.array({ onlyFirstError: true }),
  });
};

const sendResponse = (res, { statusCode, customMessage }, data, token) =>
  res.status(statusCode).json({
    message: customMessage,
    data,
    token,
  });

const bodyValidate = (req, res, next) => {
  // 1. Validate the request coming in
  // console.log(req.body);
  const result = validationResult(req);

  const hasErrors = !result.isEmpty();
  console.log(hasErrors);

  if (hasErrors) {
    //   debugLog('user body', req.body);
    // 2. Throw a 422 if the body is invalid
    return res.status(422).json({
      error: true,
      statusCode: 422,
      message: "Invalid body request",
      errors: result.array({ onlyFirstError: true }),
    });
  }
};

const sendNotification = function (data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: "Basic MmVhY2VmZTMtZjUxNi00ZWJhLWIzZDEtMjIxMTYyZDFjMGI1",
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers,
  };

  var https = require("https");
  var req = https.request(options, function (res) {
    res.on("data", function (data) {
      console.log(data);
    });
  });

  req.on("error", function (e) {
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

const removeObjDuplicate = (arr, field) => {
  const result = arr.reduce((acc, current) => {
    const doExist = acc.find((d) => d[field] === current[field]);
    if (!doExist) return [...acc, current];
    return acc;
  }, []);
  return result;
};

const encryptData = (
  data,
  salt,
  iv,
  passPhrase,
  keySize = 32,
  iterations = 2
) => {
  let stringifydata;
  if (typeof data === "object") {
    stringifydata = JSON.stringify(data);
  } else {
    console.log("d", data);
    stringifydata = data.toString();
  }
  //const stringifydata = JSON.stringify(data);
  console.log("data", stringifydata);
  iv = Buffer.from(iv);
  salt = Buffer.from(salt);
  // let encryptMessage = Buffer.from(stringifydata);
  // encryptMessage = encryptMessage.toString("utf-8");
  let key = crypto.pbkdf2Sync(passPhrase, salt, iterations, keySize, "sha1");
  const cipher = crypto.createCipheriv("AES-256-CBC", key, iv);
  let encrypted = cipher.update(stringifydata, "utf8", "base64");
  console.log("encrypted", encrypted);
  encrypted += cipher.final("base64");

  //return Buffer.concat(encrypted[1]);
  console.log("en", encrypted.toString().replace("/", "Lw"));

  return encrypted;
};

const decryptData = (
  data,
  salt,
  iv,
  passPhrase,
  keySize = 32,
  iterations = 2
) => {
  console.log("data", data);
  iv = Buffer.from(iv);
  salt = Buffer.from(salt);
  let key = crypto.pbkdf2Sync(passPhrase, salt, iterations, keySize, "sha1");
  const decipher = crypto.createDecipheriv("AES-256-CBC", key, iv);
  //data = data.toString().replace("Por21Ld", "/");
  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");
  console.log("d", decrypted);
  return decrypted;
  //return decrypted.toString().replace("Por21Ld", "/");
  //return JSON.parse(decrypted);
};

// const encryptV2 =(data,
//   salt,
//   iv,
//   passPhrase,
//   keySize = 32,
//   iterations = 2)=> {
//     crypto.
//   }

const Sterlingkeys = async () => {
  const partner = await partnersModel.findOne({
    name: "sterling",
  });

  if (!partner) throw new Error("Partner not found");

  return partner;
};

const SystemDeductions = async (amount) => {
  const systemCharges = await systemChargesModel.findOne({
    name: "sterling-pickers",
  });

  if (!systemCharges) {
    throw new Error("Error getting charges");
  }

  const percent = (systemCharges.chargePercentage / 100) * Number(amount);
  const result = percent + systemCharges.chargeAmount;
  return result;
};

const storeTransaction = async (params) => {
  return await transactionModel.create(params);
};

const storeNotification = async (params) => {
  return await notificationModel.create(params);
};

const updateSchedule = async (params, scheduleId) => {
  return await scheduleModel.updateOne({ _id: scheduleId }, { $set: params });
};

const updateUser = async (params, email) => {
  return await userModel.updateOne({ email }, { $set: params });
};

const updateCollector = async (params, collectorId) => {
  return await collectorModel.updateOne({ _id: collectorId }, { $set: params });
};

const storeActivites = async (params) => {
  const collector = await activitesModel.create({
    userId: params.collectorId,
    message: params.collectorMsg,
    activity_type: params.activityType,
  });

  const schedule = await activitesModel.create({
    userType: "client",
    userId: params.schedulerId,
    message: params.scheduleMsg,
    activity_type: params.activityType,
  });

  return params;
};

/*exporting all object from here*/
module.exports = {
  sendError: sendError,
  sendSuccess: sendSuccess,
  encryptPswrd: encryptPswrd,
  decryptPswrd: decryptPswrd,
  checkDuplicateValuesInArray: checkDuplicateValuesInArray,
  verifyEmailFormat: verifyEmailFormat,
  filterArray: filterArray,
  sanitizeName: sanitizeName,
  customErrorResponse: customErrorResponse,
  convertIdToMongooseId: convertIdToMongooseId,
  objProperties: objProperties,
  createToken: createToken,
  generateRandomString: generateRandomString,
  objToArray: objToArray,
  dataFilter: dataFilter,
  replaceValueFromString: replaceValueFromString,
  messageLogs: messageLogs,
  authToken,
  adminToken,
  comparePassword,
  encryptPassword,
  checkRequestErrs,
  sendResponse,
  bodyValidate,
  sendNotification,
  removeObjDuplicate,
  encryptData,
  decryptData,
  Sterlingkeys,
  SystemDeductions,
  storeTransaction,
  storeNotification,
  updateSchedule,
  updateUser,
  updateCollector,
  storeActivites,
};
