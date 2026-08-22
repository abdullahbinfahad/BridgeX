import * as WebBrowser from "expo-web-browser";
import NativeApp from "./src/NativeApp";

WebBrowser.maybeCompleteAuthSession();

export default NativeApp;
