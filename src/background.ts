import {HttpResponseModel} from "./app/shared/services/chrome/chrome-web-request.model";
import {ChromeStorageKey} from "./app/shared/services/chrome/chrome-storage.model";

const EXTENSION_TITLE: string = "Sniffer";

chrome.action.onClicked.addListener((_tab) => {
    chrome.runtime.openOptionsPage();
});

chrome.storage.local.get([ChromeStorageKey.IsListening, ChromeStorageKey.Responses]).then((result) => {
    let isListening: boolean = result[ChromeStorageKey.IsListening];
    setIcon(isListening);
    
    let responses = result[ChromeStorageKey.Responses];
    setBadgeText(responses);
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes && changes[ChromeStorageKey.IsListening]) {
        const isListening: boolean = changes[ChromeStorageKey.IsListening]?.newValue;
        setIcon(isListening);
    }

    if (changes && changes[ChromeStorageKey.Responses]) {
        const responses: HttpResponseModel[] = changes[ChromeStorageKey.Responses]?.newValue;
        setBadgeText(responses);
    }
})

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
                                if (!tab.title?.includes(EXTENSION_TITLE)) {
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

function setIcon(isListening: boolean) {
    if (isListening) {
        chrome.action.setIcon({ path: 'snifferActive.png' });
        chrome.action.setBadgeBackgroundColor({ color: "green" });
    }
    else {
        chrome.action.setIcon({ path: 'sniffer.png'});
        chrome.action.setBadgeBackgroundColor({ color: "red" });
    }
}

function setBadgeText(responses : HttpResponseModel[]) {
    const responsesLength = responses && responses.length;

    let text = ``;
    if (responsesLength > 0) {
        if (responsesLength > 999) {
            text = `999+`
        }
        else {
            text = responsesLength.toString();
        }
    }
    
    chrome.action.setBadgeText({text});
}

function updateResponses(responses: HttpResponseModel[], response: HttpResponseModel) {
    if (responses.findIndex(r => r.id === response.id) === -1) {
        responses = [...responses, response];

        chrome.storage.local.set({responses: responses}).then(
            () => {
                console.log(`Updated responses.`);
            }
        );
    }
}
