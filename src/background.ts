import {HttpResponseModel} from "./app/shared/services/chrome/chrome-web-request.model";
import {ChromeStorageKey} from "./app/shared/services/chrome/chrome-storage.model";

const EXTENSION_TITLE: string = "Sniffer";

chrome.action.onClicked.addListener((_tab) => {
    chrome.runtime.openOptionsPage();
});

chrome.webNavigation.onBeforeNavigate.addListener(() =>{
    chrome.webRequest.onResponseStarted.addListener((responseDetails) => {
            chrome.storage.local.get([ChromeStorageKey.IsListening, ChromeStorageKey.Responses]).then((result) => {
                let isListening: boolean = result[ChromeStorageKey.IsListening];

                if (isListening) {
                    let responses = result[ChromeStorageKey.Responses];

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
                        chrome.tabs.get(responseDetails.tabId).then(tab => {
                                if (tab.title !== EXTENSION_TITLE) {
                                    response.tab = tab.title ? tab.title : "Undefined";
                                    updateResponses(responses, response);
                                }
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

    chrome.storage.local.set({responses: responses}).then(
        () => {
            console.log(`Updated responses.`);
        }
    );
}
