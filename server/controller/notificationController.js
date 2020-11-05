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
                        if(test < 31 ){
                            var mailOptions = {
                                from: "pakambusiness@gmail.com",
                                to: `${organisations[i].email}`,
                                subject: "YOUR ORGANISATION ACCOUNT WILL EXPIRE IN 30 DAYS",
                                text: `Your organisation's account will expire in 30 days. Kindly renew your licence or contact support if any issue arise.`,
                              };
                              transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log("Email sent: " + info.response);
                                }
                              });

                        }
                    }

                        return res.json({
                            message: "make sense"
                        })
        })

    }
    catch(err){
        return res.status(500).json(err)

    }


}





/* export notificationControllers */
module.exports = notificationController;
