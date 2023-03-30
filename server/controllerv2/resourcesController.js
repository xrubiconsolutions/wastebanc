const { resourcesModel } = require("../models");
const thumbnail = require("youtube-thumbnail");

const MONGOOSE = require("mongoose");

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
  static async listResourcesV2(req, res) {
    try {
      let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
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

      if (start || end) {
        if (new Date(start) > new Date(end)) {
          return res.status(400).json({
            error: true,
            message: "Start date cannot be greater than end date",
          });
        }
      }

      let criteria;

      if (key) {
        criteria = {
          $or: [
            { title: { $regex: `.*${key}.*`, $options: "i" } },
            { message: { $regex: `.*${key}.*`, $options: "i" } },
          ],
          show: true,
        };
      } else if (start || end) {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        endDate.setDate(endDate.getDate() + 1);
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          show: true,
        };
      } else {
        criteria = {
          show: true,
        };
      }

      const totalResult = await resourcesModel.countDocuments(criteria);

      const resources = await resourcesModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      // const resources = await resourcesModel
      //   .find({
      //     show: true,
      //   })
      //   .sort({ createdAt: -1 })
      //   .limit(5);

      return res.status(200).json({
        error: false,
        message: "resources retrieved",
        data: {
          resources,
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
      let thumbnailgen;
      if (req.body.youtubeId) {
        console.log("here", req.body.youtubeId);
        const youtubeURL = `https://www.youtube.com/watch?v=${req.body.youtubeId}`;
        const generateThumbnail = thumbnail(youtubeURL);
        url = req.body.youtubeId;
        thumbnailgen = generateThumbnail.high.url;
      } else {
        url = resource.url;
        thumbnailgen = resource.thumbnail;
      }

      console.log("url", url);
      await resourcesModel.updateOne(
        { _id: resource._id },
        {
          title: req.body.title || resource.title,
          message: req.body.message || resource.message,
          url,
          thumbnail: thumbnailgen,
          show: req.body.show || resource.show,
        }
      );

      resource.title = req.body.title || resource.title;
      resource.message = req.body.message || resource.message;
      resource.url = req.body.youtubeId || resource.url;
      resource.show = req.body.show || resource.show;
      resource.thumbnail = thumbnailgen || resource.thumbnail;

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
      const ID = new MONGOOSE.Schema.Types.ObjectId(req.params.resourceId);
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
