const { collectorModel } = require("../models");
const { sendResponse, bodyValidate } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const { validationResult, body } = require("express-validator");

class CollectorService {
  static bodyValidate(req, res) {
    const result = validationResult(req);

    const hasErrors = !result.isEmpty();
    console.log(hasErrors);

    if (hasErrors) {
      //   debugLog('user body', req.body);
      // 2. Throw a 422 if the body is invalid
      return res.status(422).json({
        error: true,
        statusCode: 422,
        message: "Invalid body request",
        errors: result.array({ onlyFirstError: true }),
      });
    }
  }
  static async getCollectors(req, res) {
    try {
      let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      if (!key) {
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
      }

      let criteria;
      if (key) {
        criteria = {
          $or: [
            { fullname: key },
            { gender: key },
            { phone: key },
            { email: key },
            { localGovernment: key },
            { organisation: key },
            { IDNumber: key },
          ],
        };
      } else {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        };
      }
      if (state) criteria.state = state;

      const totalResult = await collectorModel.countDocuments(criteria);
      const projection = {
        roles: 0,
        password: 0,
      };
      // get collectors based on page
      const collectors = await collectorModel
        .find(criteria, projection, { lean: true })
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          collectors,
          totalResult,
          page,
          resultsPerPage,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
      });
    }
  }

  static async searchCollectors(req, res) {
    let { state, page = 1, key, resultsPerPage = 20 } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const criteria = {
      verified: true,
      $or: [
        { fullname: key },
        { gender: key },
        { phone: key },
        { email: key },
        { localGovernment: key },
        { organisation: key },
        { IDNumber: key },
      ],
    };
    if (state) criteria.state = state;

    try {
      // get length of collectors with completion status and provided field value
      const totalResult = await collectorModel.countDocuments(criteria);

      // get collectors based on page
      const collectors = await collectorModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        collectors,
        totalResult,
        page,
        resultsPerPage,
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }

  // static async mapCardData(req, res) {
  //   console.log("here");
  //   bodyValidate(req, res);
  //   try {
  //     const { start, end, state } = req.query;
  //     const [startDate, endDate] = [new Date(start), new Date(end)];

  //     let criteria = {
  //       createdAt: {
  //         $gte: startDate,
  //         $lt: endDate,
  //       },
  //     };
  //     if (state) criteria.state = state;

  //     const collectors = await collectorModel.find(criteria);
  //     const totalFemale = await this.totalFemale(criteria);
  //     const totalMale = await this.totalMale(criteria);
  //     const totalVerified = await this.verified(criteria);

  //     return res.status(200).json({
  //       error: false,
  //       message: "success",
  //       data: {
  //         collectors,
  //         totalCollectors: collectors.length,
  //         totalFemale,
  //         totalMale,
  //         totalVerified,
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).json({
  //       error: true,
  //       message: "An error occurred",
  //     });
  //   }
  // }

  // static async totalMale(criteria) {
  //   delete criteria.female;
  //   criteria.gender = "male";
  //   return await collectorModel.countDocuments(criteria);
  // }

  // static async totalFemale(criteria) {
  //   delete criteria.male;
  //   criteria.gender = "female";
  //   return await collectorModel.countDocuments(criteria);
  // }

  // static async verified(criteria) {
  //   delete criteria.male;
  //   delete criteria.female;
  //   criteria.verified = true;
  //   return await collectorModel.countDocuments(criteria);
  // }

  // static async allCollector(criteria) {
  //   return await collectorModel.find(criteria);
  // }
}

module.exports = CollectorService;
