const { categoryModel } = require("../models");
class rewardService {
  static async houseHoldBack(categories, organisation) {
    try {
      let pricing = [];
      //let cat;

      console.log("org", organisation);
      for (let category of categories) {
        if (organisation.categories.length !== 0) {
          const c = organisation.categories.find(
            (cc) =>
              cc.name.toLowerCase().trim() ===
              category.name.toLowerCase().trim()
          );
          if (c) {
            const p = parseFloat(category.quantity) * Number(c.price);

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

  static async houseHold(categories, organisation) {
    let pricing = [];
    console.log("org", organisation);
    categories.map((cat) => {
      const organisationcategory = organisation.categories.find(
        (category) => category.catId.toString() == cat.catId.toString()
      );

      console.log("cat", cat);
      console.log("orgcat", organisationcategory);
      if (organisationcategory) {
        const p = parseFloat(cat.quantity) * parseFloat(organisationcategory.price);
        pricing.push(p);
      } else {
        const p = parseFloat(cat.quantity) * 0;
        pricing.push(p);
      }
    });

    const totalpointGained = pricing.reduce((a, b) => {
      return parseFloat(a) + parseFloat(b);
    }, 0);

    const totalWeight = categories.reduce((a, b) => {
      return parseFloat(a) + (parseFloat(b["quantity"]) || 0);
    }, 0);

    if (totalpointGained == 0) {
      return {
        error: true,
        message: "Your company do not collect any of the waste category passed",
      };
    }

    return {
      error: false,
      totalpointGained,
      totalWeight,
    };
  }

  static async picker(categories, organisation) {
    try {
      let pricing = [];

      await Promise.all(
        categories.map(async (category) => {
          console.log("category", category.name.toLowerCase());
          const c = organisation.categories.find(
            (cc) => cc.name.toLowerCase() === category.name.toLowerCase()
          );
          console.log("c", c);
          if (c) {
            console.log("c found", c);
            // get waste picker price on that category
            const systemPricing = await categoryModel.findOne({
              $or: [{ name: category.name }, { value: category.name }],
            });
            if (systemPricing) {
              console.log("system found", systemPricing);
              const p =
                parseFloat(category.quantity) *
                Number(systemPricing.wastepicker);
              pricing.push(p);
            } else {
              console.log("c", c);
              console.log("system not found", category);
            }
          } else {
            console.log("syste, not found", category);
            const p = parseFloat(category.quantity) * 0;
            pricing.push(p);
          }
          console.log("picker price", pricing);
        })
      );

      //   for (let category of categories) {
      //     const c = organisation.categories.find(
      //       (cc) => cc.name.toLowerCase() === category.name.toLowerCase()
      //     );
      //     if (c) {
      //       // get waste picker price on that category
      //       const systemPricing = await categoryModel.findOne({
      //         name: c.name.toLowerCase(),
      //       });
      //       if (systemPricing) {
      //         const p =
      //           parseFloat(category.quantity) * Number(systemPricing.wastepicker);
      //         pricing.push(p);
      //       }
      //     } else {
      //       const p = parseFloat(category.quantity) * 0;
      //       pricing.push(p);
      //     }
      //   }

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

  static calPercentage(point, percentage) {
    return (percentage / 100) * point;
  }
}

module.exports = rewardService;
