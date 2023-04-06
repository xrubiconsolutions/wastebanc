const axios = require("axios");
const {
  tokenModel,
  centralAccountModel,
  transactionModel,
  payModel,
  userModel,
  disbursementRequestModel,
  insuranceLog,
} = require("../../../models");

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
    price,
  } = data;
  try {
    const user = await userModel.findById(userId);
    const availableBalance = user.availablePoints;
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
      }
    );

    await insuranceLog.create({
      userId,
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
module.exports = {
  productLists,
  buyHealthInsurance,
};
