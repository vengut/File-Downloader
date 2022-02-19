let clearButton = document.getElementById("clear");

clearButton.addEventListener("click", async () => {
  chrome.storage.sync.set({ links: [] }, function() {
    console.log("Cleared");
  });
});
