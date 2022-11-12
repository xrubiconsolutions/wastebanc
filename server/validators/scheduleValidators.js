const { body } = require("express-validator");

module.exports = {
  bookPickUp: [
    body("client")
      .trim()
      .notEmpty()
      .withMessage("client is required")
      .isString()
      .withMessage("client is string"),
    body("quantity")
      .notEmpty()
      .withMessage("quantity is required")
      .isInt()
      .withMessage("quantity should be number"),
    body("details")
      .trim()
      .optional()
      .isString()
      .withMessage("details should be string"),
    body("address")
      .trim()
      .notEmpty()
      .withMessage("address is required")
      .isString()
      .withMessage("address should be string"),
    body("long")
      .notEmpty()
      .withMessage("long, long is required")
      .isFloat({ min: -180, max: 180 })
      .withMessage("long, long should fall in the range of -180 to 180"),
    body("lat")
      .notEmpty()
      .withMessage("lat, lat is required")
      .isFloat({ min: -90, max: 90 })
      .withMessage("long, long should fall in the range of -180 to 180"),
    body("categories")
      .notEmpty()
      .withMessage("categories is required")
      .isArray()
      .withMessage("categories should be an array"),
    body("pickUpDate").notEmpty().withMessage("pickUpDate is required"),
    body("callOnArrival")
      .notEmpty()
      .withMessage("callOnArrival is required")
      .isBoolean()
      .withMessage("callOnArrival should be either true or false"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("phone is required")
      .isString()
      .withMessage("Phone should be string"),
    body("reminder")
      .notEmpty()
      .withMessage("reminder is required")
      .isBoolean()
      .withMessage("reminder should be either true or false"),
    body("lcd")
      .optional({ default: "" })
      .isString()
      .withMessage("lcd should be string"),
    body("Category")
      .optional({ default: "" })
      .isString()
      .withMessage("Category should be string"),
  ],

  dropOff: [
    body("scheduleCreator")
      .notEmpty()
      .withMessage("scheduleCreator is required")
      .isString()
      .withMessage("scheduleCreator should be string"),
    body("fullname")
      .notEmpty()
      .withMessage("fullname is required")
      .isString()
      .withMessage("fullname should be string"),
    body("phone")
      .notEmpty()
      .withMessage("phone is required")
      .isString()
      .withMessage("phone should be string"),
    body("Category")
      .optional({ default: "" })
      .isString()
      .withMessage("Category should be string"),
    body("quantity")
      .notEmpty()
      .withMessage("quantity is required")
      .isInt()
      .withMessage("quantity should be a number"),
    body("categories")
      .notEmpty()
      .withMessage("categories is required")
      .isArray()
      .withMessage("categories should be an array"),
    body("address")
      .notEmpty()
      .withMessage("address is required")
      .isString()
      .withMessage("address should be string"),
    body("organisation")
      .notEmpty()
      .withMessage("organisation is required")
      .isString()
      .withMessage("organisation should be string"),
    body("organisationCollection")
      .notEmpty()
      .withMessage("organisationCollection is required")
      .isString()
      .withMessage("organisationCollection should be string"),
    body("organisationPhone")
      .notEmpty()
      .withMessage("organisationPhone is required")
      .isString()
      .withMessage("organisationPhone should be string"),
    body("dropOffDate").notEmpty().withMessage("dropOffDate is required"),
    body("locationId").notEmpty().withMessage("locationId is required"),
  ],

  rewardUser: [
    //body("collectorId").notEmpty().withMessage("collectorId is required"),
    body("categories")
      .notEmpty()
      .withMessage("categories")
      .isArray()
      .withMessage("categories is an array"),
    body("scheduleId").notEmpty().withMessage("scheduleId is required"),
  ],

  acceptSchedule: [body("_id").notEmpty().withMessage("_id is required")],
};
