chrome.webRequest.onResponseStarted.addListener((details) => {
    if (details.url && details.url.includes(".mp3")) {
      let link = details.url;

      chrome.storage.sync.get("links", (result) => {
        let links = result['links'];

        if (links === undefined || links === undefined) {
          links = [];
        }

        links.push(link);

        chrome.storage.sync.set({ links: links }, function() {
          console.log(`Updated: ${ JSON.stringify(links) }`);
        });
      });
    }
   
  },
  { urls: ["<all_urls>"] }
);
