"use strict";

/********************************
 * Calling routes and passing ***
 * @param app (express instance)*
 ******** to create API *********
 ********************************/
module.exports = function (app) {
  require("./scheduleRoutes.js")(app);
};
