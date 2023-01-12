const { faqModel, careerAdModel, newsModel } = require("../models");
const { paginateResponse } = require("../util/commonFunction");

class WebsiteService {
  static async getFaqs(req, res) {
    // destructure request arguments
    const { start, end, key, resultsPerPage = 20, page = 1 } = req.query;
    try {
      // get paginated career data and return response
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
    // destructure request arguments
    const { start, end, key, resultsPerPage = 20, page = 1 } = req.query;
    try {
      // get paginated career data and return response
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

  static async getNews(req, res) {
    // destructure request arguments
    const { start, end, key, resultsPerPage = 20, page = 1 } = req.query;
    try {
      // get paginated career data and return response
      const response = await paginateResponse({
        model: newsModel,
        query: {},
        searchQuery: {
          $or: [
            { headline: { $regex: `.*${key}.*`, $options: "i" } },
            { body: { $regex: `.*${key}.*`, $options: "i" } },
          ],
        },
        ...req.query,
        title: "news",
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

  static async addNews(req, res) {
    try {
      const response = await newsModel.create(req.body);
      return res.status(200).json({
        error: false,
        message: "News added successfully",
      });
    } catch (error) {
      console.log(error.stack);
      res.status(500).json({
        message: "An error occured!",
        error: true,
      });
    }
  }
}

module.exports = WebsiteService;
