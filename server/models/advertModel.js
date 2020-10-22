'use strict';
/************* Modules ***********/
const MONGOOSE = require('mongoose');
const Schema = MONGOOSE.Schema;
const Constants = require('../util/constants');

/**************************************************
 ************* advert Model or collection ***********
 **************************************************/
const advert_Schema = new Schema({
  advert_url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MONGOOSE.model('Advert', advert_Schema);
