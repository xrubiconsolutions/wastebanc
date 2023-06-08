/**
 * Created by Radhey Shyam on 14/02/18.
 */

"use strict";
const commonFun = require("../util/commonFunction");
let FS = require("fs");
let CONFIG = require("../config");
var multer = require("multer");
let Path = require("path");
var AWS = require("aws-sdk");
var mime = require("mime-types");
let GM = require("gm").subClass({ imageMagick: true });
var FsExtra = require("fs-extra");
const sgMail = require("@sendgrid/mail");
//const { request } = require("https");
const request = require("request");
const { requestedPayment } = require("../controller/payController");
const { sendResumeMail } = require("../services/sendEmail");

AWS.config.update({
	accessKeyId: CONFIG.awsConfig.accessKeyId,
	secretAccessKey: CONFIG.awsConfig.secretAccessKey,
	//  region:' '
});
var s3 = new AWS.S3();

/**
 * Storage for file in local machine
 */
let storage = multer.diskStorage({
	destination: function (req, files, cb) {
		cb(null, "./client/uploads/");
	},
	filename: function (req, files, cb) {
		let fileName = files.originalname.split(".");
		let fileExtension = fileName[fileName.length - 1];
		cb(null, Date.now() + "." + fileExtension);
	},
});

/** Upload single file **/
const upload = multer({ storage: storage }).single("file");

let commonService = {};
/**
 * @param model mongodb model
 * @param criteria  criteria for data finding
 * @param projection projection for filtering data according to requirement
 * @param callback return function
 */
commonService.find = (model, criteria, projection, callback) => {
	model.findOne(criteria, projection, (err, result) => {
		if (err) return callback(commonFun.sendError(err));
		else return callback(null, commonFun.sendSuccess(result));
	});
};

/** Upload file **/
commonService.fileUpload = (REQUEST, RESPONSE) => {
	return new Promise((resolve, reject) => {
		/** Upload pic locally first **/
		upload(REQUEST, RESPONSE, function (err) {
			if (err) {
				// An error occurred when uploading
				return reject(`Error: ${err}`);
			}

			/** File data **/
			let fileData = REQUEST.file,
				fileName = fileData.originalname.split("."),
				fileExtension = fileName[fileName.length - 1];

			fileName = Date.now() + "." + fileExtension;
			let path = fileData.path;

			/** Profile and thumb **/
			fileData.original = "profile_" + fileName;
			fileData.thumb = "thumbe_" + fileName;

			/** Thumbnail image **/
			let finalArray = [
				{
					path: Path.resolve(".") + "/client/uploads/" + fileData.thumb,
					finalUrl: CONFIG.awsConfig.s3URL + fileData.thumb,
				},
			];

			/** Profile image **/
			finalArray.push({
				path: fileData.path,
				finalUrl: CONFIG.awsConfig.s3URL + fileData.original,
			});

			/** Create thumb image locally **/
			commonService
				.createThumbImage(path, finalArray[0].path)
				.then((result) => {
					let functionsArray = [];
					finalArray.forEach(function (obj) {
						functionsArray.push(commonService.uploadFileS3(obj));
					});

					/** Upload image in s3 bucket **/
					return Promise.all(functionsArray)
						.then((result) => {
							commonService.deleteFile(finalArray[0].path);
							commonService.deleteFile(finalArray[1].path);

							return resolve({
								imgUrl: CONFIG.awsConfig.s3URL + fileData.original,
								thumb: CONFIG.awsConfig.s3URL + fileData.thumb,
							});
						})
						.catch((error) => {
							throw error;
						});
				})
				.catch((error) => {
					reject(error);
				});
		});
	});
};

/** Create image **/
commonService.createThumbImage = (originalPath, thumbnailPath) => {
	return new Promise((resolve, reject) => {
		var readStream = FS.createReadStream(originalPath);
		GM(readStream).size({ bufferStream: true }, function (err, size) {
			if (size) {
				let height = 150;
				let width = (size.width * height) / size.height;
				this.thumb(
					width,
					height,
					thumbnailPath,
					30,
					/* .autoOrient()
                        .write(thumbnailPath1,*/ function (err, data) {
						console.log(data);
						err ? reject(err) : resolve(data);
					}
				);
			}
		});
	});
};

/** Remove file  **/
commonService.deleteFile = (path) => {
	return FsExtra.remove(path);
};

/** Upload image to s3 bucket **/
commonService.uploadFileS3 = (fileObj) => {
	return new Promise((resolve, reject) => {
		var fileName = Path.basename(fileObj.finalUrl);
		var stats = FS.statSync(fileObj.path);

		var fileSizeInBytes = stats["size"];

		FS.readFile(fileObj.path, (err, fileData) => {
			s3.putObject(
				{
					Bucket: CONFIG.awsConfig.bucket,
					Key: fileName,
					Body: fileData,
					ContentType: mime.lookup(fileName),
				},
				(err, data) => {
					err ? reject(err) : resolve(data);
				}
			);
		});
	});
};

commonService.resumeUpload = async (REQUEST, RESPONSE) => {
	return new Promise((resolve, reject) => {
		if (!REQUEST.files) {
			return RESPONSE.status(400).json({
				message: "resume is required",
				statusCode: 400,
			});
		}

		const jobtitle = REQUEST.body.jobtitle;
		const fullname = REQUEST.body.fullname;
		const phonenumber = REQUEST.body.phonenumber;
		const email = REQUEST.body.email;
		const location = REQUEST.body.location;
		const linkedin = REQUEST.body.linkedin || "";

		/** File data **/
		let file = REQUEST.files.resume;

		const path = "./client/upload/" + file.name;

		file.mv(path, async (err) => {
			if (err) {
				console.log(err);
				return RESPONSE.status(400).json({
					message: "Internal server error",
					error: err,
				});
			}

			const attachment = FS.readFileSync(path).toString("base64");
			//console.log(attachment);
			const filename = file.name;
			const data = {
				fullname,
				phonenumber,
				email,
				location,
				linkedin,
				attachment,
				filename,
				jobtitle,
			};
			await sendResumeMail(data);
			// sgMail.setApiKey(
			//   "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"
			// );

			// const mail = {
			//   to: "james@xrubiconsolutions.com",
			//   cc: "temidayo@xrubiconsolutions.com",
			//   from: "pakam@xrubiconsolutions.com", // Use the email address or domain you verified above
			//   subject: `${jobtitle} Application`,
			//   text: `User Details
			//     Fullname - ${fullname}
			//     Phonenumber - ${phonenumber}
			//     Email - ${email}
			//     Location - ${location}
			//     Linkedin - ${linkedin}
			//     `,
			//   attachments: [
			//     {
			//       content: attachment,
			//       filename: file.name,
			//       type: "application/pdf",
			//       disposition: "attachment",
			//     },
			//   ],
			// };
			// sgMail.send(mail).catch((err) => {
			//   console.log(err);
			// });

			commonService.deleteFile(path);

			return RESPONSE.json({
				message: "Resume submitted successfully",
				statusCode: 200,
			});
		});

		// fileName = fileData.originalname.split("."),
		// fileExtension = fileName[fileName.length - 1];

		//fileName = Date.now() + "." + fileExtension;
		//let path = fileData.path;
		//console.log("fileData", fileData.file);
	});
};

// commonService.OTPtoPhone = async (phone, email) => {
//   try {
//     const phoneNo = String(phone).substring(1, 11);
//     const data = {
//       api_key: "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
//       message_type: "NUMERIC",
//       to: `+234${phoneNo}`,
//       from: "N-Alert",
//       channel: "dnd",
//       pin_attempts: 10,
//       pin_time_to_live: 5,
//       pin_length: 4,
//       pin_placeholder: "< 1234 >",
//       message_text:
//         "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
//       pin_type: "NUMERIC",
//     };
//     const option = {
//       method: "POST",
//       url: "https://api.ng.termii.com/api/sms/otp/send",
//       headers: {
//         "Content-Type": ["application/json", "application/json"],
//       },
//       body: JSON.stringify(data),
//     };

//     request(options, function (error, response) {
//       const iden = JSON.parse(response.body);
//       if (error) {
//         throw new Error(error);
//       } else {
//         // let UserData = {
//         //   email: RESULT.email,
//         //   phone: RESULT.phone,
//         //   username: RESULT.username,
//         //   roles: RESULT.roles,
//         //   pin_id: response.body.pin_id
//         // };
//         let UserData = {
//           ...test,
//           pin_id: iden.pinId,
//         };

//         var data = {
//           api_key:
//             "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
//           phone_number: `+234${phoneNo}`,
//           country_code: "NG",
//         };
//         var options = {
//           method: "GET",
//           url: " https://api.ng.termii.com/api/insight/number/query",
//           headers: {
//             "Content-Type": ["application/json", "application/json"],
//           },
//           body: JSON.stringify(data),
//         };
//         request(options, function (error, response) {
//           if (error) throw new Error(error);
//           var mobileData = JSON.parse(response.body);
//           // var mobile_carrier =
//           //   mobileData.result[0].operatorDetail.operatorName;
//           MODEL.userModel.updateOne(
//             { email },
//             {
//               $set: {
//                 fullname:
//                   RESULT.username.split(" ")[0] +
//                   " " +
//                   RESULT.username.split(" ")[1],
//                 //mobile_carrier: mobile_carrier,
//               },
//             },
//             (res) => {
//               return RESPONSE.status(200).jsonp(UserData);
//             }
//           );
//         });
//       }
//     });
//   } catch (error) {
//     console.log("error occurred sending a token to a user");
//     // create a log for sent out token so it can be retired
//   }
// };

/**
 * common model service exporting
 */
module.exports = commonService;
