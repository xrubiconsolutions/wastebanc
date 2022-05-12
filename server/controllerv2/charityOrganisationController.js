const { charityOrganisationModel } = require("../models");

class CharityOrganisationService {
  static async createCharityOrganisation(req, res) {
    //   the validated request body
    const organisationData = req.body;
    try {
      // create the organisation
      const charityOrganisation = await charityOrganisationModel.create(
        organisationData
      );
      //   return success message
      return res.status(201).json({
        error: false,
        message: "Charity organisation created successfully!",
        data: charityOrganisation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured, please try again!",
      });
    }
  }

  static async getCharityOrganisations(req, res) {
    let { page = 1, resultsPerPage = 20, key = "" } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const criteria = key
      ? {
          $or: [
            { name: { $regex: `.*${key}.*`, $options: "i" } },
            { bank: { $regex: `.*${key}.*`, $options: "i" } },
          ],
        }
      : {};

    try {
      // get length of organisations with criteria
      const totalResult = await charityOrganisationModel.countDocuments(
        criteria
      );

      const charityOrganisations = await charityOrganisationModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        data: {
          charityOrganisations,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured, please try again!",
      });
    }
  }
}

module.exports = CharityOrganisationService;
