package com.hamsterbase.islet;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "MediaPicker")
public class MediaPickerPlugin extends Plugin {
    @PluginMethod
    public void pick(PluginCall call) {
        Intent intent;
        String mediaTypes = call.getString("mediaTypes", "images");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
            if ("images-and-videos".equals(mediaTypes)) {
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "image/*", "video/*" });
            } else {
                intent.setType("image/*");
            }
        } else {
            intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            if ("images-and-videos".equals(mediaTypes)) {
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "image/*", "video/*" });
            } else {
                intent.setType("image/*");
            }
        }
        startActivityForResult(call, intent, "pickResult");
    }

    @ActivityCallback
    private void pickResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("cancel");
            return;
        }
        Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("Picked media uri is missing.");
            return;
        }

        getBridge().execute(() -> {
            try {
                String mimeType = getContext().getContentResolver().getType(uri);
                if (mimeType != null && mimeType.startsWith("video/")) {
                    JSObject payload = new JSObject();
                    payload.put("kind", "video");
                    payload.put("uri", uri.toString());
                    call.resolve(payload);
                    return;
                }

                File output = new File(
                    getContext().getCacheDir(),
                    "islet-picked-image-" + System.nanoTime() + "." + extensionFromMime(mimeType)
                );
                copyUriToFile(uri, output);
                JSObject payload = new JSObject();
                payload.put("kind", "image");
                payload.put("photoPath", output.getAbsolutePath());
                payload.put("mimeType", mimeType != null ? mimeType : "image/jpeg");
                call.resolve(payload);
            } catch (Exception error) {
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    private void copyUriToFile(Uri uri, File output) throws Exception {
        File parent = output.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new IllegalStateException("Failed to create output directory.");
        }
        ContentResolver resolver = getContext().getContentResolver();
        try (InputStream in = resolver.openInputStream(uri); OutputStream out = new FileOutputStream(output)) {
            if (in == null) throw new IllegalStateException("Cannot open picked media.");
            byte[] buffer = new byte[1 << 16];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        }
    }

    private String extensionFromMime(String mimeType) {
        if (mimeType == null || mimeType.isEmpty()) return "jpg";
        String extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
        return extension != null && !extension.isEmpty() ? extension : "jpg";
    }
}
