"use strict";

/*******************************
 *** MONGOOSE for connection ***
 *******************************/
let MONGOOSE = require("mongoose");

MONGOOSE.set("useFindAndModify", false);

// db instance to be used incase to access collection not included in the schemeas
let dbHelper;
/*******************************
 ***** Mongodb connection  *****
 *******************************/

module.exports = {
  getDBHelper: () => dbHelper,
  dbSetup: (URL) => {
    return new Promise((resolve, reject) => {
      MONGOOSE.connect(URL, { useNewUrlParser: true }, (err, response) => {
        if (err) reject(err);
        else {
          dbHelper = response;
          resolve(null);
        }
      });
    });
  },
};
