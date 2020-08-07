var authy = require('authy')('your-auth-key');
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
