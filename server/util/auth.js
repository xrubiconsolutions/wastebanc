
"use strict";


/************** Modules **************/
let MODEL           =   require("../models");
let COMMON_FUN      =   require("../util/commonFunction");
let CONSTANTS       =   require("../util/constants");
const JWT           =   require("jsonwebtoken");
const jwt_decode = require("jwt-decode");

let validateUser = {};

/********************************
 ********* validate user ********
 ********************************/
validateUser.userValidation = ( REQUEST, RESPONSE, NEXT )=>{
    if(!REQUEST.headers.authorization){
        return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
    }
    var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1])    
    console.log("valid", validated)
    let status = REQUEST.headers.authorization ?
        JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY):
        JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
    (validated && validated.roles === "client") ? NEXT() : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.recyclerValidation = ( REQUEST, RESPONSE, NEXT )=>{
    if(!REQUEST.headers.authorization){
        return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
    }
    var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1])    
    console.log("valid", validated)
    let status = REQUEST.headers.authorization ?
        JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY):
        JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
    (validated && validated.roles === "collector") ? NEXT() : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};


/********************************
 ****** admin authentication ****
 ********************************/
validateUser.adminValidation = ( REQUEST, RESPONSE, NEXT )=>{
    if(!REQUEST.headers.authorization){
        return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
    }
    var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1])    
    console.log("valid", validated)
    let status = REQUEST.headers.authorization ?
        JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY):
        JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
    (validated && validated.roles === "analytics-admin") ? NEXT() : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
};

validateUser.adminPakamValidation = (REQUEST, RESPONSE ,NEXT )=>{
    if(!REQUEST.headers.authorization){
        return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
    }
    var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1])    
    let status = REQUEST.headers.authorization ?
        JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY):
        JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
    (validated && validated.roles === "admin") ? NEXT() : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
}

validateUser.companyValidation = (REQUEST,RESPONSE,NEXT)=>{
    if(!REQUEST.headers.authorization){
        return RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED)
    }
    var validated = jwt_decode(REQUEST.headers.authorization.split(" ")[1])    
    let status = REQUEST.headers.authorization ?
        JWT.decode(REQUEST.headers.authorization, CONSTANTS.SERVER.JWT_SECRET_KEY):
        JWT.decode(REQUEST.query.api_key, CONSTANTS.SERVER.JWT_SECRET_KEY);
    (validated && validated.role === "company") ? NEXT() : RESPONSE.jsonp(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED);
}

/********************************
****** admin check model ********
*********************************/
validateUser.adminCheck = ( REQUEST, RESPONSE, NEXT )=>{
    let dataObj = REQUEST.query.username;
    if(REQUEST.query.username){
        dataObj = REQUEST.query;
    }else{
        dataObj = REQUEST.body;
    }

    /** Check required properties **/
    COMMON_FUN.objProperties(dataObj, (ERR, RESULT)=> {
        if (ERR) {
            return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
        } else {
            MODEL.userModel.findOne({
                $or: [
                    {username: dataObj.username},
                    {email: dataObj.username}
                ]
            }, {}, {lean:true}, (ERR, RESULT) => {
                if (ERR) {
                    return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
                }else if(!RESULT){
                    return RESPONSE.jsonp(COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_USERNAME));
                }
                else{
                    RESULT.roles === admin ? NEXT() : RESPONSE.status(400).jsonp(COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED));
                }
            })
        }
    });
};

/********************************
 ****** User check model ********
 *********************************/
validateUser.userCheck = ( REQUEST, RESPONSE, NEXT )=>{
    let dataObj = REQUEST.query.username;
    if(REQUEST.query.username){
        dataObj = REQUEST.query;
    }else{
        dataObj = REQUEST.body;
    }
    COMMON_FUN.objProperties(dataObj, (ERR, RESULT)=> {
        if (ERR) {
            return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
        } else {
            MODEL.userModel.findOne({
                $or: [
                    {username: dataObj.username},
                    {email: dataObj.username}
                ]
            }, {}, {lean:true}, (ERR, RESULT) => {
                if (ERR) {
                    return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
                }else if(!RESULT){
                    return RESPONSE.jsonp(COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_USERNAME));
                }
                else{
                    RESULT.roles === CONSTANTS.DATABASE.USER_ROLES.USER ? NEXT() : RESPONSE.jsonp(COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED));
                }
            })
        }
    });
};

/* export userControllers */
module.exports = validateUser;