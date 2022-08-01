const {
  transactionModel,
  invoiceModel,
  organisationModel,
} = require("../../models");
const rewardService = require("../../services/rewardService");
const { generateRandomString } = require("../../util/commonFunction");
const moment = require("moment-timezone");
moment().tz("Africa/Lagos", false);
const { ObjectId } = require("mongodb");
const invoiceTemplate = require("../../../email-templates/invoice.template");
const sgMail = require("@sendgrid/mail");
class invoiceService {
  static async generateInvoice(start, end, companyId, authuser) {
    const organisation = await organisationModel.findById(companyId);

    if (!organisation) throw new Error("Invalid companyId passed");
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

    await invoiceModel.create({
      company: companyId,
      organisationName: organisation.companyName,
      invoiceNumber,
      startDate,
      endDate,
      transactions: transId,
      amount: totalValue,
      serviceCharge: sumPercentage,
      expectedPaymentDate,
      state,
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
      .populate("company", "companyName email phone location")
      .populate("transactions");

    if (!invoiceData) return false;

    // prepare invoice template and send invoice
    const template = invoiceTemplate(invoiceData);
    sgMail.setApiKey(
      "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"
    );

    const msg = {
      // to: `${invoiceData.company.email}`,
      to: "ahmodadeora@gmail.com",
      from: "pakam@xrubiconsolutions.com", // Use the email address or domain you verified above
      subject: "INVOICE",
      html: template,
    };

    await sgMail.send(msg);
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

    if (!invoice) return { error: true, msg: "Invoice not found", data: null };
    if (invoice.paidStatus === "paid")
      return { error: false, msg: "Invoice already paid for", data: null };

    const updateToPaid = await invoiceModel.updateOne(
      { _id: invoice._id },
      {
        paidStatus: "paid",
        approvedBy: authuser._id,
        approvedDate: moment(),
        amountPaid: invoice.amount,
        balance: "0",
      }
    );

    if (updateToPaid) {
      await transactionModel.updateMany(
        { _id: { $in: invoice.transactions } },
        {
          organisationPaid: true,
        }
      );
    }

    invoice.paidStatus = "paid";
    invoice.approvedBy = authuser._id;
    invoice.approvedDate = moment();
    invoice.amountPaid = invoice.amount;

    return {
      error: false,
      msg: "Invoice marked as paid successfully",
      data: invoice,
    };
  }

  static async invoices(page, resultsPerPage, user, key, start, end, status) {
    const currentScope = user.locationScope;
    if (!currentScope) {
      return {
        error: true,
        message: "Invalid request",
      };
    }
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    let criteria, state;
    if (key) {
      criteria = {
        $or: [
          { invoiceNumber: { $regex: `.*${key}.*`, $options: "i" } },
          { amount: { $regex: `.*${key}.*`, $options: "i" } },
          { serviceCharge: { $regex: `.*${key}.*`, $options: "i" } },
          { organisationName: { $regex: `.*${key}.*`, $options: "i" } },
        ],
      };
    } else if (start || end) {
      if (!start || !end) {
        return {
          error: true,
          message: "Please pass a start and end date",
        };
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    } else {
      criteria = {};
    }

    if (currentScope === "All") {
      state = user.state;
    } else {
      state = [currentScope];
      criteria.state = currentScope;
    }

    criteria.paidStatus = status;
    criteria.state = {
      $in: user.states,
    };

    const totalResult = await invoiceModel.countDocuments(criteria);
    const invoices = await invoiceModel
      .find(criteria)
      .populate("company", ["companyName", "email", "phone", "companyTag"])
      .select([
        "_id",
        "invoiceNumber",
        "organisationName",
        "amount",
        "serviceCharge",
        "paidStatus",
        "createdAt",
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return {
      error: false,
      message: "success",
      data: {
        invoices,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      },
    };
  }

  static async getinvoiceById(invoiceId) {
    const invoice = await invoiceModel
      .findOne({ _id: invoiceId })
      .populate("company", ["companyName", "email", "phone", "companyTag"])
      .populate("transactions", [
        "categories",
        "category",
        "type",
        "weight",
        "coin",
        "wastePickerCoin",
        "type",
      ]);

    if (!invoice)
      return {
        error: true,
        message: "Invoice Not found",
      };

    return {
      error: false,
      message: "success",
      data: invoice,
    };
  }
}

module.exports = invoiceService;
