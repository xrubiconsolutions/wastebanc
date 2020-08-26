

var authy = require('authy')('YHRjYqZNqXhIIUJ8oC7MIYKUZ6BN2pee');
router.get('/register', function(req, res) {
  console.log('New register request...');
  var isSuccessful = false;
               
  var email = req.param('email');
  var phone = req.param('phone');
  var countryCode = req.param('countryCode');
  authy.register_user(email, phone, countryCode, function (regErr, regRes) {
    console.log('In Registration...');
    if (regErr) {
      console.log(regErr);
      res.send('There was some error registering the user.');
    } else if (regRes) {
      console.log(regRes);
      authy.request_sms(regRes.user.id, function (smsErr, smsRes) {
        console.log('Requesting SMS...');
        if (smsErr) {
          console.log(smsErr);
          res.send('There was some error sending OTP to cell phone.');
        } else if (smsRes) {
          console.log(smsRes);
          res.send('OTP Sent to the cell phone.');
        }
      });
    }
  });
});



// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
const accountSid = 'AC0e54e99aff7296ab5c7bf52d86eee9d8';
const authToken = 'your_auth_token';
const client = require('twilio')(accountSid, authToken);

client.verify.services('VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
             .verifications
             .create({to: '+15017122661', channel: 'sms'})
             .then(verification => console.log(verification.status));
