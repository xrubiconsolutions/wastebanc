module.exports = (invoice) => {
  const {
    transactions,
    company: { companyName, email, phone, location },
    startDate,
    endDate,
    amount,
    serviceCharge,
    amountPaid,
    balance,
    invoiceNumber,
  } = invoice;
  const data = transactions.map(
    ({ ref_id, fullname, categories, weight, coin }) => {
      const catgs = categories.map((cat) => cat.name).join(", ");
      return [ref_id, `Payment to ${fullname}`, catgs, weight, coin];
    }
  );
  let bodyData = data
    .map(
      (current) =>
        `<tr>${current.map((val) => `<td>${val}</td>`).join("")}</tr>`
    )
    .join("");
  console.log({ bodyData });

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
      @import url("https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;700&display=swap");

      * {
        margin: 0;
        padding: 0;
        border: 0;
      }

      body {
        font-family: "Raleway", sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 3%;
        background-color: white;
      }

      header {
        margin-bottom: 4rem;
      }

      .logo {
        margin: 0.5rem 0;
      }

      .logo > a {
        display: flex;
        align-items: center;
        column-gap: 0.4rem;
        text-decoration: none;
        color: black;
      }

      .logo > a > p {
        font-size: 19px;
        color: #005900;
        font-weight: bold;
      }

      .description {
        font-weight: 500;
      }

      .invoice-info td {
        margin-top: 1.5rem;
        padding-bottom: 2rem;
      }

      .invoice-info td:last-of-type {
        padding-left: 5%;
      }

      .title {
        font-weight: 700;
        font-size: 18px;
        margin-bottom: 0.3rem;
      }

      .info-text > p {
        font-weight: lighter;
      }

      .summary {
        margin-bottom: 2em;
      }

      .summary > p:first-of-type {
        font-weight: 700;
        font-size: 18px;
        color: gray;
      }

      .summary-data {
        border-top: 1px solid grey;
        border-bottom: 1px solid grey;
        padding: 0.5rem 0;
        margin: 0.4rem 0;
      }

      .total-due {
        padding-top: 1.5rem;
        font-weight: bold;
      }

      .total-due:first-of-type {
        padding-top: 1.5rem;
      }

      .summary-data:last-of-type,
      .total-due:last-of-type {
        text-align: right;
        padding-right: 0;
      }

      .font-light {
        font-weight: 300;
      }

      table {
        text-align: left;
        border-collapse: collapse;
        /* table-layout: fixed; */
      }

      table td,
      th {
        padding: 0.5rem 0;
        padding-right: 0.5rem;
      }

      th {
        border-top: 1px solid gray;
        border-bottom: 1px solid gray;
        font-size: 18px;
      }

      td {
        font-weight: 300;
      }

      .brief-text {
        padding-top: 0;
        padding-bottom: 1.5rem;
      }
    </style>
    <title>Invoice</title>
  </head>
  <body>
    <table width="100%">
      <tr>
        <td width="35">
          <a href="#" target="_blank">
            <img
              src="https://res.cloudinary.com/xrubicon/image/upload/v1647091610/pakam-logo_pddzwg.png"
              alt="Pakam"
            />
          </a>
        </td>
        <td class="logo">
          <a href="#" target="_blank">
            <p>Pakam</p>
          </a>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <p class="description">
            Final invoice for the June 2022 billing period
          </p>
        </td>
      </tr>
    </table>
    <table width="100%">
      <tr class="invoice-info">
        <td>
          <p class="title">From</p>
          <div class="info-text">
            <p>Xrubicon solutions</p>
            <p>127 Ogunlana Drive, Surulere,</p>
            <p>Nigeria</p>
          </div>
        </td>
        <td>
          <p class="title">Billed to</p>
          <div class="info-text">
          <p>${companyName}</p>
          <p>${location}.</p>
          <p>${email}.</p>
          <p>${phone}.</p>
        </div>
        </td>
        <td>
          <p class="title">Details</p>
          <div class="info-text">
            <p>${invoiceNumber}</p>
            <p>${startDate?.toISOString().slice(0, 10)}</p>
           <p>${endDate?.toISOString().slice(0, 10)}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td class="summary">
          <p>Summary</p>
        </td>
      </tr>
      <tr>
        <td class="summary-data" colspan="2">
          <p>Total usage charges</p>
        </td>
        <td class="summary-data">
          <p>&#8358;${serviceCharge}</p>
        </td>
      </tr>
      <tr>
        <td class="total-due" colspan="2">
          <p>Total due</p>
        </td>
        <td class="total-due">
          <p>&#8358;${amount}</p>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="brief-text">
          <p class="font-light">
            If you have a credit card on file, it will be automatically charged
            within 24 hours
          </p>
        </td>
      </tr>
    </table>
    <table class="transactions" width="100%">
      <thead>
        <tr>
          <th>Ref No</th>
          <th>Description</th>
          <th>Waste Category</th>
          <th>Weight (Kg)</th>
          <th>Amount (&#8358;)</th>
        </tr>
      </thead>
      <tbody>
      ${bodyData}
      </tbody>
    </table>
     </body>
   </html>
          `;
};
