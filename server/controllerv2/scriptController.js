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
      const datas = await scheduleDropModel.find({categories:{$exists:false}});
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
}

module.exports = ScriptController;
