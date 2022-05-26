const { resourcesModel } = require("../models");
const thumbnail = require("youtube-thumbnail");

// resource
class Resources_Service {
  static async addResource(req, res) {
    try {
      let watchCode;
      if (Array.isArray(req.body.youtubeId)) {
        watchCode = req.body.youtubeId[0];
      } else {
        watchCode = req.body.youtubeId;
      }
      const youtubeURL = `https://www.youtube.com/watch?v=${watchCode}`;
      const generateThumbnail = thumbnail(youtubeURL);
      //console.log("thumbnail", generateThumbnail.high.url);
      const store = await resourcesModel.create({
        title: req.body.title,
        message: req.body.message,
        url: req.body.youtubeId,
        thumbnail: generateThumbnail.high.url,
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
      const resource = await resourcesModel.findById(req.params.resourceId);
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
      const resource = await resourcesModel.findById(req.params.resourceId);
      if (!resource) {
        return res.status(400).json({
          error: true,
          message: "Resource not found",
        });
      }

      let url;
      if (req.params.resourceId) {
        const youtubeURL = `https://www.youtube.com/watch?v=${req.params.resourceId}`;
        const generateThumbnail = thumbnail(youtubeURL);
        url = generateThumbnail.high.url;
      } else {
        url = resource.url;
      }
      await resourcesModel.updateOne(
        { _id: resource._id },
        {
          title: req.body.title || resource.title,
          message: req.body.message || resource.message,
          url,
          show: req.body.show || resource.show,
        }
      );

      resource.title = req.body.title || resource.title;
      resource.message = req.body.message || resource.message;
      resource.url = req.body.url || resource.url;
      resource.show = req.body.show || resource.show;

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
      const remove = await resourcesModel.deleteOne({
        _id: req.params.resourceId,
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
