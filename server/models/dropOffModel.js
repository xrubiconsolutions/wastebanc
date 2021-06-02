'use strict';
/************* Modules ***********/
const MONGOOSE = require('mongoose');
const Schema = MONGOOSE.Schema;
const Constants = require('../util/constants');

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const dropOff_Schema = new Schema({
  organisation: {
    type: String,
    required: true,
  },
  organisationId: {
    type: String,
    required : true
  },
  address: {
    type: String,
  },
  lat: {
    type: String,
    required: true,
  },
  long: {
    type: String,
    required: true,
  },

  lastDroppedDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = MONGOOSE.model('dropOff', dropOff_Schema);
