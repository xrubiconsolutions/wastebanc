/**
 * express server setup
 */

'use strict';

/***********************************
 **** node module defined here *****
 ***********************************/
const EXPRESS      = require("express");
const BODY_PARSER  = require("body-parser");
const ALLFILES     = require("./../filebundle");
const SWAGGER      = require('./swagger/swagger_lib/swagger-express');
const PATH         = require("path");
const BOOTSTRAPING = require("../server/util/Bootstraping/Bootstraping");
const MODEL = require("../server/models")
const cron = require('node-cron');
var request = require('request');

var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pakambusiness@gmail.com",
    pass: "pakambusiness-2000",
  },
});




var sendNotification = function (data) {
  
  var headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  var options = {
    host: 'onesignal.com',
    port: 443,
    path: '/api/v1/notifications',
    method: 'POST',
    headers: headers,
  };

  var https = require('https');
  var req = https.request(options, function (res) {
    res.on('data', function (data) {
      console.log('Response:');
      console.log(JSON.parse(data));
    });
  });

  req.on('error', function (e) {
    console.log('ERROR:');
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

cron.schedule('* * * * *', function() {
  console.log("<wallet check>")
  MODEL.organisationModel.find({
  }).then((val)=>{
    for(let i = 0; i < val.length ; i++){
      MODEL.transactionModel
      .find({ organisationID: val[i]._id, paid : false  })
      .sort({ _id: -1 })
      .then((recycler, err) => {
        let totalCoin = recycler
          .map((val) => val.coin)
          .reduce((acc, curr) => acc + curr,0);
          MODEL.organisationModel.updateOne(
            { "email": `${val[i].email}` },
           { "$set": { "wallet" : totalCoin * 10 } },
            (err, resp) => {
              if (err) {
                return RESPONSE.status(400).jsonp(err);
              }             
            }
          );
      })
      .catch((err) => console.log(err));
    }
  })
  })
  

cron.schedule('* * 1 * *', function() {
    var today = new Date();
    MODEL.organisationModel.find({}).then((organisations)=>{
        for(let i = 0 ; i < organisations.length ; i++){
            var diff = organisations[i].expiry_date - today;
            var test = diff/(1000*24*60*60)
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
})

});


// Run reminder for schedule pick up every 2 hours '0 0 */2 * * *'


cron.schedule('01 7 * * *', function(){
  var today = new Date()
  const messages = "Your pick up schedule is today. Kindly be available to receiver our recycler"  //Custom schedule reminder message
  console.log('<<RUNNER CHECK>>>');
  MODEL.scheduleModel.find({
    reminder: true , completionStatus : "pending" , collectorStatus: "accept"
  }).then((schedules)=>{
    for(let i = 0 ; i < schedules.length ; i++){
      const time = schedules[i]. pickUpDate;
      const val = (time - today) / 1000 ;
      const diff = val/3600
        MODEL.userModel.findOne({
          email: schedules[i].client
        }).then((user)=>{
          var message = {
            app_id: '8d939dc2-59c5-4458-8106-1e6f6fbe392d',
            contents: {
              en: `${messages}`,
            },
            include_player_ids: [`${user.onesignal_id}`],
          };
          sendNotification(message);
        })           
    }
  })
});


// MODEL.userModel.find({verified: true}).then((organisations)=>{
//   for(let i = 0 ; i < organisations.length ; i++){


//     MODEL.userrModel.updateOne(
//       { email: organisations[i].email },
//       {
//         $set: {
//           fullname: mobile_carrier,
//         },
//       },
//       (res) => {
//         console.log("success")

//         return "Done"
//       })



//     var phoneNo = String(organisations[i].phone).substring(1,11);

//     var data = {
//       "api_key": "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
//       "phone_number": `+234${phoneNo}`,
//       "country_code": "NG"
//     };
// var options = {
// 'method': 'GET',
// 'url': ' https://termii.com/api/insight/number/query',
// 'headers': {
// 'Content-Type': ['application/json', 'application/json']
// },
// body: JSON.stringify(data)

// };

//     request(options, function (error, response) { 
//       if (error) throw new Error(error);
//       var mobileData = JSON.parse(response.body);
//       var mobile_carrier = mobileData.result[0].operatorDetail.operatorName;
//     MODEL.collectorModel.updateOne(
//                     { email: organisations[i].email },
//                     {
//                       $set: {
//                         mobile_carrier: mobile_carrier,
//                       },
//                     },
//                     (res) => {
//                       console.log("success")
    
//                       return "Done"
//                     })
    
//                   })
 
//   }
//   }
// }
// )





  
const cors = require("cors");



var fileUpload = require('express-fileupload');
const reportModel = require("../server/models/reportModel");
const reportModelLog = require("../server/models/reportModelLog");




// const PubNub = require('pubnub');
// const uuid = PubNub.generateUUID();
// const pubnub = new PubNub({
//   publishKey: "pub-c-fc18a8e9-3662-4d35-89e9-e71e91cc4fd0",
//   subscribeKey: "sub-c-169862d4-e21e-11ea-89a6-b2966c0cfe96",
//   uuid: uuid
// });

// const publishConfig = {
//   channel: "pubnub_onboarding_channel",
//   message: {"sender": uuid, "content": "Hello From Packam"}
// }

// pubnub.addListener({
//   message: function(message) {
//     console.log(message);
//   },
//   presence: function(presenceEvent) {
//     console.log(presenceEvent);
//   }
// })

// pubnub.subscribe({
//   channels: ["pubnub_onboarding_channel"],
//   withPresence: true,
// });

// pubnub.publish(publishConfig, function(status, response) {
//   console.log(status, response);
// });


// pubnub.publish(publishConfig, function(status, response) {
//     console.log(status, response);
//   });


/**creating express server app for server */
const app  = EXPRESS();
const http = require('http').Server(app);

const io = require('socket.io')(http,{
  cors: {
    origin: '*',
  }
});


// const io = socket(app,  {
//   cors: {
//     origin: "https://dashboard.pakam.ng",
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// }  );


io.on("connection", function(){return console.log("connected to socket")})

const changeStream =  reportModelLog.watch();  


changeStream.on('change', function(change) {
  console.log('COLLECTION CHANGED');

  reportModelLog.find({}, (err, data) => {
      if (err) throw err;


      io.on("connection",(socket)=>{
         if (data) {
        // RESEND ALL USERS
        console.log(data[data.length-1])
        socket.emit('reports', data);
    }
      } )


     
  });
});



// const Http = require("https").Server(app)

// const Socketio = require("socket.io")(Http);


// app.get("/api/location/realtime" , (req, res) => {




//   // var lat = req.query.lat;
//   // var long = req.query.long;



//   const locations = [];
//   Socketio.on("connection", socket => {
//     console.log(socket)
//     // return res.send({data: socket})
//     console.log("connections here", socket)
//     res.send(socket)
//               for(let i = 0 ; i < locations.length; i ++){
//                   socket.emit("location", locations[i]);
//               }
//               socket.on("location", data=>{
//                   locations.push(data);
//                   Socketio.emit("location", data)
//                     res.send({message: " " })
//         })
//   })
// }
// )

/********************************
 ***** Server Configuration *****
 ********************************/
    app.set('port', process.env.PORT || ALLFILES.CONFIG.dbConfig.port);
    app.set('swagger_views', __dirname + '../swagger_views');
    app.set('view engine', 'jade');
    app.use(EXPRESS.static("client"));
    app.use(BODY_PARSER.json({limit: '50mb'}));
    app.use(BODY_PARSER.urlencoded({ limit: '50mb', extended: false }));

    /** middleware for api's logging with deployment mode */
    let apiLooger = (req, res, next)=>{
            ALLFILES.COMMON_FUN.messageLogs(null, `api hitted ${req.url} ${ process.env.NODE_ENV}`);
            next();
    };

    app.use(fileUpload());

    /** Used logger middleware for each api call **/
    app.use(apiLooger);

    /*******************************
     *** For handling CORS Error ***
     *******************************/
    app.all('/*', (REQUEST, RESPONSE, NEXT) => {
        RESPONSE.header('Access-Control-Allow-Origin', '*');
        RESPONSE.header('Access-Control-Allow-Headers','Content-Type, api_key, Authorization, x-requested-with, Total-Count, Total-Pages, Error-Message');
        RESPONSE.header('Access-Control-Allow-Methods','POST, GET, DELETE, PUT, OPTIONS');
        RESPONSE.header('Access-Control-Max-Age',1800);
        NEXT();
    });

/*******************************
 **** Swagger configuration ****
 *******************************/
    app.use(SWAGGER.init(app, {
        apiVersion: '1.0',
        swaggerVersion: '1.0',
        basePath: "http://" + ALLFILES.CONFIG.dbConfig.host + ":" +ALLFILES.CONFIG.dbConfig.port,
        swaggerURL: '/api_documentation',
        swaggerJSON: '/api-docs.json',
        swaggerUI: './swagger/swagger_dependencies/swagger',
        apis: [
            PATH.join(__dirname, '/swagger/swagger_Routes/user.js'),
        ]
    }));
    app.use(EXPRESS.static(PATH.join(__dirname, 'swagger/swagger_dependencies')));


/*******************************
 ****** initializing routes ****
 *******************************/
require('../server/routes')(app);


/** server listening */
module.exports = () => {

    /*******************************
     ****** Admin Bootstrapping ****
     *******************************/
    // BOOTSTRAPING.bootstrapAdmin((ERR, RESULT)=>{
    //     if(ERR){
    //         ALLFILES.COMMON_FUN.messageLogs(ERR.message, null);
    //         process.exit(0);
    //     }else{
    //         ALLFILES.COMMON_FUN.messageLogs(null, "**************Bootstraping done**************");
    //     }
    // });

    /*******************************
     ****** Version Controller* ****
     *******************************/
    BOOTSTRAPING.bootstrapAppVersion();


    /** Server is running here */
    app.listen(ALLFILES.CONFIG.dbConfig.port, ()=>{
        ALLFILES.COMMON_FUN.messageLogs(null, `**************Server is running on ${ALLFILES.CONFIG.dbConfig.port} **************`);
    });
};



