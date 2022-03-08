const { query } = require("express-validator");

module.exports = {
  filter: [
    query("start", "Provide a range start date")
      .exists()
      .notEmpty()
      .custom((val) => {
        const resDate = new Date(val);
        if (resDate.toDateString() === "Invalid Date")
          throw new Error("Start Date is invalid");
        return true;
      }),
    query("end", "Provide a range end date")
      .exists()
      .notEmpty()
      .custom((val) => {
        const resDate = new Date(val);
        if (resDate.toDateString() === "Invalid Date")
          throw new Error("End Date is invalid");
        return true;
      }),
  ],
  search: [query("key", "search key cannot be empty").exists().notEmpty()],
};
