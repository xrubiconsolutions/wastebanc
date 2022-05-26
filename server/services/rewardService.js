const { categoryModel } = require("../models");
class rewardService {
  static async houseHold(categories, organisation) {
    try {
      let pricing = [];
      let cat;

      for (let category of categories) {
        if (organisation.categories.length !== 0) {
          const c = organisation.categories.find(
            (cc) => cc.name.toLowerCase() === category.name.toLowerCase()
          );
          if (c) {
            const p = parseFloat(category.quantity) * Number(c.price);
            console.log("quantity", parseFloat(category.quantity));
            pricing.push(p);
          } else {
            const p = parseFloat(category.quantity) * 0;
            pricing.push(p);
          }
        } else {
          var cc =
            category.name === "nylonSachet"
              ? "nylon"
              : category.name === "glassBottle"
              ? "glass"
              : category.name.length < 4
              ? category.name.substring(0, category.name.length)
              : category.name.substring(0, category.name.length - 1);

          var organisationCheck = JSON.parse(JSON.stringify(organisation));
          //console.log("organisation check here", organisationCheck);
          for (let val in organisationCheck) {
            //console.log("category check here", cc);
            if (val.includes(cc)) {
              const equivalent = !!organisationCheck[val]
                ? organisationCheck[val]
                : 1;
              console.log("equivalent here", equivalent);
              const p = parseFloat(category.quantity) * equivalent;
              pricing.push(p);
            }
          }
        }
      }

      const totalpointGained = pricing.reduce((a, b) => {
        return parseFloat(a) + parseFloat(b);
      }, 0);

      const totalWeight = categories.reduce((a, b) => {
        return parseFloat(a) + (parseFloat(b["quantity"]) || 0);
      }, 0);

      return {
        error: false,
        totalpointGained,
        totalWeight,
      };
    } catch (error) {
      console.log(error);
      return {
        error: true,
        message: "An error occurred,Please contact support team",
      };
    }
  }

  static async picker(categories, organisation) {
    try {
      for (let category of categories) {
        const c = organisation.categories.find(
          (cc) => cc.name.toLowerCase() === category.name.toLowerCase()
        );
        if (c) {
          // get waste picker price on that category
          const systemPricing = await cateoryModel.findOne({
            name: c.name.toLowerCase(),
          });
          if (systemPricing) {
            const p =
              parseFloat(category.quantity) * Number(systemPricing.wastepicker);
            pricing.push(p);
          }
        } else {
          const p = parseFloat(category.quantity) * 0;
          pricing.push(p);
        }
      }

      const totalpointGained = pricing.reduce((a, b) => {
        return parseFloat(a) + parseFloat(b);
      }, 0);

      const totalWeight = categories.reduce((a, b) => {
        return parseFloat(a) + (parseFloat(b["quantity"]) || 0);
      }, 0);

      return {
        error: false,
        totalpointGained,
        totalWeight,
      };
    } catch (error) {
      console.log(error);
      return {
        error: true,
        message: "An error occurred,Please contact support team",
      };
    }
  }
}

module.exports = rewardService;