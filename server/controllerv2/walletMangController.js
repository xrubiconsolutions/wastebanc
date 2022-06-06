const { tokenModel, centralAccountModel } = require("../models");
const {
  generateRandomString,
  decryptData,
  encryptData,
  SystemDeductions,
  IntraBank,
  GenerateVirtualAccount,
} = require("../util/commonFunction");
const moment = require("moment-timezone");
moment().tz("Africa/Lagos", false);

const {
  BankList,
  NIPNameInquiry,
  CustomerInformation,
} = require("../modules/partners/sterling/sterlingService");
const axios = require("axios");
const crypto = require("crypto");

class WalletController {
  // baseurl
  // constructor() {
  //   this.baseURL = "https://pakamapi.sterlingapps.p.azurewebsites.net/";
  //   this.key = "Sklqg625*&dltr01r";
  // }

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

      return res
        .status(200)
        .json({
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

  static async openingAccount(req, res) {
    try {
      const { bvn, nin, phone } = req.body;
      const result = await GenerateVirtualAccount(bvn, nin, phone);

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
}

module.exports = WalletController;
