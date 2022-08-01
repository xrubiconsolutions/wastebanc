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
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;700&display=swap');
  
        * {
          margin: 0;
          padding: 0;
          border: 0;
        }
  
        body {
          font-family: 'Raleway', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 3%;
        }
  
        header{
            margin-bottom: 4rem;
        }
  
        .logo {
         margin: .5rem 0;
        }
  
        .logo > a{
          display: flex;
          align-items: center;
          column-gap: .4rem;
          text-decoration: none;
          color: black;
        }
  
        .logo > a > p{
            font-size: 19px;
            color: #005900;
            font-weight: bold;
        }
  
        .description{
          font-weight: 500;
        }
  
        .invoice-info{
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
        }
  
        .title{
          font-weight: 700;
          font-size: 18px;
          margin-bottom: .3rem;
        }
  
        .info-text >p{
          font-weight: lighter;
        }
  
        .summary{
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
            padding: .5rem 0;
            margin: .4rem 0;
        }
        .total-due{
            margin-top: 1.5rem;
            font-weight: bold;
        }
  
        .summary-data, .total-due{
            display: flex;
            justify-content: space-between;
        }
  
        .font-light{
            font-weight: 300;
        }
  
        table{
            text-align: left;
            border-collapse: collapse;
        }
  
        table td, th{
            /* width: 20%; */
          padding: .5rem 0;
  
        }
  
      th {
          border-top: 1px solid gray;
          border-bottom: 1px solid gray;
          font-size: 18px;
         }
  
         td{
             font-weight: 300;
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
      <tr class="invoice-info" width="100%">
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
           <p>43622723</p>
           <p>${startDate.slice(0, 10)}</p>
           <p>${endDate.slice(0, 10)}</p>
         </div>
        </td>
      </tr>
      <tr>
        <td>
          <p>Summary</p>
        </td>
      </tr>
      <tr>
        <td class="summary-data">
          <p>Total usage charges</p>
          <p>&#8358;45,000</p>
        </td>
      </tr>
      <tr>
        <td class="total-due">
          <p>Total due</p>
          <p>&#8358;45,000</p>
        </td>
      </tr>
      <tr>
        <td>
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
