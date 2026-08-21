import { webview } from '@kit.ArkWeb';

const BRIDGEX_URL: string = 'https://bridgex.abdullahbinfahad.info/?app=harmonyos&build=1';

@Entry
@Component
struct Index {
  private controller: webview.WebviewController = new webview.WebviewController();

  build() {
    Column() {
      Web({ src: BRIDGEX_URL, controller: this.controller })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(false)
        .onlineImageAccess(true)
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F5EF')
  }
}
