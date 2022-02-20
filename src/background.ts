import { HttpResponseModel } from "./app/services/http-response.model";

chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.set({ isListening: false, responses: [] });
});

chrome.runtime.onMessage.addListener((isListenting: boolean, sender, sendResponse) => {
  chrome.storage.local.set({ isListening: isListenting }).then(() =>{
    console.log(`Listening to HTTP Requests: ${ isListenting }`);
  });
});

chrome.webRequest.onResponseStarted.addListener((responseDetails) => {
    chrome.storage.local.get(["isListening", "responses"]).then((result)  => {
      let isListening: boolean = result["isListening"];

      if (isListening) {
        let responses = result["responses"];

        if (responses === undefined || responses === undefined) {
          responses = [];
        }

        responses.push(<HttpResponseModel> ({
          id: responseDetails.requestId,
          url: responseDetails.url,
          method: responseDetails.method,
          date: new Date(responseDetails.timeStamp),
          status: responseDetails.statusCode,
          statusText: responseDetails.statusLine,
          tabId: responseDetails.tabId,
          type: responseDetails.type,
          fromCache: responseDetails.fromCache
        }));

        chrome.storage.local.set({ responses: responses }, function() {
          console.log(`Updated ${ responses && responses.length }`);
        });
      }
    });
  },
  { urls: ["<all_urls>"] }
);