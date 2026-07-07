import Capacitor
import Photos
import PhotosUI
import UIKit
import UniformTypeIdentifiers

@objc(MediaPickerPlugin)
class MediaPickerPlugin: CAPPlugin, CAPBridgedPlugin, PHPickerViewControllerDelegate {
    let identifier = "MediaPickerPlugin"
    let jsName = "MediaPicker"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pick", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func pick(_ call: CAPPluginCall) {
        guard pendingCall == nil else {
            call.reject("Media picker is already open")
            return
        }

        pendingCall = call
        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.selectionLimit = 1
        config.preferredAssetRepresentationMode = .current
        if call.getString("mediaTypes") == "images-and-videos" {
            config.filter = .any(of: [.images, .videos])
        } else {
            config.filter = .images
        }

        DispatchQueue.main.async {
            let picker = PHPickerViewController(configuration: config)
            picker.delegate = self
            self.bridge?.viewController?.present(picker, animated: true)
        }
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let call = pendingCall else { return }
        pendingCall = nil
        guard let result = results.first else {
            call.reject("cancel")
            return
        }

        let provider = result.itemProvider
        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            handleImage(provider: provider, call: call)
            return
        }
        if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            handleVideo(provider: provider, call: call)
            return
        }
        call.reject("Unsupported media type")
    }

    private func handleImage(provider: NSItemProvider, call: CAPPluginCall) {
        provider.loadFileRepresentation(forTypeIdentifier: UTType.image.identifier) { url, error in
            if let error {
                call.reject(error.localizedDescription, nil, error)
                return
            }
            guard let url else {
                call.reject("Picked image file is missing")
                return
            }

            do {
                let still = try self.copyTemporaryFile(url, preferredExtension: self.imageExtension(for: url))
                let photo = try self.prepareUploadImage(from: still)
                self.loadLivePhoto(provider: provider, still: still, photo: photo, call: call)
            } catch {
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    private func handleVideo(provider: NSItemProvider, call: CAPPluginCall) {
        provider.loadFileRepresentation(forTypeIdentifier: UTType.movie.identifier) { url, error in
            if let error {
                call.reject(error.localizedDescription, nil, error)
                return
            }
            guard let url else {
                call.reject("Picked video file is missing")
                return
            }
            do {
                let video = try self.copyTemporaryFile(url, preferredExtension: url.pathExtension.isEmpty ? "mov" : url.pathExtension)
                call.resolve([
                    "kind": "video",
                    "uri": video.path
                ])
            } catch {
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    private func loadLivePhoto(provider: NSItemProvider, still: URL, photo: URL, call: CAPPluginCall) {
        let photoMimeType = imageMimeType(for: photo)
        guard provider.canLoadObject(ofClass: PHLivePhoto.self) else {
            call.resolve([
                "kind": "image",
                "photoPath": photo.path,
                "mimeType": photoMimeType
            ])
            return
        }

        provider.loadObject(ofClass: PHLivePhoto.self) { object, error in
            if let error {
                // Live Photo 导出失败时保留普通图片，不阻塞上传。
                call.resolve([
                    "kind": "image",
                    "photoPath": photo.path,
                    "mimeType": photoMimeType
                ])
                NSLog("Live Photo load failed: \(error.localizedDescription)")
                return
            }
            guard let livePhoto = object as? PHLivePhoto else {
                call.resolve([
                    "kind": "image",
                    "photoPath": photo.path,
                    "mimeType": photoMimeType
                ])
                return
            }

            let resources = PHAssetResource.assetResources(for: livePhoto)
            guard let videoResource = resources.first(where: { $0.type == .pairedVideo }) else {
                call.resolve([
                    "kind": "image",
                    "photoPath": photo.path,
                    "mimeType": photoMimeType
                ])
                return
            }

            let video = self.temporaryFile(extension: "mov")
            PHAssetResourceManager.default().writeData(for: videoResource, toFile: video, options: nil) { error in
                if let error {
                    NSLog("Live Photo video export failed: \(error.localizedDescription)")
                    call.resolve([
                        "kind": "image",
                        "photoPath": photo.path,
                        "mimeType": photoMimeType
                    ])
                    return
                }
                call.resolve([
                    "kind": "image",
                    "photoPath": photo.path,
                    "mimeType": photoMimeType,
                    "livePhoto": [
                        "stillPath": still.path,
                        "stillMimeType": self.imageMimeType(for: still),
                        "videoPath": video.path,
                        "videoMimeType": "video/quicktime"
                    ]
                ])
            }
        }
    }

    private func prepareUploadImage(from source: URL) throws -> URL {
        let mimeType = imageMimeType(for: source)
        if isSupportedUploadImageMime(mimeType) {
            return source
        }
        return try writeDisplayJpeg(from: source)
    }

    private func writeDisplayJpeg(from source: URL) throws -> URL {
        guard let image = UIImage(contentsOfFile: source.path),
              let data = orientationNormalizedJpeg(image, compressionQuality: 0.95) else {
            throw NSError(domain: "MediaPicker", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot decode picked image"])
        }
        let output = temporaryFile(extension: "jpg")
        try data.write(to: output)
        return output
    }

    // UIImage.jpegData 只编码原始像素、不写回 EXIF 方向，竖拍照片会变横；
    // 方向非 .up 时先按方向重绘成正立像素再编码。
    private func orientationNormalizedJpeg(_ image: UIImage, compressionQuality: CGFloat) -> Data? {
        guard image.imageOrientation != .up else {
            return image.jpegData(compressionQuality: compressionQuality)
        }
        let format = UIGraphicsImageRendererFormat.preferred()
        format.scale = image.scale
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: image.size, format: format)
        let upright = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: image.size))
        }
        return upright.jpegData(compressionQuality: compressionQuality)
    }

    private func copyTemporaryFile(_ source: URL, preferredExtension: String) throws -> URL {
        let output = temporaryFile(extension: preferredExtension)
        if FileManager.default.fileExists(atPath: output.path) {
            try FileManager.default.removeItem(at: output)
        }
        try FileManager.default.copyItem(at: source, to: output)
        return output
    }

    private func temporaryFile(extension ext: String) -> URL {
        let cleanExt = ext.isEmpty ? "bin" : ext.lowercased()
        return FileManager.default.temporaryDirectory
            .appendingPathComponent("islet-picked-\(ProcessInfo.processInfo.globallyUniqueString)")
            .appendingPathExtension(cleanExt)
    }

    private func imageExtension(for url: URL) -> String {
        let ext = url.pathExtension.lowercased()
        return ext.isEmpty ? "heic" : ext
    }

    private func isSupportedUploadImageMime(_ mimeType: String) -> Bool {
        switch mimeType {
        case "image/jpeg", "image/png", "image/webp":
            return true
        default:
            return false
        }
    }

    private func imageMimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "heif":
            return "image/heif"
        case "jpg", "jpeg":
            return "image/jpeg"
        case "png":
            return "image/png"
        case "webp":
            return "image/webp"
        default:
            return "image/heic"
        }
    }
}
