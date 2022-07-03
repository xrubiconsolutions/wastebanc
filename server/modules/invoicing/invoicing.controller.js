const invoiceService = require("./invoicing.service");
class invoiceController {
  static async createInvoice(req, res) {
    try {
      const { start, end, companyId } = req.body;
      const { user } = req;
      const invoiceData = await invoiceService.generateInvoice(
        start,
        end,
        companyId,
        user
      );
      return res.status(200).json({
        error: false,
        message: "invoice data",
        data: invoiceData,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async sendInvoice(req, res) {
    try {
      const { invoiceNumber } = req.params;
      const sendInvoice = await invoiceService.sendInvoice(invoiceNumber);
      if (sendInvoice === false)
        return res
          .status(400)
          .json({ error: false, message: "Invalid invoice number passed" });
      return res.status(200).json({
        error: false,
        message:
          "invoice sending in progess and a copy will be sent to the admin mail",
        data: sendInvoice,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async cardData(req, res) {
    try {
      const { user } = req;
      const result = await invoiceService.summaryData(user);
      return res.status(200).json({
        error: false,
        message: "Summary details",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async markInvoice(req, res) {
    try {
      const { user } = req;
      const { invoiceNumber } = req.params;
      const result = await invoiceService.markAsPaid(invoiceNumber, user);
      if (invoice === false)
        return res.status(400).json({
          error: true,
          message: "Invoice not found",
        });

      return res.status(200).json({
        error: false,
        message: "Invoice marked as paid successfully",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async outstandingInvoicePayments(req, res) {
    try {
      const { user } = req;
      let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
      const result = await invoiceService.invoices(
        page,
        resultsPerPage,
        user,
        key,
        start,
        end,
        "pending"
      );
      if (result.error) return res.status(400).json(result);

      return res.status(200).json(result);
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async completedInvoicePayments(req, res) {
    try {
      const { user } = req;
      let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
      const result = await invoiceService.invoices(
        page,
        resultsPerPage,
        user,
        key,
        start,
        end,
        "paid"
      );
      if (result.error) return res.status(400).json(result);

      return res.status(200).json(result);
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async fetchInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const result = await invoiceService.getinvoiceById(invoiceId);
      if (result.error) return res.status(400).json(result);
      return res.status(200).json(result);
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }
}

module.exports = invoiceController;
