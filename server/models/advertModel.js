'use strict';
/************* Modules ***********/
const MONGOOSE = require('mongoose');
const Schema = MONGOOSE.Schema;
const Constants = require('../util/constants');

/**************************************************
 ************* advert Model or collection ***********
 **************************************************/
const advert_Schema = new Schema({
  title:{
    type: String
  },
  advert_url: {
    type: String,
    required: true,
  },
  duration : {   //In seconds
    type: Number
  },
  start_date:{
    type: Date,
    required:true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MONGOOSE.model('Advert', advert_Schema);
