const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const BRIDGEX_URL = "https://bridgex.abdullahbinfahad.info/?app=mac&build=1";
const allowedHost = "bridgex.abdullahbinfahad.info";

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "BridgeX",
    backgroundColor: "#f7f5ef",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });
  window.webContents.setUserAgent(`${window.webContents.getUserAgent()} BridgeXMac/1`);
  window.webContents.setWindowOpenHandler(({ url }) => {
    const target = new URL(url);
    if (target.hostname === allowedHost) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    const target = new URL(url);
    if (target.hostname !== allowedHost) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
  void window.loadURL(BRIDGEX_URL);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
