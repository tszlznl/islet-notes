import Capacitor
import LocalAuthentication

@objc(DeviceAuthPlugin)
class DeviceAuthPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "DeviceAuthPlugin"
    let jsName = "DeviceAuth"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canAuthenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    // 允许生物识别（Face ID / Touch ID），未录入或多次失败时回退设备密码。
    private static let policy: LAPolicy = .deviceOwnerAuthentication

    @objc func canAuthenticate(_ call: CAPPluginCall) {
        var error: NSError?
        let available = LAContext().canEvaluatePolicy(Self.policy, error: &error)
        call.resolve(["available": available])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        guard let title = call.getString("title"), !title.isEmpty else {
            call.reject("title is required")
            return
        }

        let context = LAContext()
        if let cancelLabel = call.getString("cancelLabel"), !cancelLabel.isEmpty {
            context.localizedCancelTitle = cancelLabel
        }

        var error: NSError?
        guard context.canEvaluatePolicy(Self.policy, error: &error) else {
            call.resolve(["success": false])
            return
        }

        context.evaluatePolicy(Self.policy, localizedReason: title) { success, _ in
            call.resolve(["success": success])
        }
    }
}
