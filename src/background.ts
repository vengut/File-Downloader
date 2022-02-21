import {HttpResponseModel} from "./app/services/http-response.model";
import tabId = chrome.devtools.inspectedWindow.tabId;

chrome.action.onClicked.addListener((_tab) => {
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(function () {
    chrome.storage.local.set({isListening: false, responses: []})
        .then(() => console.log(`Startup`));
});

chrome.runtime.onMessage.addListener((_toggleHttpListener, _sender, _sendResponse) => {
    chrome.storage.local.get("isListening").then((result) => {
        let isListening: boolean = result["isListening"];
        isListening = !isListening;

        chrome.storage.local.set({isListening: isListening}).then(() => {
            console.log(`Toggled HTTP Request Listener: ${isListening}`);
        });
    });
});
chrome.webNavigation.onBeforeNavigate.addListener(() =>{
    chrome.webRequest.onResponseStarted.addListener((responseDetails) => {
            chrome.storage.local.get(["isListening", "responses"]).then((result) => {
                let isListening: boolean = result["isListening"];

                if (isListening) {
                    let responses = result["responses"];

                    if (responses === undefined || responses === null) {
                        responses = [];
                    }

                    const response: HttpResponseModel = {
                        id: responseDetails.requestId,
                        url: responseDetails.url,
                        method: responseDetails.method,
                        timestamp: responseDetails.timeStamp,
                        status: responseDetails.statusCode,
                        statusText: responseDetails.statusLine,
                        type: responseDetails.type,
                        fromCache: responseDetails.fromCache,
                        tab: ""
                    };

                    if (responseDetails.tabId > 0) {
                        chrome.tabs.get(responseDetails.tabId).then(tab =>{
                                response.tab = tab.title ? tab.title : "Undefined";
                                updateResponses(responses, response);
                            },
                            _err => {
                                response.tab = "Undefined";
                                updateResponses(responses, response);
                            });
                    }
                    else {
                        response.tab = "Undefined";
                        updateResponses(responses, response);
                    }

                }
            });
        },
        {urls: ["<all_urls>"]}
    );
});


function updateResponses(responses: HttpResponseModel[], response: HttpResponseModel) {
    responses = [...responses, response];

    chrome.storage.local.set({responses: responses}, function () {
        console.log(`Updated: ${responses && responses.length}`);
    });
}
