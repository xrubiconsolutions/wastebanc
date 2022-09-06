const moment = require("moment");
const { companyInfoModel } = require("../server/models");

module.exports = async (invoice) => {
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

  const companyInfo = await companyInfoModel.findOne();

  const data = transactions.map(
    ({ ref_id, fullname, type, categories, weight, coin }) => {
      const catgs = categories.map((cat) => cat.name).join(", ");
      return [ref_id, `Payment to ${fullname}`, type, catgs, weight, coin];
    }
  );
  let bodyData = data
    .map(
      (current) =>
        `<tr>${current.map((val) => `<td>${val}</td>`).join("")}</tr>`
    )
    .join("");
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
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAkCAYAAADsHujfAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAURSURBVHgBtZhbbBRVGMf/s91CARUQkYpRKdaAUEQl4eIlUIP6ItEHJT4YE6NB0JQQNVWQkBLxglHjNSYl4cHIi8ZojIkvPiCaEB+MRmqKFGlRbCmWClaw1d0Zf+fM0N2ZOVu32/JtvjlnLuc7//N957uc9TTetFkz5Oly+boRnk+/Wjl9pVf1yUjDPI0HbdVtTPoUvRUKNA2Wgw8rr9v1urp03oAYatJE1Wi5qrSGSW+Flw6DMOTbfpcm6Hrt1OmRgexASJXuYcDH2qLPNBZ6VldoSHcg605mWQ2Q6RaMr+16Uy1uIDt1IR/sYdCaaBWdcAe9XvgU737l/nfak/AAo85w7UDNp1QuPaGbkPEI4xfoDTTnBPKS3uajx4vsuRe7N2qVsly/4f55C8jTTDbeVO7nwLXwDJ5Pgv9gggvsegP1ce2jf4y2n/YEz07Q9ukvFjJR3+sAYPYiKQbkRYTKaiC+ufKosoXJtzMkwFwtZa3eUzMe86/qMHE1MuqU4T7QFPqXWi8K0IZZyDs6Wjwwy9DF0UaKU0ZrubbyPGCDVak8CvQympDlNG1keh8gBqDiQDK8qC0So6Kdfm/09G8LZTzI18JI/qLkqwwaOZoySwhqNeYwMWFAZ8cFiAeQW6x8T/VpIFVsniSFgMxGXsv1T7sdx0rrtZJrVSR7YRpIs47z4oxTK75eg28GSl5jpYwaiuRfnXydjdoeOK6uEMwU2mtxuedw568BdYT7QbgH6D16i5BVLgUEAn8YyGytIwy0FiJsNvpoP1zvzBHina8vaGfBjbBZzWxNJgg22zhymvfdtN20Rrtn6R/AhQdoj+sSHWKvGQjLi+ROwOSX2bExINLPMZPEqYNwtkelaB3xYjpCh4gXgj2m9tkPng14s4jHq7QBWH600wpxahnXg0mNdKqgwiTnNBK1Mon0S8Rxeoxoa7wuYJ6k3OKwMQzEj5C5tVJ+PkmSj3YkyV0WzC/+NGOvk9QeExAfMKBKqQqTuUEYWpQG8rSdrFfuwOarUsrrqhIyZb0xBcSQrx9SgsIoeFKVkm+zdHJvnOtP1gPWcxJATKJyq7FHlZKnubZ1yQ31XJcG4us7p7BgTJv1mlhmj5vGmG5BGkjekfyCSFylFFBipE1SDGhJGkjAHnG5r0cZUAk9SNQNCHWhbDkBiWIpBaSGgBREyS2ulV5VQjV4hctbFAPVkAYS5oPDqcH9tt4cPeVi2bYU1+u+sPrLJIa3xe7Mx602iY2eAl1XBhAz/zwXkIOjyjMjA5lXBpAw1qiQfUPKkfzi0Pr1f/QotZenhxB4pUxdk9O72q1d9Oc4PNAFZjANRPoxMXBks2zgsBFQlZja3Zg1r4tptwCrAWBzHatPb9ysfjJNfP3Z6Hyj4Y8HS4JYb1e8jRJnB4F6BUevbThsLQm0iQnvKukpcRfepQ/1WxrIC9ZVjxVppK8kkAyTiWg809Ya+9FGPxOYXyOm+igxoQvQtyyzqSAuSZ492Z0LwdUlgQS6SOYoOaQPKI0W0z7MkbJN/3C+DewvqQGTx83B60uZo9ZUjhafF2rerAOIsbtZ7TT6y7SJP1gCak9TJuRYQ56yMjzPmnPuUq5LeH437W54K/0hvtknWW84BB+B2xnZqU9LB0f3/yNP8oeK9J4t53zF7eoP97vhNvrPsLqNTLSSZLAZ7ezT+6PP2KX/qNnEinzdT+8GhUcIE3W7WHE79Xu7XuFAkZYVqEL6D+KyYAEKG7FTAAAAAElFTkSuQmCC"
          alt="logo"
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
            Invoice for transactions done from ${moment(startDate).format(
              "MMMM Do YYYY"
            )} to ${moment(endDate).format("MMMM Do YYYY")}
          </p>
        </td>
      </tr>
    </table>
    <table width="100%">
      <tr class="invoice-info">
        <td>
          <p class="title">From</p>
          <div class="info-text">
            <p>${companyInfo?.name}</p>
            <p>${companyInfo?.address}</p>
            <p>${companyInfo.country}</p>
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
    
    </table>
    <table class="transactions" width="100%">
      <thead>
        <tr>
          <th>Ref No</th>
          <th>Description</th>
          <th>Type</th>
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
