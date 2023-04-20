const axios = require("axios");
const {
  tokenModel,
  centralAccountModel,
  transactionModel,
  payModel,
  userModel,
  disbursementRequestModel,
  insuranceLog,
  userInsuranceModel,
} = require("../../../models");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectID;

const productLists = async () => {
  try {
    const url = `${process.env.MYCOVER_BASEURL}products/get-all-products?search=${process.env.HEALTH_PRODUCT}`;
    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.MYCOVER_KEY}`,
      },
    });
    // console.log("result", result.data);
    return {
      error: false,
      message: "List Insurance Product",
      data: result.data.data.products,
    };
  } catch (error) {
    return {
      error: true,
      message: error,
      data: null,
    };
  }
};

// {
//     "payment_plan":1,
//     "gender":"Male",
//     "image_url":"https://res.cloudinary.com/dnwmze4x4/image/upload/v1676638137/Website%20Support%20Folder/Household%20User/How_to_sign_up_on_the_Pakam_household_application_o3j9d5.jpg",
//     "first_name":"james",
//     "last_name":"Anih",
//     "email":"james@pakam.ng",
//     "dob":"1996-10-20T00:00:00.000Z",
//     "phone":"09065180963",
//     "product_id":"f7b4bca1-b870-4648-8704-11c1802a51d0"
// }

const buyHealthInsurance = async (data, userId) => {
  const {
    plan_duration,
    gender,
    image_url,
    first_name,
    last_name,
    email,
    dob,
    phone,
    product_id,
  } = data;
  try {
    const user = await userModel.findById(userId);
    const userInsurance = await userInsuranceModel.find({
      user: ObjectId(user._id),
      expiration_date: {
        $gt: new Date(),
      },
    });

    // return error if user has unexpired insurance
    if (userInsurance.length > 0)
      return {
        error: true,
        message: "Existing Insurance plan is still active",
      };
    const availableBalance = user.availablePoints;

    // fetch product list
    const { data: productList } = await productLists();

    // find product with the provided id
    const product = productList.find(({ id }) => id === product_id);

    // throw error if product with provided id not found
    if (!product)
      return {
        error: true,
        message: "Product with ID not found",
      };

    const { price } = product;
    // calculate insurance amount and check if user has enough to py
    const amount = Number(price) * plan_duration;
    const userBalance = user.availablePoints - Number(amount);
    if (Number(amount) > availableBalance) {
      return {
        error: true,
        message: "Insufficient available balance",
      };
    }

    const url = `${process.env.MYCOVER_BASEURL}products/mcg/buy-flexi-care`;
    const result = await axios.post(
      url,
      {
        payment_plan: plan_duration,
        gender,
        image_url,
        first_name,
        last_name,
        email,
        dob: new Date(dob).toISOString(),
        phone,
        product_id,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MYCOVER_KEY}`,
        },
      }
    );

    if (result.data.responseCode != 1) {
      return {
        error: true,
        message: result.data.responseText,
      };
    }

    await userModel.updateOne(
      { _id: userId },
      {
        insuranceUser: true,
        insurancePolicyID: result.data.data.policy.id,
        availablePoints: userBalance,
        insuranceAmount: amount,
        // insuranceExpiryDate: moment().add(plan_duration, "months").calendar(),
      }
    );

    const {
      expiration_date,
      activation_date,
      id: policyId,
    } = result.data.data.policy;

    // create user insurance document and add log
    await userInsuranceModel.create({
      payment_plan: plan_duration,
      gender,
      image_url,
      first_name,
      last_name,
      email,
      dob: new Date(dob).toISOString(),
      phone,
      product_id,
      user: userId,
      expiration_date,
      activation_date,
      price,
      policy_id: policyId,
      user: user._id,
      plan_name: product.name,
    });

    await insuranceLog.create({
      user: userId,
      amountPaid: Number(amount),
      userBalance,
      insuranceObject: result.data.data.policy,
    });

    return {
      error: false,
      message: "Insurance Purchase done successfully",
      data: result.data.data.policy.id,
    };
  } catch (error) {
    console.log(error);
    console.log("status", error.status);
    console.log("code", error.statusCode);
    return {
      error: true,
      message: "Error occurred purchasing insurance",
      data: null,
    };
  }
};

const renewInsurance = async (userId, policyId) => {
  try {
    const user = await userModel.findById(userId);
    const availableBalance = user.availablePoints;
    if (user.insuranceAmount > availableBalance) {
      return {
        error: true,
        message: "Insufficient available balance",
      };
    }

    const url = `${process.env.MYCOVER_BASEURL}products/mcg/renew-flexi-care`;
    const result = await axios.post(url, {
      policyId: user.insurancePolicyID,
    });
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: "Error occurred renew insurance",
    };
  }
};
module.exports = {
  productLists,
  buyHealthInsurance,
};
