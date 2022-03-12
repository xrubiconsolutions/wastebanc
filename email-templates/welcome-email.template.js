module.exports = (user, password) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html>
    <head>
        <meta name="description" content="">
        <meta name="keywords" content="">
        <link
        href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
        rel="stylesheet"
        integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN"
        crossorigin="anonymous"
      />
    <link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
      box-sizing: border-box;
    }
    .row::after {
      content: "";
      clear: both;
      display: table;
    }
    [class*="col-"] {
      float: left;
      padding: 15px;
    }
    /* For mobile phones: */
    [class*="col-"] {
      width: 100%;
    }
    @media only screen and (min-width: 600px) {
      /* For tablets: */
      .col-s-1 {width: 8.33%;}
      .col-s-2 {width: 16.66%;}
      .col-s-3 {width: 25%;}
      .col-s-4 {width: 33.33%;}
      .col-s-5 {width: 41.66%;}
      .col-s-6 {width: 50%;}
      .col-s-7 {width: 58.33%;}
      .col-s-8 {width: 66.66%;}
      .col-s-9 {width: 75%;}
      .col-s-10 {width: 83.33%;}
      .col-s-11 {width: 91.66%;}
      .col-s-12 {width: 100%;}
    }
    @media only screen and (min-width: 768px) {
      /* For desktop: */
      .col-1 {width: 8.33%;}
      .col-2 {width: 16.66%;}
      .col-3 {width: 25%;}
      .col-4 {width: 33.33%;}
      .col-5 {width: 41.66%;}
      .col-6 {width: 50%;}
      .col-7 {width: 58.33%;}
      .col-8 {width: 66.66%;}
      .col-9 {width: 75%;}
      .col-10 {width: 83.33%;}
      .col-11 {width: 91.66%;}
      .col-12 {width: 100%;}
    }
    html {
      font-family: "Roboto";
      color:#343434;
    }
    body {
      font-family: "Roboto";
      color:#343434;
      background-color: #E5E5E5;
    }
    a{
      color: #370863;
    }
    .header {
      background-color: #fff;
      color: #ffffff;
      padding:0px 15px;
      text-align: center;
    }
    .footer {
      background-color: #fff;
      color: #343434;
      text-align: center;
      font-size: 12px;
      padding: 30px 15px 0px 15px;
      /* margin: 3px 15px; */
    }
    hr.hrStyle {
                /* padding: 10px; */
                margin: 0px;
                border-top: 1px solid #370863;
              }
    hr.hrStyle-detail {
    margin: 10px 0 15px 0;
    border-top: 1px solid #370863;
    }
    hr.hrThin {
                margin: 0px;
                border-top: 1px solid #370863;
              }
    .section {
    height: auto;
    padding: 30px 50px;
    margin: 0px 15px;
    }
    .title {
    color: #370863;
    font-size: 20px;
    font-weight: bold;
    }
    .salute {
    color: #370863;
    font-size: 14px;
    font-weight: normal;
    padding-bottom: 10px;
    }
    .content {
    color: #343434;
    font-size: 14px;
    text-align:justify;
    padding-top: 5px;
    }
    .container {
    width: 80%;
    max-width: 800px;
    background-color: #fff;
    }
    .button {
      box-sizing: border-box;
      background-color: #370863;
      border: none;
      color: #fff;
      padding: 10px 0px;
      text-align: center;
      text-decoration: none;
      display: block;
      width: 100%;
      font-size: 12px;
      margin: 4px 2px;
      cursor: pointer;
      }
    </style>
    
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="javascript:void(0)" target="_blank">
                    <img src="https://res.cloudinary.com/xrubicon/image/upload/v1647091610/pakam-logo_pddzwg.png" alt="Pakam" width="150" />
                </a>
            </div>  
            <div class="row section">
            <div class="title">Welcome To Pakam
    
            </div> 
            <hr class="hrStyle" />
            <div class="content">
                <p>
                    <div class="salute">
                        Dear ${user.fullname},
                      </div>
                     
                </p>
                <p>
                <div class="salute">
                  Your Login Details <br>
                </div>
                Your Login Details <br>
                <strong>Email: ${user.email}</strong> <br>
                 <strong> Password: ${password} </strong>
                </p>
            </div>
            
            </div>
            <div class="footer">
            <a href="javascrip:void(0)" target="_blank"> 
                <img src="https://res.cloudinary.com/xrubicon/image/upload/v1647091610/pakam-logo_pddzwg.png" alt="Pakam" width="50" />
            </a>
            <p><b> ALL RIGHTS RESERVED ${new Date().getFullYear()}</b></p>
            <!-- <hr class="hrThin" /> -->
            <div class="row">
                <div class="col-4">&nbsp;</div>
                <div class="col-4">
                    <div class="row">
                        <div class="col-4">
                            <a href="https://www.instagram.com/pakam_ng">
                                <i
                                    class="fa fa-instagram fa-2x" style="color:#370863;"></i>
                                </a>
                        </div>
                        <div class="col-4">
                            <a href="https://www.facebook.com/Pakam-104820265112602" ><i
                                class="fa fa-facebook fa-2x" style="color:#370863";
                                ></i>
                            </a>
                        </div>
                        <div class="col-4">
                            <a href="https://twitter.com/_Pakam"><i
                                class="fa fa-twitter fa-2x" style="color:#370863";
                                ></i>
                            </a>
                        </div>
                        <!-- <div class="col-3">
                            <a><i
                                class="fa fa-whatsapp"
                                style="margin-right: 10px;"
                                ></i>
                            </a>
                        </div> -->
                    </div>
                </div>
                <div class="col-4">&nbsp;</div>
            </div>
            <div class="row">
                <div class="col-12" style="font-size: 16px;">
                    Thank you for choosing <a href="https://pakam.ng/" target="_blank" style="color:#370863;">Pakam</a>
                </div>
            </div>
            </div>
        </div>
    </body>
    </html>`;
};
