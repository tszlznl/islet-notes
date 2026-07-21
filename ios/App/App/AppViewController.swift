import Capacitor

@objc(AppViewController)
class AppViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        bridge?.registerPluginInstance(ImageToolsPlugin())
        bridge?.registerPluginInstance(DeviceAuthPlugin())
        bridge?.registerPluginInstance(AttachmentFileCachePlugin())
        bridge?.registerPluginInstance(WebDavHttpPlugin())
        bridge?.registerPluginInstance(VideoToolsPlugin())
        bridge?.registerPluginInstance(MediaPickerPlugin())
        bridge?.registerPluginInstance(FileSharePlugin())
        bridge?.registerPluginInstance(AppStoreMembershipPlugin())
    }
}
