const { faqModel, careerAdModel } = require("../models");
const { paginateResponse } = require("../util/commonFunction");

class WebsiteService {
  static async getFaqs(req, res) {
    const { start, end, key, resultsPerPage = 20, page = 1 } = req.query;
    try {
      const faqs = await faqModel.find();
      const response = await paginateResponse({
        model: faqModel,
        query: {},
        searchQuery: {
          $or: [
            { question: { $regex: `.*${key}.*`, $options: "i" } },
            { answer: { $regex: `.*${key}.*`, $options: "i" } },
          ],
        },
        ...req.query,
        title: "faqs",
      });
      return res.status(200).json(response);
    } catch (error) {
      console.log({ error });
      res.status(500).json({
        message: "An error occured!",
        error: true,
      });
    }
  }

  static async addFaq(req, res) {
    try {
      const faq = await faqModel.create(req.body);
      return res.status(201).json({
        error: false,
        message: "Faq created sucessfully",
      });
    } catch (error) {
      console.log({ error });
      res.status(500).json({
        message: "An error occured!",
        error: true,
      });
    }
  }

  static async getCareerAds(req, res) {
    const { start, end, key, resultsPerPage = 20, page = 1 } = req.query;
    try {
      const ads = await careerAdModel.find();
      const response = await paginateResponse({
        model: careerAdModel,
        query: {},
        searchQuery: {
          $or: [
            { title: { $regex: `.*${key}.*`, $options: "i" } },
            { workType: { $regex: `.*${key}.*`, $options: "i" } },
          ],
        },
        ...req.query,
        title: "careerAds",
      });
      return res.status(200).json(response);
    } catch (error) {
      console.log({ error });
      res.status(500).json({
        message: "An error occured!",
        error: true,
      });
    }
  }

  static async addCareerAd(req, res) {
    try {
      const ad = await careerAdModel.create(req.body);
      return res.status(201).json({
        error: false,
        message: "Career Ad created sucessfully",
      });
    } catch (error) {
      console.log({ error });
      res.status(500).json({
        message: "An error occured!",
        error: true,
      });
    }
  }
}

module.exports = WebsiteService;
