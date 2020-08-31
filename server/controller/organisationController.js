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
    const organisation_data = { ...req.body }
    const errors = {};
    MODEL.organisationModel.findOne({ companyName: organisation_data.companyName}).then((user) => {
      if (user) {
        errors.email = "Company already exists";
        RESPONSE.status(400).jsonp(errors);
      } else {
        MODEL.organisationModel(organisation_data).save({}, (ERR, RESULT) => {

          if(ERR) return res.status(400).json(err)
          return res.status(200).json(RESULT);
        })
      
      }
    }).catch(err=> res.status(500).json(err))
 

    
}


organisationController.listOrganisation = (req,res)=>{

  let errors = {}

   MODEL.organisationModel.find({}).then((result)=>{

    //  if (err) {
    //   errors.message = "There was an issue fetching the organisations"
    //   return res.status(400).jsonp(errors)
    //  }
    return res.status(200).jsonp(result)
   }).catch(err=>res.status(400).jsonp(err))
}


organisationController.agentApproval = (req,res)=>{
  const agentID = req.body.agentID;
  const organisationID = req.body.organisationID;
  if(!organisationID) {
    return res.status(400).jsonp({message: "The recycler's ID and organisation ID is required"})
  }
  MODEL.collectorModel.updateOne({_id: agentID}, { verified: true , approvedBy : organisationID }, (err,resp)=>{
      if (err) {
        return res.status(400).jsonp(err)
      }
      console.log("approved by us")
     return res.jsonp({message: "You just approved a recycler"})
  })

}


organisationController.agentDecline = (req,res)=>{
  const agentID = req.body.agentID;
  // const organisationID = req.body.organisationID;
  // if(!organisationID) {
  //   return res.status(400).jsonp({message: "The recycler's ID and organisation ID is required"})
  // }
  MODEL.collectorModel.updateOne({_id: agentID}, { verified: false }, (err,resp)=>{
      if (err) {
        return res.status(400).jsonp(err)
      }
      console.log("declined by us")
     return res.jsonp({message: "You just declined a recycler's request "})
  })

}



/* export organisationControllers */
module.exports = organisationController;
