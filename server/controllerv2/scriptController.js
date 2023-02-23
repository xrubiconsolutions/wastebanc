const {
  scheduleModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
  notificationModel,
  activitesModel,
  centralAccountModel,
  categoryModel,
  charityModel,
  payModel,
  scheduleDropModel,
} = require("../models");
const axios = require("axios");
const { organisationOnboardingMail } = require("../services/sendEmail");
const { generateRandomString } = require("../util/commonFunction");

class ScriptController {
  static async charitModelScript(req, res) {
    try {
      const allCharityPayment = await charityModel.find({});
      allCharityPayment.map(async (charity) => {
        const user = await userModel.findById(charity.userId);
        if (user) {
          await charityModel.updateMany(
            { userId: user._id.toString() },
            {
              user: user._id,
              charity: null,
            }
          );
        }
      });

      return res.status(200).json({ error: false, message: "Done" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }

  static async payModelScript(req, res) {
    try {
      const allpayment = await payModel.find({});
      //console.log("al", allpayment);
      await Promise.all(
        allpayment.map(async (pay) => {
          const user = await userModel.findById(pay.userId);
          const transaction = await transactionModel.findOne({
            scheduleId: pay.scheduleId,
          });
          if (user && transaction) {
            console.log("h");
            await payModel.updateOne(
              { scheduleId: pay.scheduleId },
              {
                user: user._id,
                transaction: transaction._id,
              }
            );
          }
          console.log("hh");
        })
      );

      return res.status(200).json({ error: false, message: "Done" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }

  // static async ScheduledropoffModelScript(req, res) {
  //   try {
  //     const datas = await scheduleDropModel.find({});
  //     Promise.all(
  //       datas.map(async (data) => {
  //         const user = await userModel.findOne({ email: data.scheduleCreator });
  //         if (data.completionStatus == "pending" && user) {
  //           await scheduleDropModel.updateOne(
  //             { scheduleCreator: data.scheduleCreator },
  //             {
  //               scheduleApproval: "pending",
  //               clientId: user._id.toString(),
  //             }
  //           );
  //         } else if (data.completionStatus == "completed" && user) {
  //           await scheduleDropModel.updateOne(
  //             { scheduleCreator: data.scheduleCreator },
  //             {
  //               scheduleApproval: "true",
  //               clientId: user._id.toString(),
  //             }
  //           );
  //         } else {
  //           await scheduleDropModel.updateOne(
  //             { scheduleCreator: data.scheduleCreator },
  //             {
  //               scheduleApproval: "false",
  //               clientId: null,
  //             }
  //           );
  //         }
  //       })
  //     );
  //     return res.status(200).json({ error: false, message: "Done" });
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).json({
  //       error: true,
  //       message: "An error occured!",
  //     });
  //   }
  // }

  static async SchedulePickModelScript(req, res) {
    try {
      const datas = await scheduleModel.find({
        categories: { $exists: false },
      });

      Promise.all(
        datas.map(async (data) => {
          const categories = [];
          const category = {
            name: data.Category,
            catId: null,
          };
          categories.push(category);
          // console.log("c", categories);
          await scheduleModel.updateOne(
            { _id: data._id },
            {
              $set: {
                categories,
              },
            }
          );
        })
      );
      return res.status(200).json({ error: false, message: "Done", datas });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }

  static async ScheduleDropOffModelScript(req, res) {
    try {
      const datas = await scheduleDropModel.find({
        categories: { $exists: false },
      });
      Promise.all(
        datas.map(async (data) => {
          const categories = [];
          const category = {
            name: data.Category,
            catId: null,
          };
          categories.push(category);
          // console.log("c", categories);
          await scheduleDropModel.updateOne(
            { _id: data._id },
            {
              $set: {
                categories,
                //terms_condition:false,
                //isDisabled:true
              },
            }
          );
        })
      );
      return res.status(200).json({ error: false, message: "Done", datas });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred!",
      });
    }
  }

  static async UserSmsScript(req, res) {
    const { message } = req.body;
    try {
      const users = await userModel.find({ phone: { $ne: "" } });
      const url = "https://api.ng.termii.com/api/sms/send";
      const smsRes = await Promise.all(
        users.map((user) => {
          const msg = {
            api_key:
              "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
            type: "plain",
            to: `+234${user.phone}`,
            from: "N-Alert",
            channel: "dnd",
            sms: message,
          };

          return axios.post(url, JSON.stringify(msg), {
            headers: {
              "Content-Type": ["application/json", "application/json"],
            },
          });
        })
      );

      return res.status(200).json({
        error: false,
        message: "message sent successfully!",
      });
    } catch (error) {
      console.log(error.stack);
      res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  static async resendOnboardMail(req, res) {
    const { type, email } = req.body;
    const password = generateRandomString();

    try {
      const accountModels = {
        organisation: organisationModel,
      };

      // get the model of the type of account
      const model = accountModels[type];
      const account = await model.findOne({ email });

      // find account or return error if not found
      if (!account)
        return res.status(404).json({
          error: true,
          message: "Account not found",
        });

      const accountResend = {
        organisation: async () =>
          await organisationOnboardingMail(email, password),
      };

      account.password = password;
      await account.save();

      // get the resend function based on type
      const resendFunc = accountResend[type];
      const done = await resendFunc();

      return res.status(200).json({
        error: false,
        message: "Mail sent!",
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }

  static async transactionScript(req, res) {
    try {
      const transactions = await transactionModel.find({
        categories: { $exists: false },
      });
      if (transactions.length > 0) {
        transactions.forEach(async (transaction) => {
          await transactionModel.updateOne(
            { _id: transaction._id },
            {
              $set: {
                categories: [
                  {
                    name: transaction.Category,
                    catId: null,
                  },
                ],
              },
            }
          );
        });
      }
      return res.status(200).json({ error: false, message: "Done" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }
}

module.exports = ScriptController;
