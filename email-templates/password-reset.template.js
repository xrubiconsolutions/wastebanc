module.exports = (user, token) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
        
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body{
                background-color: #E5E5E5;
            }
            p{
                font-family:'Times New Roman', Times, serif;
                margin-left:20px;
            }
            .modalBackground{
            background-color: #fff;
            width:320px;
           position: absolute;
            left: 50%;
           top: 50%;
           transform: translate(-50%, -50%);
            border: 1px solid #fff;
            padding: 10px;
           border-radius: 2px; 
            }
        
        </style>
     
    </head>
    <body>
         <div class="modalBackground">
            <div class="flex flex-col space-y-6 p-2">
                <div class="flex items-center" style="margin-top: 10px;">
                    <img src="https://res.cloudinary.com/xrubicon/image/upload/v1647008507/pakam-logo_dvj93k.svg">
                    <div>
                      <strong style="color: green;">PAKAM</strong>
                    </div>
                    </div>
                    <hr style="margin-top: 10px"/>
                <p>Hi ${user.fullname},</p>
                <p>A password reset for your account was<br/> requested. </p>
                <p>To reset your password, enter the code <br/> below  on the recovery password page:</p>
                <span><strong> ${token}</strong></span>
                <p>This code will expire three hours <br/>after this email was sent.</p>
                <p>If you did not make this request, please <br/> disregard this email.</p>
                <p>Thank you,</p>
                <p>Pakam Support</p>
            </div>
          
    </div>
    </div>
    
    
        <section></section>
    </body>
    </html>
    
    `;
};
