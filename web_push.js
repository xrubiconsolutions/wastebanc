const webpush = require("web-push");


const publicVapidKey = "BKyWinUx28cZXIHN8cPnvHjC45sgURVTpBZaTJBU7MbQuWYHYZmRocZXHv9Nz2N9qeD2c3RiLLKXMT9rX4aeYp4"


const privatePublicKey = "GOnXfuwDvy1xW6-ChfyFi21V7mxQ20f557NtmHwMjv8"

// check service worker

webpush.setVapidDetails("mailto:test@test.com", publicVapidKey, privatePublicKey);

if("serviceWorker" in navigator){
    send().catch(eer=>console.error(err))
}


//Register the service worker, Register , Push, Send Push
async function send(){
    console.log("Registering service worker ...");
    const register = await navigator.serviceWorker.register('/worker.js', {
        scope: "/"
    });
    console.log("Worker registered ...");

    //Register push

    console.log("Registering Push ...")
    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });  

    console.log("Push registered")


    //Send push notification

    console.log("Sending push notification ...")

    await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "content-type": "application/json"
        }
    })

    console.log("Push sent ...")

}


function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }