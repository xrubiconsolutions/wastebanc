
'use strict';

/*******************************
 *** MONGOOSE for connection ***
 *******************************/
let MONGOOSE   =  require('mongoose');

MONGOOSE.set('useFindAndModify', false);
/*******************************
 ***** Mongodb connection  *****
 *******************************/
module.exports = (URL) => {
    return new Promise((resolve, reject) => {
        MONGOOSE.connect(URL, { useNewUrlParser: true }, (err, response)=>{
            if(err)
                reject(err);
            else
                resolve(null);
        });    
    })
};

