const MODEL = require("../../models");
const cron = require("node-cron");
const { CustomerInformation } = require("../partners/sterling/sterlingService");
var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pakambusiness@gmail.com",
    pass: "pakambusiness-2000",
  },
});
const cronJobs = () => {
  // make a pickup schedule as missed
  //'01 7 * * *'
  cron.schedule("0 7 * * *", function () {
    const active_today = new Date();
    active_today.setHours(0, 0, 0, 0);
    const messages =
      "Your pick up schedule was missed yesterday. Kindly reschedule"; //Custom schedule missed message
    console.log("<<SCHEDULE JOB CHECK>>>");
    MODEL.scheduleModel
      .find({
        completionStatus: "pending",
        expiryDuration: {
          $lt: active_today,
        },
      })
      .then((schedules) => {
        for (let i = 0; i < schedules.length; i++) {
          MODEL.userModel
            .findOne({
              email: schedules[i].client,
            })
            .then((user) => {
              if (user.onesignal_id && user.onsignal_id !== "") {
                var message = {
                  app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                  contents: {
                    en: `${messages}`,
                  },
                  include_player_ids: [`${user.onesignal_id}`],
                };
                MODEL.scheduleModel.updateOne(
                  {
                    _id: schedules[i]._id,
                  },
                  {
                    completionStatus: "missed",
                  },
                  (err, res) => {
                    const datum = {
                      title: "Schedule missed",
                      lcd: user.lcd,
                      message: `${messages}`,
                      schedulerId: user._id,
                    };
                    MODEL.notificationModel(datum).save({}, (err, data) => {
                      console.log("-->", data);
                    });
                    sendNotification(message);
                  }
                );
              }
            });
        }
      });
  });

  cron.schedule("* * * * *", function () {
    console.log("<wallet check>");
    MODEL.organisationModel.find({}).then((val) => {
      for (let i = 0; i < val.length; i++) {
        MODEL.transactionModel
          .find({ organisationID: val[i]._id, paid: false })
          .sort({ _id: -1 })
          .then((recycler, err) => {
            let totalCoin = recycler
              .map((val) => val.coin)
              .reduce((acc, curr) => acc + curr, 0);
            MODEL.organisationModel.updateOne(
              { email: `${val[i].email}` },
              { $set: { wallet: totalCoin } },
              (err, resp) => {
                if (err) {
                  return RESPONSE.status(400).jsonp(err);
                }
              }
            );
          })
          .catch((err) => console.log(err));
      }
    });
  });

  cron.schedule("* * 1 * *", function () {
    var today = new Date();
    MODEL.organisationModel.find({}).then((organisations) => {
      for (let i = 0; i < organisations.length; i++) {
        var diff = organisations[i].expiry_date - today;
        var test = diff / (1000 * 24 * 60 * 60);
        if (test < 31) {
          var mailOptions = {
            from: "pakambusiness@gmail.com",
            to: `${organisations[i].email}`,
            subject: "YOUR ORGANISATION ACCOUNT WILL EXPIRE IN 30 DAYS",
            text: `Your organisation's account will expire in 30 days. Kindly renew your licence or contact support if any issue arise.`,
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        }
      }
    });
  });

  // Run reminder for schedule pick up every 2 hours '0 0 */2 * * *'

  cron.schedule("01 7 * * *", function () {
    var today = new Date();
    const messages =
      "Your pick up schedule is today. Kindly be available to receive our recycler"; //Custom schedule reminder message
    console.log("<<RUNNER CHECK>>>");
    MODEL.scheduleModel
      .find({
        reminder: true,
        completionStatus: "pending",
        collectorStatus: "accept",
      })
      .then((schedules) => {
        for (let i = 0; i < schedules.length; i++) {
          const time = schedules[i].pickUpDate;
          const val = (time - today) / 1000;
          const diff = val / 3600;
          MODEL.userModel
            .findOne({
              email: schedules[i].client,
            })
            .then((user) => {
              if (user.onesignal_id !== "") {
                var message = {
                  app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                  contents: {
                    en: `${messages}`,
                  },
                  include_player_ids: [`${user.onesignal_id}`],
                };
                const datum = {
                  title: "Schedule Pickup",
                  lcd: user.lcd,
                  message: `${messages}`,
                  schedulerId: user._id,
                };
                MODEL.notificationModel(datum).save({}, (err, data) => {
                  console.log("-->", data);
                });
                sendNotification(message);
              }
            });
        }
      });
  });

  //Run pakam bank account balance check and update in central wallet
  const fetchAccountStatus = async () => {
    try {
      // get central bank account details
      const centralAccount = await MODEL.centralAccountModel.findOne({
        name: "PAKAM ACCOUNT",
      });
      const accountNo = centralAccount.acnumber;

      // make api call for account status and get account balance
      const balanceRequest = await CustomerInformation(accountNo);
      const availableBal = balanceRequest.data.availableBalance;

      // update central bank account with status balance and save
      centralAccount.balance = availableBal;
      await centralAccount.save();
      console.log("Central Bank account updated");
    } catch (error) {
      console.log("An error occured!");
      throw error;
    }
  };
  //
  cron.schedule("0 0-20/1 * * *", fetchAccountStatus);
};

module.exports = cronJobs;
