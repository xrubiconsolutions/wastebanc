"use strict";

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let organisationController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");


organisationController.createOrganisation = (req, res) =>{

    const organisaion_data = { ...req.body }

    request(
        {
          url: `https://xrubiconp.herokuapp.com/api/login`,
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
            Token: response.headers.token,
          },
          json: true,
        },
        function (error, response, body) {
          res.jsonp(response.body.content.data);
        }
      );

}