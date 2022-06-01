const axios = require("axios");
const { partnersModel } = require("../../../models");
const {
  decryptData,
  encryptData,
  removeObjDuplicate,
} = require("../../../util/commonFunction");

const keys = async () => {
  const partner = await partnersModel.findOne({
    name: "sterling",
  });

  if (!partner) throw new Error("Partner not found");

  return partner.keys;
};

const BankList = async () => {
  try {
    const partner = await partnersModel.findOne({
      name: "sterling",
    });

    if (!partner) throw new Error("Partner not found");

    const keys = partner.keys;

    const result = await axios.get(
      `${partner.baseUrl}api/Transaction/BankList`,
      {
        headers: {
          Channel: "Web",
          Authorization: "Web",
        },
      }
    );

    const encryptedList = result.data;
    const decryptedList = decryptData(
      encryptedList,
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    const filteredResult = removeObjDuplicate(decryptedList.Data, "BankCode");

    return {
      error: false,
      message: "List of banks",
      data: filteredResult,
    };
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: error.getMessage(),
      data: null,
    };
  }
};

const NIPNameInquiry = async (
  accountNumber,
  BankCode,
  referenceId = "13435"
) => {
  try {
    const partner = await partnersModel.findOne({
      name: "sterling",
    });

    if (!partner) throw new Error("Partner not found");


    const keys = partner.keys;


    const encryptBody = encryptData(
      {
        toAccount: accountNumber,
        referenceId,
        destinationBankCode: BankCode,
      },
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    const result = await axios.post(
      `${partner.baseUrl}api/Transaction/NIPNameinquiry`,
      encryptBody,
      {
        headers: {
          Channel: "Web",
          Authorization: "Web",
        },
      }
    );

    console.log("res", result);

    const encryptedList = result.data;
    const decryptedList = decryptData(
      encryptedList,
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    return {
      error: false,
      message: "List of banks",
      data: decryptedList,
    };
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: error.getMessage(),
      data: null,
    };
  }
};
const GenerateVirtualAccount = async (bvn, nin, phoneNumber) => {};
const NIPFundTransfer = async (
  fromAccount,
  toAccount,
  amount,
  beneficiaryName,
  customerShowName,
  channelCode,
  destinationBankCode,
  beneBVN,
  beneKycLevel
) => {};

module.exports = {
  BankList,
  NIPNameInquiry,
  GenerateVirtualAccount,
  NIPFundTransfer,
};
// class sterlingService {
//   static async keys() {
//     const partner = await partnersModel.findOne({
//       name: "sterling",
//     });

//     if (!partner) throw new Error("Partner not found");

//     return partner.keys;
//   }
//   static async bankList() {

//   }
//   static async NIPNameInquiry() {}
//   static async generateVirtualAccount(bvn, nin, phoneNumber) {}
//   static async NIPFundTransfer(
//     fromAccount,
//     toAccount,
//     amount,
//     beneficiaryName,
//     customerShowName,
//     channelCode,
//     destinationBankCode,
//     beneBVN,
//     beneKycLevel
//   ) {}
// }
