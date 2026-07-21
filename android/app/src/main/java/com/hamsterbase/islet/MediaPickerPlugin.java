package com.hamsterbase.islet;

import android.app.Activity;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
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
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "MediaPicker")
public class MediaPickerPlugin extends Plugin {
    @PluginMethod
    public void pick(PluginCall call) {
        Intent intent;
        String mediaTypes = call.getString("mediaTypes", "images");
        int limit = normalizeLimit(call.getInt("limit", 1));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
            if ("images-and-videos".equals(mediaTypes)) {
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "image/*", "video/*" });
            } else {
                intent.setType("image/*");
            }
            if (limit > 1) {
                intent.putExtra(
                    MediaStore.EXTRA_PICK_IMAGES_MAX,
                    Math.min(limit, MediaStore.getPickImagesMaxLimit())
                );
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
            if (limit > 1) {
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
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
        List<Uri> uris = collectPickedUris(result.getData());
        if (uris.isEmpty()) {
            call.reject("Picked media uri is missing.");
            return;
        }

        getBridge().execute(() -> {
            try {
                JSArray items = new JSArray();
                for (Uri uri : uris) {
                    items.put(buildPickedItem(uri));
                }
                JSObject payload = new JSObject();
                payload.put("items", items);
                call.resolve(payload);
            } catch (Exception error) {
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    private List<Uri> collectPickedUris(Intent data) {
        List<Uri> uris = new ArrayList<>();
        ClipData clipData = data.getClipData();
        if (clipData != null) {
            for (int i = 0; i < clipData.getItemCount(); i++) {
                Uri item = clipData.getItemAt(i).getUri();
                if (item != null) uris.add(item);
            }
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        return uris;
    }

    private JSObject buildPickedItem(Uri uri) throws Exception {
        String mimeType = getContext().getContentResolver().getType(uri);
        JSObject item = new JSObject();
        if (mimeType != null && mimeType.startsWith("video/")) {
            item.put("kind", "video");
            item.put("uri", uri.toString());
            return item;
        }

        File output = new File(
            getContext().getCacheDir(),
            "islet-picked-image-" + System.nanoTime() + "." + extensionFromMime(mimeType)
        );
        copyUriToFile(uri, output);
        item.put("kind", "image");
        item.put("photoPath", output.getAbsolutePath());
        item.put("mimeType", mimeType != null ? mimeType : "image/jpeg");
        return item;
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit < 1) return 1;
        return limit;
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
