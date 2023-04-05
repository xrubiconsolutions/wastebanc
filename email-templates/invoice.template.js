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
  const collectionFee = (
    parseFloat(amount) - parseFloat(serviceCharge)
  ).toLocaleString();

  const companyInfo = await companyInfoModel.findOne();

  const data = transactions.map(
    ({ ref_id, address, phone, fullname, type, categories, weight, amountTobePaid }) => {
      const catgs = categories.map((cat) => cat.name).join(", ");
      return [ref_id, address, phone, weight, amountTobePaid.toLocaleString()];
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
        <title>Receipt</title>
        <style>
        <style>
         @import url("https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;700&display=swap");
        </style>
      </head>
  <body>
  <div
  style="
    max-width: 1800px;
    width: 800px;
    margin: auto;
    padding-left: 25px;
    padding-right: 25px;
    gap: 20px;
  "
  >
  <table cellpadding="0" cellspacing="0">
    <tbody>
      <tr align="center">
        <td width="20px">
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAkCAYAAADsHujfAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAURSURBVHgBtZhbbBRVGMf/s91CARUQkYpRKdaAUEQl4eIlUIP6ItEHJT4YE6NB0JQQNVWQkBLxglHjNSYl4cHIi8ZojIkvPiCaEB+MRmqKFGlRbCmWClaw1d0Zf+fM0N2ZOVu32/JtvjlnLuc7//N957uc9TTetFkz5Oly+boRnk+/Wjl9pVf1yUjDPI0HbdVtTPoUvRUKNA2Wgw8rr9v1urp03oAYatJE1Wi5qrSGSW+Flw6DMOTbfpcm6Hrt1OmRgexASJXuYcDH2qLPNBZ6VldoSHcg605mWQ2Q6RaMr+16Uy1uIDt1IR/sYdCaaBWdcAe9XvgU737l/nfak/AAo85w7UDNp1QuPaGbkPEI4xfoDTTnBPKS3uajx4vsuRe7N2qVsly/4f55C8jTTDbeVO7nwLXwDJ5Pgv9gggvsegP1ce2jf4y2n/YEz07Q9ukvFjJR3+sAYPYiKQbkRYTKaiC+ufKosoXJtzMkwFwtZa3eUzMe86/qMHE1MuqU4T7QFPqXWi8K0IZZyDs6Wjwwy9DF0UaKU0ZrubbyPGCDVak8CvQympDlNG1keh8gBqDiQDK8qC0So6Kdfm/09G8LZTzI18JI/qLkqwwaOZoySwhqNeYwMWFAZ8cFiAeQW6x8T/VpIFVsniSFgMxGXsv1T7sdx0rrtZJrVSR7YRpIs47z4oxTK75eg28GSl5jpYwaiuRfnXydjdoeOK6uEMwU2mtxuedw568BdYT7QbgH6D16i5BVLgUEAn8YyGytIwy0FiJsNvpoP1zvzBHina8vaGfBjbBZzWxNJgg22zhymvfdtN20Rrtn6R/AhQdoj+sSHWKvGQjLi+ROwOSX2bExINLPMZPEqYNwtkelaB3xYjpCh4gXgj2m9tkPng14s4jHq7QBWH600wpxahnXg0mNdKqgwiTnNBK1Mon0S8Rxeoxoa7wuYJ6k3OKwMQzEj5C5tVJ+PkmSj3YkyV0WzC/+NGOvk9QeExAfMKBKqQqTuUEYWpQG8rSdrFfuwOarUsrrqhIyZb0xBcSQrx9SgsIoeFKVkm+zdHJvnOtP1gPWcxJATKJyq7FHlZKnubZ1yQ31XJcG4us7p7BgTJv1mlhmj5vGmG5BGkjekfyCSFylFFBipE1SDGhJGkjAHnG5r0cZUAk9SNQNCHWhbDkBiWIpBaSGgBREyS2ulV5VQjV4hctbFAPVkAYS5oPDqcH9tt4cPeVi2bYU1+u+sPrLJIa3xe7Mx602iY2eAl1XBhAz/zwXkIOjyjMjA5lXBpAw1qiQfUPKkfzi0Pr1f/QotZenhxB4pUxdk9O72q1d9Oc4PNAFZjANRPoxMXBks2zgsBFQlZja3Zg1r4tptwCrAWBzHatPb9ysfjJNfP3Z6Hyj4Y8HS4JYb1e8jRJnB4F6BUevbThsLQm0iQnvKukpcRfepQ/1WxrIC9ZVjxVppK8kkAyTiWg809Ya+9FGPxOYXyOm+igxoQvQtyyzqSAuSZ492Z0LwdUlgQS6SOYoOaQPKI0W0z7MkbJN/3C+DewvqQGTx83B60uZo9ZUjhafF2rerAOIsbtZ7TT6y7SJP1gCak9TJuRYQ56yMjzPmnPuUq5LeH437W54K/0hvtknWW84BB+B2xnZqU9LB0f3/yNP8oeK9J4t53zF7eoP97vhNvrPsLqNTLSSZLAZ7ezT+6PP2KX/qNnEinzdT+8GhUcIE3W7WHE79Xu7XuFAkZYVqEL6D+KyYAEKG7FTAAAAAElFTkSuQmCC"
            alt="logo"
          />
        </td>
        <td>
          <p>Pakam</p>
        </td>
      </tr>
    </tbody>
    </table>
    <table cellpadding="5">
  <tbody>
  <tr>
  <td colspan="2">
    <p class="description">
      Invoice for transactions done from ${moment(startDate).format(
        "MMMM Do YYYY"
      )} to ${moment(endDate).format("MMMM Do YYYY")}
    </p>
  </td>
</tr>
    <tr>
      <td style="font-weight: 600">
        N.B: Please ensure this transaction is made within the next two
        working days.
      </td>
    </tr>
  </tbody>
</table>
<table width="100%" cellpadding="5">
<tbody>
  <tr style="margin-top: 2rem">
    <th align="start">FROM</th>
    <th align="start">TO</th>
    <th align="start">DETAILS</th>
  </tr>
  <tr align="start">
  <td>
  <span>${companyInfo?.name}</span><br />
  <span>${companyInfo?.address}</span><br />
  <span>${companyInfo.country}</span><br />
  </td>
  <td>
  <span>${companyName}</span><br />
  <span>${location}.</span><br />
  <span>${email}.</span><br />
  <span>${phone}.</span><br />
  </td>
  <td>
  <span>${invoiceNumber}</span><br />
  <span>${startDate?.toISOString().slice(0, 10)}</span><br />
 <span>${endDate?.toISOString().slice(0, 10)}</span><br />
  </td>
</tr>
</tbody>
</table>

<table width="100%" cellpadding="5">
  <thead
    style="border-top: 1px solid black; border-bottom: 1px solid black"
  >
    <tr>
      <th
        align="start"
        style="
          border-top: 1px solid black;
          border-bottom: 1px solid black;
        "
        colspan="2"
      >
        Summary
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>Total Collection fee:</td>
      <td>&#8358;${collectionFee}</td>
    </tr>

    <tr>
      <td>Total usage charge:</td>
      <td
        style="
          /* border-top: 1px solid black; */
          border-bottom: 1px solid black;
        "
      >
      &#8358;${serviceCharge?.toLocaleString()}
      </td>
    </tr>

    <tr>
      <td style="font-weight: 700">Total due:</td>

      <td style="font-weight: 700">&#8358;${amount?.toLocaleString()}</td>
    </tr>
    <!-- <tr>
      <td>
        Please ensure this transaction is made within the next two working
        days.
      </td>
    </tr> -->
  </tbody>
    </table>
    <table width="100%">
          <thead>
            <tr>
              <th align="start">Ref No</th>
              <th align="start">Customer address</th>
              <th align="start">Customer's phone number</th>
              <th align="start">Weight (Kg)</th>
              <th align="start">Amount (₦)</th>
            </tr>
          </thead>
      <tbody>
      ${bodyData}
      </tbody>
      </table>
    </table>
    </div>
     </body>
   </html>
          `;
};
