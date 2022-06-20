const { transactionModel, invoiceModel } = require("../../models");
const rewardService = require("../../services/rewardService");
const { generateRandomString } = require("../../util/commonFunction");
const moment = require("moment-timezone");
moment().tz("Africa/Lagos", false);
class invoiceService {
  static async generateInvoice(start, end, companyId, authuser) {
    const [startDate, endDate] = [new Date(start), new Date(end)];
    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      organisationID: companyId,
      organisationPaid: false,
    };

    let state = [];
    if (authuser.locationScope === "All") {
      criteria.state = {
        $in: authuser.states,
      };
      state = authuser.states;
    } else {
      criteria.state = authuser.locationScope;
      state.push(authuser.locationScope);
    }

    let householdTotal = 0,
      wastePickersTotal = 0,
      totalValue = 0,
      sumPercentage = 0,
      transId = [];

    const totalResult = await transactionModel.find(criteria);

    if (totalResult.length > 0) {
      householdTotal = totalResult.reduce((a, b) => {
        return a.coin + b.coin;
      });

      wastePickersTotal = totalResult.reduce((a, b) => {
        return a.wastePickerCoin + b.wastePickerCoin;
      });

      totalValue = householdTotal + wastePickersTotal;
      sumPercentage = rewardService.calPercentage(totalValue, 10);
      totalValue = totalValue + sumPercentage;

      transId = totalResult.map((value) => value._id);
    }

    const dd = Date.now();
    const geneNo = generateRandomString(7) + `${dd}`;
    const invoiceNumber = geneNo.substring(0, 9);
    const expectedPaymentDate = moment().add(3, "days");

    const storeInvoice = await invoiceModel.create({
      companyId,
      invoiceNumber,
      startDate,
      endDate,
      transactionId: transId,
      amount: totalValue,
      serviceCharge: sumPercentage,
      expectedPaymentDate,
      //state: authuser.locationScope,
    });

    //console.log("invoice", storeInvoice);

    return {
      invoiceNumber,
      result: totalResult,
      householdTotal,
      wastePickersTotal,
      totalValue,
      sumPercentage,
    };
  }

  static async sendInvoice(invoiceNumber) {
    const invoiceData = await invoiceModel
      .findOne({
        invoiceNumber,
      })
      .populate("Organisation", "companyName", "email")
      .populate("transaction");

    if (!invoiceData) return false;

    return invoiceData;
  }

  static async summaryData(authuser) {
    let totalPayment = 0,
      totalOutStanding = 0,
      totalCompleted = 0,
      totalMaintanceFee = 0;
    let criteria = {
      event: "sent",
    };

    const invoices = await invoiceModel.find(criteria);

    if (invoices.length === 0) {
      return {
        totalPayment: 0,
        totalOutStanding: 0,
        totalCompleted: 0,
        totalMaintanceFee: 0,
      };
    }

    invoices.map((value) => {
      totalPayment = totalPayment + Number(value.amount);
    });
    // const totalPayment = invoices.reduce((a, b) => {
    //   return Number(a.amount) + Number(b.amount);
    // });

    invoices.map((value) => {
      if (value.paidStatus === "pending") {
        totalOutStanding = totalOutStanding + Number(value.amount);
      }
    });

    invoices.map((value) => {
      if (value.paidStatus === "paid") {
        totalCompleted = totalCompleted + Number(value.amount);
      }
    });

    invoices.map((value) => {
      totalMaintanceFee = totalMaintanceFee + Number(value.serviceCharge);
    });

    // const totalMaintanceFee = invoices.reduce((a, b) => {
    //   return Number(a.serviceCharge) + Number(b.serviceCharge);
    // });

    return {
      totalPayment,
      totalOutStanding,
      totalCompleted,
      totalMaintanceFee,
    };
  }

  static async markAsPaid(invoiceNumber, authuser) {
    const invoice = await invoiceModel.findOne({
      invoiceNumber,
    });

    if (!invoice) return false;

    const updateToPaid = await invoiceModel.updateOne({
      paidStatus: "paid",
      approvedBy: authuser._id,
      approvedDate: moment(),
      amountPaid: invoice.amount,
      balance: "0",
    });

    if (updateToPaid) {
      await transactionModel.updateMany(
        { _id: { $ni: transactionId } },
        {
          organisationPaid: true,
        }
      );
    }

    invoice.paidStatus = "paid";
    invoice.approvedBy = authuser._id;
    invoice.approvedDate = moment();
    invoice.amountPaid = invoice.amount;

    return invoice;
  }
}

module.exports = invoiceService;
