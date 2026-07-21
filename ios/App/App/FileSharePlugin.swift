import Capacitor
import Foundation
import UIKit

@objc(FileSharePlugin)
class FileSharePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "FileSharePlugin"
    let jsName = "FileShare"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "shareFile", returnType: CAPPluginReturnPromise)
    ]

    @objc func shareFile(_ call: CAPPluginCall) {
        guard let filename = call.getString("filename"), !filename.isEmpty else {
            call.reject("filename is required")
            return
        }
        let path = call.getString("path")
        let data = call.getString("data")
        guard (path == nil) != (data == nil) else {
            call.reject("Exactly one of path or data is required.")
            return
        }

        DispatchQueue.global(qos: .utility).async {
            do {
                let target = try self.prepareShareFile(filename: filename, path: path, data: data)
                DispatchQueue.main.async {
                    self.presentShareSheet(file: target, filename: filename, call: call)
                }
            } catch {
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    private func prepareShareFile(filename: String, path: String?, data: String?) throws -> URL {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("islet-share", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let target = dir.appendingPathComponent(safeFilename(filename))
        let temp = dir.appendingPathComponent("\(target.lastPathComponent).\(ProcessInfo.processInfo.globallyUniqueString).tmp")
        if let data {
            guard let payload = Data(base64Encoded: data, options: .ignoreUnknownCharacters) else {
                throw NSError(domain: "FileShare", code: 1, userInfo: [NSLocalizedDescriptionKey: "data is not valid base64."])
            }
            try payload.write(to: temp)
        } else if let path {
            let source = URL(fileURLWithPath: path)
            guard FileManager.default.fileExists(atPath: source.path) else {
                throw NSError(domain: "FileShare", code: 2, userInfo: [NSLocalizedDescriptionKey: "Source file not found."])
            }
            try FileManager.default.copyItem(at: source, to: temp)
        }
        if FileManager.default.fileExists(atPath: target.path) {
            try FileManager.default.removeItem(at: target)
        }
        try FileManager.default.moveItem(at: temp, to: target)
        return target
    }

    private func presentShareSheet(file: URL, filename: String, call: CAPPluginCall) {
        guard let viewController = bridge?.viewController else {
            call.reject("Unable to present share sheet.")
            return
        }
        let controller = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        controller.popoverPresentationController?.sourceView = viewController.view
        viewController.present(controller, animated: true) {
            call.resolve()
        }
    }

    private func safeFilename(_ filename: String) -> String {
        let illegal = CharacterSet(charactersIn: "\\/:*?\"<>|").union(.controlCharacters)
        let safe = filename.unicodeScalars.map { illegal.contains($0) ? "_" : String($0) }.joined().trimmingCharacters(in: .whitespacesAndNewlines)
        return safe.isEmpty ? "islet-share.bin" : safe
    }
}
