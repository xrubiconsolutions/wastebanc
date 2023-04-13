const {
  productLists,
  buyHealthInsurance,
} = require("../modules/partners/mycover.io/mycoverService");

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
}

module.exports = InsuranceController;
