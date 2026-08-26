const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const appUrl = process.env.BRIDGEX_WEB_URL || "http://localhost:3000";
let mainWindow;

function isAllowedNavigation(url) {
  try {
    const destination = new URL(url);
    const configured = new URL(appUrl);
    return destination.origin === configured.origin || destination.protocol === "mailto:";
  } catch { return false; }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1000,
    minHeight: 680,
    backgroundColor: "#f7f5ef",
    title: "BridgeX",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
      preload: path.join(__dirname, "preload.cjs")
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url)) mainWindow.loadURL(url);
    else void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => { if (!isAllowedNavigation(url)) { event.preventDefault(); void shell.openExternal(url); } });
  mainWindow.loadURL(appUrl);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
