'use strict';
let CONTROLLER = require('../../controller');
let auth = require('../../util/auth');

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/

module.exports = (APP) => {
  APP.route('/api/create/organisation').post(
    CONTROLLER.organisationController.createOrganisation
  );

  APP.route('/api/login/organisation').post(
    CONTROLLER.organisationController.loginOrganisation
  );

  APP.route('/api/reset/password/organisation').post(
    CONTROLLER.organisationController.changedlogedInPassword
  );

  APP.route('/api/check/organisation').get(
    CONTROLLER.organisationController.listOrganisation
  );

  APP.route('/api/approve/organisation').post(
    CONTROLLER.organisationController.agentApproval
  );

  APP.route('/api/decline/organisation').post(
    CONTROLLER.organisationController.agentDecline
  );

  APP.route('/api/schedule/organisation').get(
    CONTROLLER.organisationController.organisationSchedules
  );

  APP.route('/api/recyclers/organisation').get(
    CONTROLLER.organisationController.approvedAgents
  );

  APP.route('/api/coins/organisation').get(
    CONTROLLER.organisationController.coinBank
  );

  APP.route('/api/recycler/organisation/coin').get(
    CONTROLLER.organisationController.recyclerPay
  );

  APP.route('/api/recyclers/organisation/coin').get(
    CONTROLLER.organisationController.recyclerActions
  );

  APP.route('/api/weight/organisation').get(
    CONTROLLER.organisationController.wasteCounter
  );

  APP.route('/api/transactions/organisation').get(
    auth.companyValidation,
    CONTROLLER.organisationController.numberTransaction
  );

  APP.route('/api/totalSchedules/organisation').get(
    CONTROLLER.organisationController.totalSchedules
  );

  APP.route('/api/transaction/history/organisation').get(
    CONTROLLER.organisationController.historyTransaction
  );

  APP.route('/api/all/recyclers').get(
    CONTROLLER.organisationController.allRecyclers
  );

  APP.route('/api/all/pending/recyclers').get(
    CONTROLLER.organisationController.allPendingRecycler
  );

  APP.route('/api/all/users').get(CONTROLLER.organisationController.allUsers);

  APP.route('/api/recycler/payment/receipt').post(
    CONTROLLER.organisationController.payRecyclers
  );

  APP.route('/api/recycler/payment/log').post(
    CONTROLLER.organisationController.paymentLog
  );

  APP.route('/api/company/log/history').get(
    CONTROLLER.organisationController.logHistory
  );

  APP.route('/api/recycler/payment/history').get(
    CONTROLLER.organisationController.getAllTransactions
  );

  APP.route('/api/organisation/bank/payment').post(
    CONTROLLER.organisationController.organisationPayout
  );

  APP.route('/api/organisation/month/chart').get(
    CONTROLLER.organisationController.monthChartData
  );

  APP.route('/api/organisation/third/chart').get(
    CONTROLLER.organisationController.thirdChartData
  );

  APP.route('/api/organisation/forth/chart').get(
    CONTROLLER.organisationController.forthChartData
  );

  APP.route('/api/organisation/week/chart').get(
    CONTROLLER.organisationController.weekChartData
  );

  APP.route('/api/organisation/raffle').post(
    auth.adminPakamValidation,
    CONTROLLER.organisationController.raffleTicket
  );

  APP.route('/api/organisation/waste/history').get(
    CONTROLLER.organisationController.wasteHistory
  );

  APP.route('/api/lawma/transaction/history').get(
    CONTROLLER.organisationController.lawmaTransaction
  );

  APP.route('/api/all/transaction/history').get(
    CONTROLLER.organisationController.adminTransaction
  );

  APP.route('/api/all/transaction/recycler/history').get(
    CONTROLLER.organisationController.adminCompanyTransaction
  );

  APP.route('/api/organisation/lawma/month/chart').get(
    CONTROLLER.organisationController.lawmaMonthChartData
  );

  APP.route('/api/organisation/lawma/third/chart').get(
    CONTROLLER.organisationController.lawmaThirdChartData
  );

  APP.route('/api/organisation/lawma/forth/chart').get(
    CONTROLLER.organisationController.lawmaForthChartData
  );

  APP.route('/api/organisation/lawma/week/chart').get(
    CONTROLLER.organisationController.lawmaWeekChartData
  );

  APP.route('/api/analytics/missed/schedule').get(
    CONTROLLER.organisationController.allMissedSchedules
  );

  APP.route('/api/analytics/pending/schedule').get(
    CONTROLLER.organisationController.allPendingSchedules
  );

  APP.route('/api/analytics/completed/schedule').get(
    CONTROLLER.organisationController.allCompletedSchedules
  );

  APP.route('/api/analytics/cancelled/schedule').get(
    CONTROLLER.organisationController.allCancelledchedules
  );

  APP.route('/api/analytics/all/schedule').get(
    CONTROLLER.organisationController.viewAllSchedules
  );

  APP.route('/api/coin/analytics').get(
    CONTROLLER.organisationController.totalCoinAnalytics
  );

  APP.route('/api/delete/company').post(
    CONTROLLER.organisationController.deleteCompany
  );

  APP.route('/api/growth/company').get(
    CONTROLLER.organisationController.companyGrowth
  );

  APP.route('/api/sales/growth').get(
    CONTROLLER.organisationController.salesGrowth
  );

  APP.route('/api/schedule/analytics').get(
    CONTROLLER.organisationController.scheduleAnalysis
  );

  APP.route('/api/advert/analytics').get(
    CONTROLLER.organisationController.advertGrowth
  );

  APP.route('/api/total/company').get(
    CONTROLLER.organisationController.getTotalCompany
  );

  APP.route('/api/total/weight').get(
    CONTROLLER.organisationController.totalWeightAnalytics
  );

  APP.route('/api/category/analytics').get(
    auth.adminValidation,
    CONTROLLER.organisationController.categoryAnalytics
  );

  APP.route('/api/licence/analytics').get(
    auth.adminValidation,
    CONTROLLER.organisationController.licencePaymentGrowth
  );

  APP.route('/api/company/receipts/analytics').get(
    CONTROLLER.organisationController.companyReceiptTransactions
  );

  APP.route('/api/company/growth/analytics').get(
    CONTROLLER.organisationController.companyGrowthAnalytics
  );

  APP.route('/api/company/decline/analytics').get(
    auth.adminValidation,
    CONTROLLER.organisationController.companyDeclineAnalytics
  );

  APP.route('/api/advert/submission').post(
    CONTROLLER.organisationController.advertControl
  );

  APP.route('/api/delete/advert').post(
    auth.adminValidation,
    CONTROLLER.organisationController.deleteAdvert
  );

  APP.route('/api/monify/payment').post(
    CONTROLLER.organisationController.monifyHook
  );
  APP.route('/api/monify/receipts').get(
    auth.companyValidation,
    CONTROLLER.organisationController.monifyReceipts
  );
  APP.route('/api/company/recyclers').get(
    CONTROLLER.organisationController.organisationRecyclers
  );

  APP.route('/api/pay/portal').post(
    auth.companyValidation,
    CONTROLLER.organisationController.payPortal
  );
  APP.route('/api/organisation/profile').get(
    auth.companyPakamDataValidation,
    CONTROLLER.organisationController.checkProfile
  );
  APP.route('/api/update/organisation/data').post(
    auth.companyPakamDataValidation,
    CONTROLLER.organisationController.updateOrganisationProfile
  );
  APP.route('/api/organisation/rad/geofenced').get(
    auth.companyValidation,
    CONTROLLER.organisationController.getGeofencedCoordinates
  );

  APP.route('/api/organisation/pending/geofenced').get(
    auth.companyValidation,
    CONTROLLER.organisationController.organisationSchedulesPending
  );

  APP.route('/api/forgot/company/token').post(
    CONTROLLER.organisationController.resetCompanyPassword
  );

  APP.route('/api/validate/company/token').post(
    CONTROLLER.organisationController.validateCompanyToken
  );

  APP.route('/api/reset/company/password').post(
    CONTROLLER.organisationController.changeCompanyPassword
  );

  APP.route('/api/organisation/payment/aggregate').get(
    auth.adminValidation,
    CONTROLLER.organisationController.organisationPaymentAggregate
  );

  APP.route('/api/organisation/submit/drop/location').post(
    auth.companyValidation,
    CONTROLLER.organisationController.submitDropOff
  );

  APP.route('/api/organisation/drop').get(
    auth.companyPakamDataValidation,
    CONTROLLER.organisationController.getDropOff
  );

  APP.route('/api/user/drop').get(
    auth.userValidation,
    CONTROLLER.organisationController.getDropOffUser
  )

  APP.route('/api/submit/organisation/invoice').post(
    auth.adminPakamValidation,
    CONTROLLER.organisationController.sendInvoiceMail
  );

  APP.route('/api/all/charity').get(
    CONTROLLER.organisationController.getCharityPaymentLawma
  );


  APP.route('/api/organisation/charity').get(
    auth.adminPakamValidation,
    CONTROLLER.organisationController.getCharityPaymentOrganisation
  );

};
