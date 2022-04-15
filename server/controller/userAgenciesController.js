"use strict";

let agenciesController = {};
const MODEL = require("../models");
const COMMON_FUN = require("../util/commonFunction");
const mongodb = require("mongodb");

const { validationResult, body } = require("express-validator");
const sgMail = require("@sendgrid/mail");
const welcomeTemplate = require("../../email-templates/welcome-email.template");

const bodyValidate = (req, res) => {
  // 1. Validate the request coming in
  // console.log(req.body);
  const result = validationResult(req);

  const hasErrors = !result.isEmpty();

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
  return;
};

agenciesController.create = async (req, res) => {
  try {
    const body = req.body;

    const user = await MODEL.userModel.findOne({ email: body.email.trim() });
    if (user) {
      return res.status(400).json({
        error: true,
        message: "Email already exist",
      });
    }

    const role = await MODEL.roleModel.findOne({
      _id: new mongodb.ObjectId(body.role),
      active: true,
    });
    if (!role) {
      return res.status(400).json({
        error: true,
        message: "Role not found or not active",
      });
    }

    const checkPhone = await MODEL.userModel.findOne({
      phone: body.phone,
    });

    console.log("c", checkPhone);

    if (checkPhone) {
      return res.status(400).json({
        error: true,
        message: "Phone number already exist",
      });
    }

    const password = COMMON_FUN.generateRandomString();
    console.log(password[0]);

    const hash = await COMMON_FUN.encryptPassword(password);
    const agency = await MODEL.userModel.create({
      countries: body.countries,
      states: body.states,
      username: body.name.trim(),
      fullname: body.name.trim(),
      role: role._id,
      displayRole: role.title,
      roles: role.group,
      email: body.email,
      password: hash,
      verified: true,
      phone: body.phone,
    });

    await MODEL.userModel.updateOne(
      { email: agency.email },
      { cardID: agency._id }
    );

    const emailTemplate = welcomeTemplate(agency, password);

    //send mail to the company holding the agencies password
    sgMail.setApiKey(
      "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"
    );

    const msg = {
      to: `${agency.email}`,
      from: "pakam@xrubiconsolutions.com", // Use the email address or domain you verified above
      subject: "WELCOME PAKAM",
      html: emailTemplate,
    };

    await sgMail.send(msg);
    //console.log("send", send);

    return res.status(200).json({
      error: false,
      message: "User agency created successfully",
      data: {
        name: agency.username,
        countries: agency.countries,
        states: agency.states,
        role: agency.displayRole,
        roles: agency.roles,
        email: agency.email,
        phone: agency.phone,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.getAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;

    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const totalResult = await MODEL.userModel.countDocuments({
      roles: "admin",
    });

    const agencies = await MODEL.userModel
      .find({
        roles: "admin",
      })
      .sort({ createAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "User agencies",
      data: {
        agencies,
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
};

agenciesController.findAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    if (!agency) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    delete agency.password;
    return res.status(200).json({
      error: false,
      message: "User found",
      data: {
        name: agency.username,
        countries: agency.countries,
        states: agency.states,
        role: agency.displayRole,
        roles: agency.roles,
        email: agency.email,
        phone: agency.phone,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.updateAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    const { user } = req;

    if (!agency) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    if (body.email) {
      const checkemail = await MODEL.userModel.findOne({
        email: body.email,
      });

      console.log(checkemail);

      if (checkemail && checkemail._id.toString() != agency._id.toString()) {
        return res.status(400).json({
          error: true,
          message: "Email already exist",
        });
      }
    }

    let role;
    let roles;
    let displayRole;
    if (body.role) {
      const r = await MODEL.roleModel.findById(body.role);
      console.log("role", r);
      if (!r) {
        return res.status(400).json({
          error: true,
          message: "Role not found or not active",
        });
      }
      roles = r.group;
      role = r._id;
      displayRole = r.title;
      console.log("displayROle", r.title);
    } else {
      role = agency.role;
      roles = agency.roles;
      displayRole = agency.displayRole;
    }

    if (body.status) {
      if (user.email === agency.email) {
        return res.status(400).json({
          error: true,
          message: "Action cannot be perform",
        });
      }
    }

    const update = await MODEL.userModel.updateOne(
      { _id: agency._id },
      {
        username: body.name || agency.userrname,
        fullname: body.name || agency.fullname,
        email: body.email || agency.email,
        countries: body.countries || agency.countries,
        states: body.states || agency.states,
        role,
        roles,
        displayRole,
        status: body.status || agency.status,
      }
    );

    agency.username = body.name || agency.name;
    agency.email = body.email || agency.email;
    agency.countries = body.countries || agency.countries;
    agency.states = body.states || agency.states;
    agency.role = body.role || agency.role;
    agency.roles = body.roles || agency.roles;
    agency.status = body.status || agency.status;
    agency.displayRole = displayRole;

    console.log(agency);
    if (!update) {
      return res.status(400).json({
        error: true,
        message: "An error occurred",
      });
    }

    return res.status(200).json({
      error: false,
      message: "User updated successfully",
      data: {
        name: agency.fullname,
        countries: agency.countries,
        states: agency.states,
        displayRole: displayRole,
        roles: agency.roles,
        email: agency.email,
        phone: agency.phone,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.remove = async (req, res) => {
  bodyValidate(req, res);
  try {
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    if (!agency) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    await MODEL.userModel.deleteOne({ _id: agency._id });
    return res.status(200).json({
      error: false,
      message: "user deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.getLocationScope = async (req, res) => {
  const { _id } = req.user;
  try {
    const admin = await MODEL.userModel.findById(_id);
    if (!admin)
      return res.status(404).json({
        error: true,
        message: "Agency account not found!",
      });

    // values are read this way to guarantee reading the locationScope from the instance
    const { states: agencyStates, locationScope } = admin.toObject();

    // construct array of location scope
    const data = agencyStates.concat("All").map((state) => ({
      name: state,
      default: locationScope === state,
    }));

    return res.status(200).json({
      error: false,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "An error occured",
    });
  }
};

agenciesController.setLocationScope = async (req, res) => {
  const { _id } = req.user;
  const { scope } = req.query;
  try {
    const admin = await MODEL.userModel.findById(_id);
    if (!admin)
      return res.status(404).json({
        error: true,
        message: "Agency account not found!",
      });

    // send error if scope provided isn't included in admin states
    if (!admin.states.includes(scope) && scope !== "All")
      return res.status(400).json({
        error: true,
        message: "Scope isn't part of admin states!",
      });

    await MODEL.userModel.updateOne({ _id }, { locationScope: scope });
    return res.status(200).json({
      error: false,
      message: "Updated successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.getAgencyProfile = async (req, res) => {
  // destructure to remove password and last logged in from data
  const { password, last_logged_in, ...data } = req.user.toObject();

  // send admin profile
  return res.status(200).json({
    error: false,
    message: "success!",
    data,
  });
};

module.exports = agenciesController;
