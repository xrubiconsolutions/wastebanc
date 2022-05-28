const { tokenModel } = require("../models");
const { generateRandomString } = require("../util/commonFunction");
const moment = require("moment-timezone");
moment().tz("Africa/Lagos", false);

const axios = require("axios");
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

  static async bankList(req, res) {
    try {
      const result = await axios.get(
        `https://pakamapi.sterlingapps.p.azurewebsites.net/api/Transaction/BankList`,
        {
          headers: {
            Channel: "Web",
          },
        }
      );

      console.log("data", result);
      const encryptedList = result.data;

      return res.status(200).json({
        error: false,
        message: "List of banks",
        data: encryptedList,
      });
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
