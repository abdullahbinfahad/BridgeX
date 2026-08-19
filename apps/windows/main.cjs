const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const BRIDGEX_URL = "https://bridgex.abdullahbinfahad.info/";

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: "#f7f5ef",
    title: "BridgeX",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });
  window.loadURL(BRIDGEX_URL);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://bridgex.abdullahbinfahad.info/") || url.startsWith("https://expo.dev/")) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
