const {
  productLists,
  buyHealthInsurance,
} = require("../modules/partners/mycover.io/mycoverService");
const { paginateResponse } = require("../util/commonFunction");
const { userInsuranceModel, userModel } = require("../models");
class InsuranceController {
  static async healthProductLists(req, res) {
    try {
      const products = await productLists();
      const availableProducts = products.data.filter(
        ({ price }) => parseFloat(price) <= 2500
      );
      return res.status(200).json({ ...products, data: availableProducts });
    } catch (error) {
      console.log("error", error);
      return res.status(400).json({
        error: true,
        message: "Error getting Health",
      });
    }
  }

  static async purchaseHealthInsuance(req, res) {
    const { user } = req;
    const result = await buyHealthInsurance(req.body, user._id);
    if (result.error) {
      return res.status(400).json({ ...result });
    }
    return res.status(200).json({ ...result });
  }

  // for mobile request
  static async getUserInsuranceHistory(req, res) {
    try {
      const { user } = req;
      const insuranceList = await userInsuranceModel.find(
        {
          user: user._id,
        },
        {
          _id: 1,
          payment_plan: 1,
          plan_name: 1,
          product_id: 1,
          price: 1,
          expiration_date: 1,
          activation_date: 1,
          policy_id: 1,
        }
      );
      return res.status(200).json({
        error: false,
        data: insuranceList,
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  // admin request for user insurance history
  static async getInsuranceHistory(req, res) {
    const { userId } = req.params;
    const { key } = req.query;
    console.log({ userId });
    try {
      // find user or throw error if no user found
      const user = await userModel.findById(userId);
      if (!user)
        return res.status(404).json({
          error: true,
          message: "Account not found",
        });

      // gather the user insurance history and return
      const response = await paginateResponse({
        model: userInsuranceModel,
        query: {},
        searchQuery: {
          $or: [
            { plan_name: { $regex: `.*${key}.*`, $options: "i" } },
            { product_id: { $regex: `.*${key}.*`, $options: "i" } },
          ],
        },
        startDate: "2020-01-01",
        endDate: new Date(),
        ...req.query,
        title: "data",
        projection: {
          _id: 1,
          payment_plan: 1,
          plan_name: 1,
          product_id: 1,
          price: 1,
          expiration_date: 1,
          activation_date: 1,
          policy_id: 1,
        },
      });
      return res.status(200).json(response);
    } catch (e) {
      console.log(e.stack);
      res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }
}

module.exports = InsuranceController;
