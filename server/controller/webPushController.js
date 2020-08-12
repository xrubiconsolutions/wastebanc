const webpush = require("web-push");



let Notification = {};

Notification.subscribe = (req,res)=>{
    const subscription = req.body;
    res.status(201).json({});

    const payload = JSON.stringify({title: "Push Test"});

    //Pass object into sendNotification

    webpush
        .sendNotification(subscription, payload)
        .catch(err => console.error(err));
}


module.exports = Notification