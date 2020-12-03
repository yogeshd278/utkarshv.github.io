function getQueryStringValue (key) {  
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}  
const PUSH_SERVICE_CLIENT_ID = getQueryStringValue("clientid");
const PUSH_BROWSER_ID = getQueryStringValue("browserId");
console.log("PUSH_SERVICE_CLIENT_ID", PUSH_SERVICE_CLIENT_ID);
var firebaseConfig = {
    apiKey: "AIzaSyDwQ1l_xlv152z3zsXoCEqVrdy32ZkGtOQ",
    authDomain: "pushservice-de9e2.firebaseapp.com",
    databaseURL: "https://pushservice-de9e2.firebaseio.com",
    projectId: "pushservice-de9e2",
    storageBucket: "pushservice-de9e2.appspot.com",
    messagingSenderId: "53707849923",
    appId: "1:53707849923:web:fd85f9eb2ea64d1c"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.usePublicVapidKey('BH_ct5AA7O07SFVmUTo8Zmv1loWKDSDP--pcQMeFaN0an8-qg5E8pp4o9WwDQelRUKmJ-SgtTNRsZWd625S9G_Y');

navigator.serviceWorker.register('sw.js')
    .then((registration) => {
        messaging.useServiceWorker(registration);
        function requestPermission() {
            Notification.requestPermission().then(function (permission) {
                console.log('permission :: ', permission)
                if (permission === 'granted') {
                    messaging.getToken().then(function (currentToken) {
                        if (currentToken) {
                            sendTokenToServer({
                                clientId: PUSH_SERVICE_CLIENT_ID,
                                token: currentToken,
                                browserId: PUSH_BROWSER_ID
                            })
                        } else {
                            console.log('No Instance ID token available. Request permission to generate one.');
                        }
                    }).catch(function (err) {
                        console.log('An error occurred while retrieving token. ', err);
                    });
                } else {
                    console.log('permission :: ', permission)
                    console.log('Unable to get permission to notify.');
                }
            });
        }

        messaging.onTokenRefresh(function () {
            messaging.getToken().then(function (refreshedToken) {
                sendTokenToServer({
                    clientId: PUSH_SERVICE_CLIENT_ID,
                    token: refreshedToken
                })
            }).catch(function (err) {
                console.log('Unable to retrieve refreshed token ', err);
            });
        });

        messaging.onMessage(function (payload) {
            const { notification: { title, data = {} } } = payload;
            appendHTML(title, data.type)
            console.log('Message received. ', payload);
        });

        function sendTokenToServer({ token, clientId, browserId }) {
            console.log("resquest sent for token", token)            
            const url = 'https://backendapi.engageasap.com/cleverfork/api/v1/subscriber/set-token';
            if (!token || !clientId || !url) return;
            fetch(url, {
                headers: {
                    "Content-Type": "application/json"
                },
                method: 'POST',
                body: JSON.stringify({
                    token: token,
                    containerId: clientId,
                    oldToken: 'placeholder_old_token',
                    browserId
                })
            })
                .then(res => console.log(res));
           
        }

        function appendHTML(text, type = 'a') {
            var wrapper = document.createElement("div");
            let color = '';
            switch (type) {
                case 'a':
                    color = 'red'
                    break;
                case 'b':
                    color = 'blue'
                    break;
                case 'c':
                    color = 'green'
                    break;
                default:
                    color = 'grey'
            }
            const elements = document.getElementsByClassName('push-popup');
            const top = elements.length * 48;
            wrapper.innerHTML = `<div class="push-popup" style="position: absolute; top: ${top}px; right: 0; background-color: ${color}; padding: 10px; border-radius: 9px; box-shadow: 10px 10px 38px -6px rgba(134, 131, 131, 0.75); margin: 10px; z-index: 99999;cursor: pointer;">${text}</div>`;
            wrapper.addEventListener("click", removeHTML, false);
            document.body.appendChild(wrapper);
        }

        function removeHTML(e) {
            const element = e.target;
            element.removeEventListener('click', removeHTML, false)
            element && element.parentNode && element.parentNode.removeChild(element);

            var restOfElements = document.getElementsByClassName('push-popup');
            const length = restOfElements.length;
            for (let i = 0; i < length; i++) {
                restOfElements[i].style.top = `${i * 48}px`;
            }
        }
        requestPermission()
    });
