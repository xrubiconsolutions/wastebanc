"use strict";

/********************************
 * Calling routes and passing ***
 * @param app (express instance)*
 ******** to create API *********
 ********************************/
module.exports = function (app) {
  require("./scheduleRoutes.js")(app);
  require("./userRoutes.js")(app);
  require("./collectorRoutes.js")(app);
  require("./dashboardRoutes")(app);
  require("./dropoffRoutes")(app);
  require("./paymentRoutes")(app);
  require("./lcdAreaRoutes")(app);
  require("./organisationRoutes")(app);
  require("./verificationRoutes")(app);
  require("./resourcesRoutes")(app);
  require("./charityOrganisationRoutes")(app);
  require("./walletRoutes")(app);
  require("../../modules/invoicing/invoicing.route")(app);
  require("./websiteRoutes")(app);
  require("./scriptRoutes")(app);
};
