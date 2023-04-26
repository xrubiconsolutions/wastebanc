const axios = require("axios");
// TODO: Replace with a config constant
const charityChannelWebhook =
  "https://hooks.slack.com/services/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";

class SlackService {
  static async charityPayment(charityData) {
    const { amount, user, charityOrganisation } = charityData;
    if (!amount || !user || !charityOrganisation)
      throw Error("Incomplete message data");
    try {
      const message = `${amount} Naira paid to ${charityOrganisation}`;
      const res = await axios.post(
        charityChannelWebhook,
        JSON.stringify({ text: message })
      );
      if (res.status === 200) return true;
      else throw Error(res.error);
    } catch (e) {
      return false;
    }
  }
}

module.exports = SlackService;
