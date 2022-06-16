const { query, check, param, body } = require("express-validator");

module.exports = {
  filter: [
    query("start", "Provide a range start date")
      //.exists()
      .optional()
      .custom((val) => {
        const resDate = new Date(val);
        if (resDate.toDateString() === "Invalid Date")
          throw new Error("Start Date is invalid");
        return true;
      }),
    query("end", "Provide a range end date")
      //.exists()
      .optional()
      .custom((val) => {
        const resDate = new Date(val);
        if (resDate.toDateString() === "Invalid Date")
          throw new Error("End Date is invalid");
        return true;
      }),
  ],
  search: [query("key", "search key cannot be empty").exists().notEmpty()],
  createArea: [
    body("coverageArea").notEmpty().withMessage("coverageArea is required"),
    body("lga").notEmpty().withMessage("lga is required"),
    body("country").optional({ default: "" }),
    body("state").optional({ default: "" }),
  ],
  areaId: [param("areaId").notEmpty().withMessage("areaId is required")],
  removenotification: [
    body("notificationIds")
      .notEmpty()
      .withMessage("notificationIds is required")
      .isArray()
      .withMessage("notificationIds should be an array of ids"),
  ],
  companyId: [
    param("companyId")
      .notEmpty()
      .withMessage("companyId is required")
      .isString()
      .withMessage("companyId id is invalid"),
  ],
};
