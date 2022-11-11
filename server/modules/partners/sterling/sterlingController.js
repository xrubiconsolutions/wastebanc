const axios = require("axios");
class sterlingController {
  static async openSAF(req, res) {
    try {
      const { user } = req;
      const body = {
        BVN: req.body.bvn,
        NIN: req.body.nin,
        PhoneNumber: user.phone,
      };

      const result = await axios.post(
        "https://wastebancfin.pakam.ng/api/users/create/virtualAccount",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );
      console.log("here", result.data);
      return res.status(200).json(result.data);
    } catch (error) {
      console.log("err", error);
      return res.status(error.response.status).json({
        error: true,
        message: error.response.data.message,
      });
    }
  }

  static async requestSAFOTP(req, res) {
    try {
      const { user } = req;
      const body = {
        userId: user._id,
      };
      const result = await axios.post(
        "https://wastebancfin.pakam.ng/api/saf/otp/request",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      console.log("here", result.data);
      return res.status(200).json(result.data);
    } catch (error) {
      console.log("err", error);
      return res.status(error.response.status).json({
        error: true,
        message: error.response.data.message,
      });
    }
  }
}

module.exports = sterlingController;
