package com.hamsterbase.islet;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@CapacitorPlugin(name = "FileShare")
public class FileSharePlugin extends Plugin {
    @PluginMethod
    public void shareFile(PluginCall call) {
        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String path = call.getString("path");
        String data = call.getString("data");
        if (filename == null || filename.isEmpty()) {
            call.reject("filename is required");
            return;
        }
        if ((path == null) == (data == null)) {
            call.reject("Exactly one of path or data is required.");
            return;
        }

        getBridge().execute(() -> {
            try {
                File target = prepareShareFile(safeFilename(filename), path, data);
                Uri uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    target
                );
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType(mimeType);
                intent.putExtra(Intent.EXTRA_STREAM, uri);
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.setClipData(ClipData.newUri(getContext().getContentResolver(), filename, uri));
                getActivity().runOnUiThread(() -> {
                    try {
                        getActivity().startActivity(Intent.createChooser(intent, filename));
                        call.resolve();
                    } catch (Exception error) {
                        call.reject(error.getMessage(), (String) null, error);
                    }
                });
            } catch (Exception error) {
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    private File prepareShareFile(String filename, String path, String data) throws Exception {
        File dir = new File(getContext().getCacheDir(), "islet-share");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Failed to create share directory.");
        }
        File target = new File(dir, filename);
        if (data != null) {
            byte[] payload = Base64.decode(data, Base64.DEFAULT);
            AttachmentFileCache.writeAtomically(target, out -> out.write(payload));
            return target;
        }
        File source = new File(path);
        if (!source.isFile()) {
            throw new IOException("Source file not found.");
        }
        AttachmentFileCache.writeAtomically(target, out -> {
            try (InputStream in = new FileInputStream(source)) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
            }
        });
        return target;
    }

    private String safeFilename(String filename) {
        String safe = filename.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]+", "_").trim();
        return safe.isEmpty() ? "islet-share.bin" : safe;
    }
}
