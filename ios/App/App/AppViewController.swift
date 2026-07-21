import Capacitor

@objc(AppViewController)
class AppViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        bridge?.registerPluginInstance(ImageToolsPlugin())
        bridge?.registerPluginInstance(AttachmentFileCachePlugin())
        bridge?.registerPluginInstance(WebDavHttpPlugin())
        bridge?.registerPluginInstance(VideoToolsPlugin())
        bridge?.registerPluginInstance(MediaPickerPlugin())
        bridge?.registerPluginInstance(FileSharePlugin())
    }
}
