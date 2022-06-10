const axios = require("axios");

const {
  decryptData,
  encryptData,
  removeObjDuplicate,
  Sterlingkeys,
} = require("../../../util/commonFunction");

const BankList = async () => {
  try {
    const partner = await Sterlingkeys();
    const keys = partner.keys;

    const result = await axios.get(
      `${partner.baseUrl}api/Transaction/BankList`,
      {
        headers: {
          Channel: "Web",
          Authorization: "Web Pakam1 Test@12",
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

    const p = JSON.parse(decryptedList);
    console.log("p", p);
    const filteredResult = removeObjDuplicate(p.Data, "BankCode");

    return {
      error: false,
      message: "List of banks",
      data: filteredResult,
    };
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: error,
      data: null,
    };
  }
};

const NIPNameInquiry = async (
  accountNumber,
  BankCode,
  referenceId = "13435"
) => {
  const partner = await Sterlingkeys();
  const keys = partner.keys;

  const nipInquiry = {
    toAccount: accountNumber,
    referenceId,
    destinationBankCode: BankCode,
  };

  const encryptBody = encryptData(
    nipInquiry,
    keys.salt,
    keys.iv,
    keys.passPhrase,
    keys.keySize,
    keys.iterations
  );

  try {
    const partner = await Sterlingkeys();

    const result = await axios.post(
      `${partner.baseUrl}api/Transaction/NIPNameinquiry`,
      { value: encryptBody },
      {
        headers: {
          Channel: "Web",
          Authorization: "Web Pakam1 Test@12",
          "Content-Type": ["application/json", "application/json"],
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

    return {
      error: false,
      message: "customer bank details",
      data: JSON.parse(decryptedList),
    };
  } catch (error) {
    console.log("d", error.response.data);
    const da = error.response.data;
    const partner = await Sterlingkeys();
    const keys = partner.keys;
    const decryptedList = decryptData(
      da,
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    console.log(JSON.parse(decryptedList));
    const errorData = JSON.parse(decryptedList) || error;
    console.log("dec", decryptedList);

    if (errorData.Description === "Unsuccessful") {
      return {
        error: true,
        message: "Invalid bank details passed",
      };
    } else {
      return {
        error: true,
        message: errorData.Description || "An error occurred",
        data: errorData,
      };
    }
  }
};

const NIPFundTransfer = async (
  centralAccount,
  receivingAccount,
  destBankCode,
  amountToPay,
  beneName,
  custShowName,
  nesidNumber,
  nerspNumber,
  BVN,
  KycLevel,
  reqId,
  refCode,
  payReference
) => {
  const partner = await Sterlingkeys();
  const keys = partner.keys;

  const NIPFundTransfer = {
    fromAccount: centralAccount,
    toAccount: receivingAccount,
    amount: amountToPay,
    principalIdentifier: "",
    referenceCode: refCode,
    beneficiaryName: beneName,
    paymentReference: payReference,
    customerShowName: custShowName,
    channelCode: "Web",
    destinationBankCode: destBankCode,
    nesid: nesidNumber,
    nersp: nerspNumber,
    beneBVN: BVN,
    beneKycLevel: KycLevel,
    requestId: reqId,
  };

  const encryptBody = encryptData(
    NIPFundTransfer,
    keys.salt,
    keys.iv,
    keys.passPhrase,
    keys.keySize,
    keys.iterations
  );

  console.log("en", encryptBody);

  const result = await axios.post(
    `${partner.baseUrl}api/Transaction/NIPFunTransfer`,
    { value: encryptBody },
    {
      headers: {
        Channel: "Web",
        Authorization: "Web Pakam1 Test@12",
        "Content-Type": "application/json",
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
    message: "Fund Transfer successfully",
    data: decryptedList,
  };

  // try {
  //   const result = await axios.post(
  //     `${partner.baseUrl}api/Transaction/NIPFunTransfer`,
  //     { value: encryptBody },
  //     {
  //       headers: {
  //         Channel: "Web",
  //         Authorization: "Web",
  //         "Content-Type": ["application/json", "application/json"],
  //       },
  //     }
  //   );

  //   console.log("res", result);

  //   const encryptedList = result.data;
  //   const decryptedList = decryptData(
  //     encryptedList,
  //     keys.salt,
  //     keys.iv,
  //     keys.passPhrase,
  //     keys.keySize,
  //     keys.iterations
  //   );

  //   return {
  //     error: false,
  //     message: "Fund Transfer successfully",
  //     data: decryptedList,
  //   };
  // } catch (error) {
  //   console.log(error);
  //   return {
  //     error: true,
  //     message: "Third Party error",
  //     data: error.response.data.errors,
  //   };
  // }
};

// updates
const CustomerInformation = async (accountNo) => {
  const partner = await Sterlingkeys();
  const keys = partner.keys;
  const encryptBody = encryptData(
    accountNo,
    keys.salt,
    keys.iv,
    keys.passPhrase,
    keys.keySize,
    keys.iterations
  );
  try {
    const result = await axios.get(
      `${partner.baseUrl}api/Transaction/customerInformation/${encryptBody}`,
      {
        headers: {
          Channel: "Web",
          Authorization: "Web Pakam1 Test@12",
          "Content-Type": ["application/json", "application/json"],
        },
      }
    );

    console.log("res", result);

    if (result.data.status >= 400) {
      return {
        error: true,
        message: result.data.errors,
      };
    }
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
      data: JSON.parse(decryptedList).Data,
    };
  } catch (error) {
    console.log("d", error);
    const da = error.response.data;
    console.log("da", da);
    const partner = await Sterlingkeys();
    const keys = partner.keys;
    const decryptedList = decryptData(
      da,
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    const errorData = JSON.parse(decryptedList) || error;
    console.log("dec", JSON.parse(decryptedList));
    if (errorData.Code === "25") {
      return {
        error: true,
        message: "Account number not a sterling account",
      };
    } else {
      return {
        error: true,
        message: errorData || "Account number not a sterling account",
        data: errorData,
      };
    }
  }
};

const IntraBank = async (
  centralAc,
  toAccount,
  amount,
  reference,
  description,
  beneName,
  SenderName,
  CurrencyCode,
  TransactionType = 26
) => {
  const partner = await Sterlingkeys();
  const keys = partner.keys;
  const data = {
    fromAccount: centralAc,
    ToAccount: toAccount,
    TransactionType,
    DifferentTradeValueDate: 0,
    TransactionAmount: amount,
    CurrencyCode,
    PaymentReference: reference,
    NarrationLine1: description,
    NarrationLine2: "",
    BeneficiaryName: beneName,
    SenderName,
  };
  const encryptBody = encryptData(
    data,
    keys.salt,
    keys.iv,
    keys.passPhrase,
    keys.keySize,
    keys.iterations
  );

  try {
    const result = await axios.post(
      `${partner.baseUrl}api/Transaction/IntraBank`,
      { value: encryptBody },
      {
        headers: {
          Channel: "Web",
          Authorization: "Web Pakam1 Test@12",
          "Content-Type": ["application/json", "application/json"],
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
      message: "Fund Transfer successfully",
      data: decryptedList,
    };
  } catch (error) {
    console.log("d", error.response.data);
    const da = error.response.data;
    const partner = await Sterlingkeys();
    const keys = partner.keys;
    const decryptedList = decryptData(
      da,
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    console.log(JSON.parse(decryptedList));
    const errorData = JSON.parse(decryptedList) || error;
    console.log("dec", decryptedList);
    return {
      error: true,
      message: errorData.Description || "An error occurred",
      data: errorData,
    };
  }
};

const GenerateVirtualAccount = async (bvn, nin, phoneNumber) => {
  const partner = await Sterlingkeys();
  const keys = partner.keys;
  const data = {
    BVN: bvn,
    NIN: nin,
    PhoneNumber: phoneNumber,
  };
  const encryptBody = encryptData(
    data,
    keys.salt,
    keys.iv,
    keys.passPhrase,
    keys.keySize,
    keys.iterations
  );

  try {
    const result = await axios.post(
      `${partner.baseUrl}api/CreateAccount/OpenAccount`,
      { value: encryptBody },
      {
        headers: {
          Channel: "Web",
          Authorization: "Web Pakam1 Test@12",
          "Content-Type": ["application/json", "application/json"],
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
      message: "Account created successfully",
      data: decryptedList,
    };
  } catch (error) {
    console.log("d", error.response.data);
    const da = error.response.data;
    const partner = await Sterlingkeys();
    const keys = partner.keys;
    const decryptedList = decryptData(
      da,
      keys.salt,
      keys.iv,
      keys.passPhrase,
      keys.keySize,
      keys.iterations
    );

    console.log(JSON.parse(decryptedList));
    const errorData = JSON.parse(decryptedList) || error;
    console.log("dec", decryptedList);
    return {
      error: true,
      message: errorData.Description || "An error occurred",
      data: errorData,
    };
  }
};

module.exports = {
  BankList,
  NIPNameInquiry,
  GenerateVirtualAccount,
  NIPFundTransfer,
  CustomerInformation,
  IntraBank,
};
