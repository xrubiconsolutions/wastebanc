console.log("Service worker loaded");

self.addEventListener("push", e=> {
    const data = e.data.json();
    console.log("Push received");

    self.ServiceWorkerRegistration.showNotification(data.title, {
        body: "Notified by Xrubicon",
        icon: "😎"
    })
});