/**
 * Created by Radhey Shyam on 15/02/18.
 */

"use strict";

/******************************************
 ****** Default Server configuration ******
 ******************************************/
let serverConfig = {
    mongodb: {
        host        : "127.0.0.1",
        port        : 27017,
        name        : "mongodb",
        connector   : "mongodb", 
        url         : process.env.dbUrl || "mongodb://pakamXrubicon:me202010*@pakam-shard-00-00.wcabw.mongodb.net:27017,pakam-shard-00-01.wcabw.mongodb.net:27017,pakam-shard-00-02.wcabw.mongodb.net:27017/pakam?ssl=true&replicaSet=atlas-13j6g2-shard-0&authSource=admin&retryWrites=true&w=majority",
        database    : "demo_dev",
        user        : "",
        password    : "",
    },
    host    : "localhost",
    type    : "http://",
    port    : process.env.PORT || '4000'
};


/***********************************
 ** Maintain server Configuration **
 **** according to env variable ****
 ***********************************/
if(process.env.NODE_ENV === "development"){   
    serverConfig.mongodb.user           =   "";
    serverConfig.mongodb.password       =   "";
}
else if( process.env.NODE_ENV === "production"){
    serverConfig.mongodb.url            =   "mongodb://pakamXrubicon:me202010*@pakam-shard-00-00.wcabw.mongodb.net:27017,pakam-shard-00-01.wcabw.mongodb.net:27017,pakam-shard-00-02.wcabw.mongodb.net:27017/pakam?ssl=true&replicaSet=atlas-13j6g2-shard-0&authSource=admin&retryWrites=true&w=majority" ;
    serverConfig.mongodb.database       =   "pakam";
    serverConfig.mongodb.user           =   "";
    serverConfig.mongodb.password       =   "";
    serverConfig.port                   =   process.env.PORT || "4001";
}

/** exporting server configuration **/
module.exports = serverConfig;



