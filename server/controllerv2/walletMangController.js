const {
  tokenModel,
  centralAccountModel,
  transactionModel,
  payModel,
  userModel,
} = require("../models");
const {
  generateRandomString,
  decryptData,
  encryptData,
  SystemDeductions,
} = require("../util/commonFunction");
const moment = require("moment-timezone");
moment().tz("Africa/Lagos", false);
const axios = require("axios");

const {
  BankList,
  NIPNameInquiry,
  CustomerInformation,
  GenerateVirtualAccount,
  IntraBank,
  NIPFundTransfer,
} = require("../modules/partners/sterling/sterlingService");

const crypto = require("crypto");

class WalletController {
  // baseurl
  // constructor() {
  //   this.baseURL = "https://pakamapi.sterlingapps.p.azurewebsites.net/";
  //   this.key = "Sklqg625*&dltr01r";
  // }

  static async requestOTP(req, res) {
    try {
      const { user } = req;
      const body = {
        userId: user._id,
        destinationAccount: req.body.destinationAccount,
        destinationBankCode: req.body.destinationBankCode,
        amount: user.availablePoints,
        beneName: user.fullname,
        currency: "NGN",
        bankName: req.body.bankName,
        charge: 100,
        type: req.type,
        nesidNumber: req.body.nesidNumber || "",
        nerspNumber: req.body.nerspNumber || "",
        kycLevel: req.body.kycLevel || "",
      };

      const result = await axios.post(
        "https://apiv2.pakam.ng/api/request/otp",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      console.log("here", result);
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        error: true,
        message: "Error Request OTP",
      });
    }
  }

  static async requestPayout(req, res) {
    try {
      const { user } = req;
      const body = {
        userId: user._id,
        requestId: req.body.requestId,
        otp: req.body.otp,
      };
      const result = await axios.post(
        "https://apiv2.pakam.ng/api/disbursement/initiate",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      console.log(result);
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  }
  static async OTPRequest(req, res) {
    try {
      const { user } = req;
      let token = tokenModel.findOne({ userId: user._id.toString() });
      if (token) await token.deleteOne();

      const Token = generateRandomString(4);

      const save = await tokenModel.create({
        userId: user._id.toString(),
        token: Token,
        expiryTime: moment().add("5", "minutes"),
      });

      console.log("token", save);

      const phoneNo = String(user.phone).substring(1, 11);
      const msg = {
        api_key:
          "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
        type: "plain",
        to: `+234${phoneNo}`,
        from: "N-Alert",
        channel: "dnd",
        sms: `${save.token} is your OTP for Payment request in Pakam. OTP is valid for 5 minutes`,
      };

      const url = "https://api.ng.termii.com/api/sms/send";

      const sendSMS = await axios.post(url, JSON.stringify(msg), {
        headers: {
          "Content-Type": ["application/json", "application/json"],
        },
      });

      console.log("sms sent", sendSMS);

      return res.status(200).json({
        error: false,
        message: "Verification token",
        data: Token,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async bankListOO(req, res) {
    try {
      const result = await axios.get(
        `https://pakamapi.sterlingapps.p.azurewebsites.net/api/Transaction/BankList`,
        {
          headers: {
            Channel: "Web",
            Authorization: "Web",
          },
        }
      );

      const encryptedList = result.data;

      let secret_salt = "Sklqg625*&dltr01r";
      let secret_iv = "Jod0458jpkc34vb9";
      let passPhrase = "Et2347fdrloln95@#qi";
      let keySize = 32;
      let it = 2;

      let iv = Buffer.from(secret_iv);

      let salt = Buffer.from(secret_salt);

      let encryptedMessage = Buffer.from(encryptedList, "base64");

      encryptedMessage = encryptedMessage.toString("utf-8");

      let key = crypto.pbkdf2Sync(passPhrase, salt, it, keySize, "sha1");

      const decipher = crypto.createDecipheriv("AES-256-CBC", key, iv);

      let decrypted = decipher.update(encryptedList, "base64", "utf8");
      decrypted += decipher.final("utf8");
      const bankLists = JSON.parse(decrypted);

      return res.status(200).json({
        error: false,
        message: "List of banks",
        data: bankLists.Data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async bankList(req, res) {
    try {
      const result = await BankList();
      console.log(result);
      if (result.error)
        return res.status(400).json({ error: true, message: result.message });

      return res
        .status(200)
        .json({ error: false, message: result.message, data: result.data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async verifyAccount(req, res) {
    try {
      const result = await NIPNameInquiry(
        req.body.accountNumber,
        req.body.BankCode
      );
      if (result.error)
        return res.status(400).json({ error: true, message: result.message });

      return res.status(200).json({
        error: false,
        message: result.message,
        data: result.data.Data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async verifyCustomer(req, res) {
    try {
      const result = await CustomerInformation(req.params.accountNo);
      if (result.error)
        return res.status(400).json({ error: true, message: result.message });

      return res
        .status(200)
        .json({ error: false, message: result.message, data: result.data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async encrypt(req, res) {
    let salt = "Sklqg625*&dltr01r";
    let iv = "Jod0458jpkc34vb9";
    let passPhrase = "Et2347fdrloln95@#qi";
    let keySize = 32;
    let it = 2;

    try {
      const en = encryptData(req.body.data, salt, iv, passPhrase, keySize, it);

      return res.status(200).json({ en });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  static async decrypt(req, res) {
    let salt = "Sklqg625*&dltr01r";
    let iv = "Jod0458jpkc34vb9";
    let passPhrase = "Et2347fdrloln95@#qi";
    let keySize = 32;
    let it = 2;

    try {
      const decryptedData = decryptData(
        req.body.data,
        salt,
        iv,
        passPhrase,
        keySize,
        it
      );

      return res.status(200).json({ decryptedData });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  static async collectorPayout(req, res) {
    try {
      const { user } = req;
      const pointGained = user.pointGained || 0;
      const { bankName, bankCode, OTP, isNew } = req.body;

      let VToken = await tokenModel.findOne({ userId: user._id, token: OTP });
      if (!VToken)
        return res.status(400).json({
          error: true,
          message: "Invalid OTP passed",
        });

      if (moment() > moment(VToken.expiryTime)) {
        return res.status(400).json({
          error: true,
          message: "OTP expired",
        });
      }
      if (pointGained < 5000) {
        return res.status(400).json({
          error: true,
          message: "You don't have enough points to complete this transaction",
        });
      }

      // first deduct charges for sterling pickers
      // intra bank transfer sending all pointGained
      // remove total collected of the collector and set pointGained to zero(0)

      const amount = pointGained - SystemDeductions(pointGained);

      const centralAccount = await centralAccountModel.findOne({
        name: "Pakam Account",
      });

      //if(parseFloat(centralAccount.balance) < )
      const transfer = await IntraBank(centralAccount.acnumber);

      if (isNew) {
        // save the account to the collector database
        // if (bankName == "Sterling Bank" || bankCode == "000001") {
        //   // intra bank transfer
        // } else {
        //   // nip transfer
        // }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  // account opening
  static async openingAccount(req, res) {
    try {
      const { user } = req;
      const { bvn, nin, phone } = req.body;

      if (user.accountNo)
        return res.status(400).json({
          error: true,
          message: "User already has an account number registered",
        });
      const result = await GenerateVirtualAccount(bvn, nin, phone);

      if (result.error)
        return res.status(400).json({ error: true, message: result.message });

      const updateUser = await userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            accountNo: result.data.AccountNo,
            cifNo: result.data.cifNo,
          },
        }
      );

      console.log("store user account number", updateUser);
      return res.status(200).json({
        error: false,
        message: result.message,
        data: { cifoNo: result.data.cifNo, accountNo: result.data.AccountNo },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async nipTransfer(req, res) {
    try {
      const {
        OTP,
        accountNumber,
        customerName,
        bankCode,
        nesid,
        nersp,
        bvn,
        kycLevel,
      } = req.body;
      const { user } = req;
      const amount = user.availablePoints;
      const token = await tokenModel.findOne({
        userId: user._id.toString(),
        token: OTP,
      });

      if (!token) {
        return res.status(400).json({
          error: true,
          message: "Invalid OTP Passed",
        });
      }

      console.log("user", user);
      if (moment() > moment(token.expiryTime)) {
        return res.status(400).json({
          error: true,
          message: "OTP has expired",
        });
      }
      const centralAccount = await centralAccountModel.findOne({});

      if (!centralAccount) {
        // send out mail or notification to backend developer
        console.log("cannot find central account");
        return res.status(400).json({
          error: true,
          message:
            "Payment cannot be processed,Please contact customer service",
        });
      }

      if (parseFloat(centralAccount.balance) < 0) {
        console.log("insufficent balance in central account");
        return res.status(400).json({
          error: true,
          message:
            "Payment cannot be processed,Please contact customer service",
        });
      }
      if (Number(amount) < 0) {
        return res.status(400).json({
          error: true,
          message: "You don't have enough points to complete this transaction",
        });
      }

      if (Number(amount) < 5000) {
        return res.status(400).json({
          message: "You don't have enough points to complete this transaction",
        });
      }

      const allTransactions = await transactionModel
        .find({
          paid: false,
          requestedForPayment: false,
          cardID: user._id.toString(),
        })
        .select("_id");

      if (allTransactions.length < 0) {
        return res.status(400).json({
          error: true,
          message:
            "Payment cannot be processed,Please contact customer service",
        });
      }

      const requestId = generateRandomString(6, "alphnumeric");
      const paymentReference = generateRandomString(8, "alphnumeric");
      const referenceCode = generateRandomString(7);

      // request payment to sterling
      const result = await NIPFundTransfer(
        centralAccount.acnumber,
        accountNumber,
        bankCode,
        "10",
        customerName,
        centralAccount.name,
        nesid,
        nersp,
        bvn,
        kycLevel,
        requestId,
        referenceCode,
        paymentReference
      );

      if (result.error) return res.status(400).json(result);

      // store activity
      return res.status(200).json({
        error: false,
        message: "Payment request made successfully",
        data: result,
      });
    } catch (error) {
      //console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
        data: result,
      });
    }
  }

  static async intraBank(req, res) {
    try {
      const { user } = req;
      const { OTP, accountNumber, beneName } = req.body;

      const amount = user.availablePoints || user.pointGained;
      const token = await tokenModel.findOne({
        userId: user._id.toString(),
        token: OTP,
      });

      if (!token) {
        return res.status(400).json({
          error: true,
          message: "Invalid OTP Passed",
        });
      }

      console.log("user", user);
      if (moment() > moment(token.expiryTime)) {
        return res.status(400).json({
          error: true,
          message: "OTP has expired",
        });
      }
      const centralAccount = await centralAccountModel.findOne({});

      if (!centralAccount) {
        // send out mail or notification to backend developer
        console.log("cannot find central account");
        return res.status(400).json({
          error: true,
          message:
            "Payment cannot be processed,Please contact customer service",
        });
      }

      if (parseFloat(centralAccount.balance) < 0) {
        console.log("insufficent balance in central account");
        return res.status(400).json({
          error: true,
          message:
            "Payment cannot be processed,Please contact customer service",
        });
      }
      if (Number(amount) < 0) {
        return res.status(400).json({
          error: true,
          message: "You don't have enough points to complete this transaction",
        });
      }

      if (Number(amount) < 5000) {
        return res.status(400).json({
          message: "You don't have enough points to complete this transaction",
        });
      }

      const allTransactions = await transactionModel
        .find({
          paid: false,
          requestedForPayment: false,
          cardID: user._id.toString(),
        })
        .select("_id");

      if (allTransactions.length < 0) {
        return res.status(400).json({
          error: true,
          message:
            "Payment cannot be processed,Please contact customer service",
        });
      }

      const paymentRef = generateRandomString(8, "alphnumeric");

      const result = await IntraBank(
        centralAccount.acnumber,
        accountNumber,
        amount,
        paymentRef,
        "Wallet Payment withdrawal",
        beneName,
        centralAccount.name
      );

      return res.status(200).json({
        error: false,
        message: "Payment request made successfully",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
        data: result,
      });
    }
  }
}

module.exports = WalletController;
