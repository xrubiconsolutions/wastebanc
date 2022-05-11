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
    try {
      const charityOrganisations = await charityOrganisationModel.find();
      return res.status(200).json({
        error: false,
        data: charityOrganisations,
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
