import {HttpResponseModel} from "./app/shared/services/chrome/chrome-web-request.model";
import {ChromeStorageKey} from "./app/shared/services/chrome/chrome-storage.model";
import { getLocalStorage } from "./app/shared/services/chrome/chrome-storage.service";

const EXTENSION_TITLE: string = "Sniffer";
const ALARM_NAME: string = 'WakeUpAlarm';
const periodInMinutes: number = 0.0016;
const listenMenuId: string = "ToggleListener";

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes });
});

chrome.alarms.onAlarm.addListener(() => {
    //Keeps extension from going into inactive mode.
});

startUp();

function startUp() {
    if (!chrome.action.onClicked.hasListener(onActionClickedListener)) {
        chrome.action.onClicked.addListener(onActionClickedListener);
    }

    if (!chrome.storage.onChanged.hasListener(onStorageChangedListener)) {
        intializeExtension();
        chrome.storage.onChanged.addListener(onStorageChangedListener);
    }

    if (!chrome.webNavigation.onBeforeNavigate.hasListener(onBeforeNavigateListener)) {
        chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigateListener);
    }

    if (!chrome.webRequest.onResponseStarted.hasListener(onResponseStartedListener)) {
        chrome.webRequest.onResponseStarted.addListener(onResponseStartedListener, { urls: ["<all_urls>"] });
    }

    if (!chrome.contextMenus.onClicked.hasListener(onContextMenuClickedListener)) {
        chrome.contextMenus.onClicked.addListener(onContextMenuClickedListener);
    }
}

function intializeExtension() {
    return getLocalStorage().then((result) => {
        setIcon(result.isListening);
        setBadgeText(result.responses);
        createListeningMenuItem(result.isListening);
    });
}

function onActionClickedListener(_tab: chrome.tabs.Tab) {
    chrome.runtime.openOptionsPage();
}

function onStorageChangedListener(changes: { [key: string]: chrome.storage.StorageChange; }, _areaName: "sync" | "local" | "managed") {
    if (changes && changes[ChromeStorageKey.IsListening]) {
        const isListening: boolean = changes[ChromeStorageKey.IsListening]?.newValue;
        setIcon(isListening);
        updateListeningMenuItem(isListening);
    }

    if (changes && changes[ChromeStorageKey.Responses]) {
        const responses: HttpResponseModel[] = changes[ChromeStorageKey.Responses]?.newValue;
        setBadgeText(responses);
    }
}

function onBeforeNavigateListener(_details: chrome.webNavigation.WebNavigationParentedCallbackDetails) {
    console.log(`Added new Web Navigate Listener ${new Date()}`);
}

function onResponseStartedListener(responseDetails: chrome.webRequest.WebResponseCacheDetails) {
    getLocalStorage().then((storage) => {
        let isListening: boolean = storage.isListening;

        if (isListening) {
            let responses = storage.responses;

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

            if (responses.findIndex(r => r.id === response.id) !== -1) {
                console.log("Dupe");
                return;
            }

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
}

function onContextMenuClickedListener(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    const menuItemId = info.menuItemId;
    if (typeof menuItemId === 'string' && menuItemId === listenMenuId) {
        getLocalStorage().then((result) => {
            return chrome.storage.local.set({ [ChromeStorageKey.IsListening]: !result.isListening});
        });
    }
}

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
        if (responsesLength < 999) {
            text = responsesLength.toString();
        }
        else if (responses.length > 999 && responses.length < 9999) {
            text = `${(responses.length / 1000).toPrecision(2)}k`;
        }
        else if(responses.length > 9999 && responses.length < 99999) {
            text = `${(responses.length / 1000).toPrecision(1)}k`;
        }
        else if(responses.length > 99999 && responses.length < 999999) {
            text = `${Math.round(responses.length/ 1000)}k`;
        }
        else {
            text = `1M+`;
        }
    }
    
    chrome.action.setBadgeText({text});
}

function createListeningMenuItem(isListening: boolean) {
    let menuLabel: string = "Start";

    if (isListening) {
        menuLabel = "Stop"
    }

    chrome.contextMenus.create({
        id: listenMenuId,
        contexts: ["all"],
        title: `${menuLabel} Listening`
    });
}

function updateListeningMenuItem(isListening: boolean) {
    let menuLabel: string = "Start";

    if (isListening) {
        menuLabel = "Stop"
    }

    chrome.contextMenus.update(listenMenuId, {
        contexts: ["all"],
        title: `${menuLabel} Listening`
    });
}

function updateResponses(responses: HttpResponseModel[], response: HttpResponseModel) {
    responses.push(response);

    chrome.storage.local.set({responses: responses}).then(
        () => {
            console.log(`Updated responses.`);
        }
    );
}