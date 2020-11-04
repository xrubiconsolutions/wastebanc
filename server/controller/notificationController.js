"use strict";

/**************************************************
 ***** Notification controller ****
 **************************************************/

let notificationController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");



var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pakambusiness@gmail.com",
    pass: "pakambusiness-2000",
  },
});


notificationController.notifyOrganisations =  (req,res)=>{

var today = new Date();

    try{

        MODEL.organisationModel.find({}).then((organisations)=>{

                    for(let i = 0 ; i < organisations.length ; i++){
                        var diff = organisations[i].expiry_date - today;
                        var test = diff/(1000*24*60*60)
                        console.log(diff, "<<<ORG>>>",test); 
                                // if(organis)
                        console.log()
                    }

                        return res.json({
                            message: "make sense"
                        })
        })

    }
    catch(err){
        return res.status(500).json(err)

    }

    // var mailOptions = {
    //     from: "pakambusiness@gmail.com",
    //     to: `${organisation_data.email}`,
    //     subject: "WELCOME TO PAKAM ORGANISATION ACCOUNT",
    //     text: `Organisation account credentials: Log into your account with your email :${organisation_data.email}. Your password for your account is :  ${password}`,
    //   };

    //   transporter.sendMail(mailOptions, function (error, info) {
    //     if (error) {
    //       console.log(error);
    //     } else {
    //       console.log("Email sent: " + info.response);
    //     }
    //   });




}





/* export notificationControllers */
module.exports = notificationController;
