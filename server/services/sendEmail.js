const nodemailer = require("nodemailer");
const welcomeTemplate = require("../../email-templates/welcome-email.template");
const invoiceTemplate = require("../../email-templates/invoice.template");
const sendResetToken = async (email, token) => {
  const resetData = getResetTokenData(email, token);
  return await sendMail(resetData);
};
const organisationOnboardingMail = async (email, password) => {
  const onboardingData = organisationOnboardingData(email, password);
  return await sendMail(onboardingData);
};
const userAgenciesMail = async (agency, password) => {
  const agenciesData = userAgenciesMailData(agency, password);
  return await sendMail(agenciesData);
};
const sendwebsiteMessage = async (email, message) => {
  const messageMailData = messageData(email, message);
  return await sendMail(messageMailData);
};

const sendInvoiceMail = async (invoiceData) => {
  const invoice = await invoiceMailData(invoiceData);
  return await sendMail(invoice);
};

const sendResumeMail = async (data) => {
  const resumeData = resumeMailData(data);
  return await sendMail(resumeData);
};
const resumeMailData = (params) => {
  const {
    fullname,
    phonenumber,
    email,
    location,
    linkedin,
    attachment,
    filename,
    jobtitle,
  } = params;
  const data = {
    to: "hr@pakam.ng",
    cc: "info@pakam.ng",
    subject: `${jobtitle} Application`,
    html: `<p>User Details</p></br>
          <p>
            <ol>
              <li>FirstName - ${fullname}</li>
              <li>PhoneNumber - ${phonenumber}</li>
              <li>Email - ${email}</li>
              <li>Location - ${location}</li>
              <li>Linkedin - ${linkedin}</li>
            </ol>
          </p></br>
    `,
    attachments: [
      {
        content: attachment,
        filename,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };
  return mailOptions(data);
};
const invoiceMailData = async (invoiceData) => {
  const template = await invoiceTemplate(invoiceData);
  const data = {
    to: invoiceData.company.email,
    subject: "Transactions Invoice",
    html: template,
  };
  return mailOptions(data);
};
const messageData = (email, message) => {
  const data = {
    to: "support@pakam.ng",
    subject: "FAQ Form Message",
    html: `<pHello Support Team</p></br>
    <p>You just received this message from the Pakam Website.</p></br>
    <p>Email:${email}</p></br>
    <p>Message:${message}</p></br>
    <p>Best Regards</p></br>
    <p>Pakam Technologies</p>
`,
  };
  return mailOptions(data);
};

const userAgenciesMailData = (agency, password) => {
  const emailTemplate = welcomeTemplate(agency, password);
  const data = {
    to: agency.email,
    subject: "WELCOME TO PAKAM!!!",
    html: emailTemplate,
  };

  return mailOptions(data);
};
const organisationOnboardingData = (email, password) => {
  const data = {
    to: email,
    subject: "WELCOME TO PAKAM!!!",
    html: `<p>Congratulations, you have been approved by Pakam and have been on-boarded to the Pakam waste management ecosystem.</p></br>
                <p>Kindly use the following login details to sign in to your Pakam Company Dashboard.</p></br>
                <ol>
                    <li>Email: ${email}</li>
                    <li>Password: ${password}</li>
                </ol></br>
            <p>Please note you can reset the password after logging into the App by clicking on the image icon on the top right corner of the screen.</p></br>
            <p>*Attached below is a guide on how to use the Company Dashboard.</p></br>
            <p><strong>How To Use The Dashboard</strong></p></br>
            <p>*Attached below is a guide on how to use the Company Dashboard.</p></br>
            <p>How To Use The Dashboard</p></br>
            <p>Kindly Logon to https://newdashboard.pakam.ng</p></br>
            <p>
              <ol>
                <li>Select Recycling Company</li>
                <li>Input your Login Details</li>
                <li>You can reset your password by clicking on the image icon at the top right of the screen.</li>
                <li>After Login you can see a data representation of all activities pertaining to your organisation such as:</li>
              </ol>
            </p></br>
          <p>Total Schedule Pickup: This is the sum total of the schedules within your jurisdiction, which include pending schedules, completed schedules, accepted schedules, cancelled schedules and missed schedules.</p></br>
          <p>Total Waste Collected: This card display the data of all the waste collected by your organization so far. When you click on the card it shows you a data table representing the actual data of the waste collected by your organization and it's aggregators.</p></br>
          <p>Total Payout: This card embodies the table that showcase details of user whose recyclables your organization have collected and how much you are meant to pay them.</p>
          <p><strong>Instruction of How To Onboard Collectors or Aggregators</strong></p></br>
          <p>
          <ol>
            <li>You will need to onboard your collectors or aggregators into the system by asking them to download the Pakam Recycler's App.</li>
            <li>Create a unique company ID No for your collector/aggregator.</li>
            <li>Instruct them to select the name of your organization and input unique company ID No while setting up their account.</li>
            <li>Once they choose your organization as their recycling company, you will need to approve them on your company Dashboard.</li>
          </ol>
          </p></br>
          <p>How To Approve a Collector/Aggregator</p></br>
          <p>
            <ol>
              <li>Login  into your Company Dashboard</li>
              <li>Click on all aggregator on the side menu</li>
              <li>Click on all pending aggregator</li>
              <li>You will see a list of all pending aggregator and an approve button beside it.</li>
              <li>Click on approve to Approve the aggregator</li>
              <li>Refresh the screen, pending aggregators who have been approved will populated under All Approved aggregators.</li>
            </ol>
          </p></br>
          <p>We wish you an awesome experience using the App waste management software.</p></br>
          <p>Best Regards</p></br>
          <p>Pakam Team</p></br>
        `,
  };
  return mailOptions(data);
};
const getResetTokenData = (email, token) => {
  const data = {
    to: email,
    subject: "Passwowrd Reset token",
    html: `<p>Your password reset request was recieved below is your reset token</p></br>
                <p>Token: ${token}</p></br>
                <p>Best Regards</p></br>
                <p>Pakam Technologies</p>`,
  };
  return mailOptions(data);
};
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  secure: true,
  port: 465,
  auth: {
    user: "info@pakam.ng",
    pass: "Leyeolaide1",
  },
});
const mailOptions = (data) => {
  const { to, subject, html } = data;
  return {
    from: "info@pakam.ng",
    to,
    subject,
    html,
  };
};
const sendMail = async (mailOptions) => {
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    }
  });
};

module.exports = {
  sendResetToken,
  organisationOnboardingMail,
  userAgenciesMail,
  sendwebsiteMessage,
  sendInvoiceMail,
  sendResumeMail,
};
