'use strict';
/************* Modules ***********/
const MONGOOSE = require('mongoose');
const Schema = MONGOOSE.Schema;
const Constants = require('../util/constants');

const payOut_Schema = {
  transactionReference: {
    type: String,
  },
  paymentReference: {
    type: String,
  },
  amountPaid: {
    type: String,
  },
  totalPayable: {
    type: String,
  },
  accountDetails: {
    type: Object,
    // "accountName" : "John Ciroma Abuh",
    // "accountNumber" : "******4872",
    // "bankCode" : "000015",
    // "amountPaid" : "180000.00"
  },
  accountPayments: {
    type: [Object],
    // [ {
    //         "accountName" : "John Ciroma Abuh",
    //         "accountNumber" : "******4872",
    //         "bankCode" : "000015",
    //         "amountPaid" : "180000.00"
    //             } ],
  },
  customer: {
    type: Object,

    //  {
    //         "email" : "dojinaka@monnify.com",
    //         "name" : "Daniel Ojinaka"
    //             },
  },
  metaData: {
    type: Object,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
};

module.exports = MONGOOSE.model('payOut', payOut_Schema);
