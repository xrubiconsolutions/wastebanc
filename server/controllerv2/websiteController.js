const { faqModel, careerAdModel } = require("../models");
const { paginateResponse } = require("../util/commonFunction");
const sgMail = require("@sendgrid/mail");

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

  static async contactForm(req, res) {
    try {
      const { message, email } = req.body;
      sgMail.setApiKey(
        "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"
      );
      const msg = {
        to: "anihuchenna16@gmail.com",
        from: "me@xrubiconsolutions.com",
        subject: "Contact Form Message",
        html: `<p>Hello support Team</p></br>
              <p>A message with the following content just from the website</p></br>
              <p>Email:${email}</p></br>
              <p>Message:${message}</p></br>
              <p>Best Regards</p></br>
              <p>Pakam Technologies</p>
        `,
      };

      await sgMail.send(msg);
      //   return response
      return res.status(201).json({
        error: false,
        message: "Message Sent successfully",
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
