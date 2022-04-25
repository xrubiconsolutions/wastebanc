const { resourcesModel } = require("../models");

// resource
class Resources_Service {
  static async addResource(req, res) {
    try {
      const store = await resourcesModel.create({
        title: req.body.title,
        message: req.body.message,
        url: req.body.url,
      });
      return res.status(200).json({
        error: false,
        message: "Resource added successfully",
        data: store,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async listResources(req, res) {
    try {
      const resources = await resourcesModel
        .find({
          show: true,
        })
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        error: false,
        message: "resources retrieved",
        data: resources,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async findResource(req, res) {
    try {
      const resource = await resourceModel.findById(req.query.resourceId);
      if (!resource) {
        return res.status(400).json({
          error: true,
          message: "Resource not found",
        });
      }

      return res.status(200).json({
        error: false,
        message: "Resource retrieved",
        data: resource,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async updateResource(req, res) {
    try {
      const resource = await resourceModel.findById(req.query.resourceId);
      if (!resource) {
        return res.status(400).json({
          error: true,
          message: "Resource not found",
        });
      }
      await resourceModel.updateOne(
        { _id: resource._id },
        {
          title: data.title || resource.title,
          message: data.message || resource.message,
          url: data.url || resource.url,
          show: data.show || resource.show,
        }
      );

      resource.title = data.title || resource.title;
      resource.message = data.message || resource.message;
      resource.url = data.url || resource.url;
      resource.show = data.show || resource.show;

      return res.status(200).json({
        error: false,
        message: "Resource updated successfully",
        data: resource,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async removeResource(req, res) {
    try {
      const remove = await resourceModel.deleteOne({
        _id: req.body.resourceId,
      });

      if (!remove) {
        return res.status(400).json({
          error: true,
          message: "Resource not deleted or not found",
        });
      }

      return res.status(200).json({
        error: false,
        message: "Resource removed successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }
}

module.exports = Resources_Service;
