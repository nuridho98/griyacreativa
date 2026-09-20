export interface AndroidFile {
  path: string;
  name: string;
  category: 'java' | 'manifest' | 'gradle' | 'layout' | 'values' | 'xml' | 'doc';
  description: string;
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'app/src/main/java/com/waweb/wrapper/MainActivity.java',
    name: 'MainActivity.java',
    category: 'java',
    description: 'Activity utama berisi WebView fullscreen, User-Agent WhatsApp Web, FileChooser, Runtime Permissions, dan Persistent Cookies.',
    content: `package com.waweb.wrapper;

import android.Manifest;
import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Parcelable;
import android.provider.MediaStore;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * MainActivity - WebView Wrapper WhatsApp Web untuk Android 6.0 (API 23+)
 * Didesain khusus agar WhatsApp Web dapat berjalan stabil di Android:
 * 1. User-Agent Chrome Desktop (wajib untuk membuka QR code WA Web tanpa redirect)
 * 2. JavaScript, DOM Storage, Database & Cache aktif
 * 3. Runtime Permissions (CAMERA, RECORD_AUDIO, STORAGE)
 * 4. WebChromeClient onShowFileChooser (kamera & galeri via FileProvider)
 * 5. WebChromeClient onPermissionRequest (WebRTC voice/video call & audio)
 * 6. Persistent Cookies dengan CookieManager.flush()
 * 7. onBackPressed untuk navigasi riwayat WebView
 */
public class MainActivity extends AppCompatActivity {

    public static final String WA_WEB_URL = "https://web.whatsapp.com/";
    
    // User-Agent Desktop Chrome: WhatsApp Web memblokir browser mobile.
    // User-Agent ini membuat WA Web mendeteksi browser sebagai Chrome Desktop.
    public static final String DESKTOP_USER_AGENT = 
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final int FILE_CHOOSER_REQUEST_CODE = 2001;

    private WebView mWebView;
    private ProgressBar mProgressBar;
    
    // File Chooser Callbacks
    private ValueCallback<Uri[]> mFilePathCallback;
    private String mCameraPhotoPath;
    private Uri mCapturedImageURI;

    // Permissions yang dibutuhkan
    private final String[] REQUIRED_PERMISSIONS = new String[]{
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Layar Penuh (Fullscreen) tanpa action bar
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_main);

        mWebView = findViewById(R.id.webView);
        mProgressBar = findViewById(R.id.progressBar);

        // Periksa dan minta runtime permission Android 6 (API 23)
        checkAndRequestPermissions();

        // Inisialisasi WebView dan Konfigurasi Pengaturan
        initWebViewSettings();

        // Muat URL WhatsApp Web
        if (savedInstanceState != null) {
            mWebView.restoreState(savedInstanceState);
        } else {
            mWebView.loadUrl(WA_WEB_URL);
        }
    }

    /**
     * Konfigurasi WebView: JavaScript, DOM Storage, Cookies, User-Agent, dan Clients
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void initWebViewSettings() {
        WebSettings settings = mWebView.getSettings();

        // 1. Aktifkan JavaScript & DOM Storage (Wajib untuk WA Web React App)
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // 2. Dukungan Cache untuk memuat lebih cepat
        settings.setAppCacheEnabled(true);
        settings.setAppCachePath(getApplicationContext().getCacheDir().getAbsolutePath());
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 3. Konfigurasi Viewport dan Zoom
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false); // Sembunyikan tombol zoom overlay

        // 4. Pengaturan Media & Geolocation
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setGeolocationEnabled(true);

        // 5. User-Agent Chrome Desktop agar WA Web menampilkan QR Code
        settings.setUserAgentString(DESKTOP_USER_AGENT);

        // 6. Persistent Cookies (Mencegah Logout Otomatis)
        setupCookieManager();

        // 7. WebViewClient untuk menangani pemuatan URL dan error
        mWebView.setWebViewClient(new CustomWebViewClient());

        // 8. WebChromeClient untuk FileChooser, Permissions WebRTC, dan Progress
        mWebView.setWebChromeClient(new CustomWebChromeClient());

        // Optimasi rendering hardware acceleration
        mWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        mWebView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
    }

    /**
     * Mengatur CookieManager agar cookie sesi WhatsApp Web tersimpan secara permanen
     */
    private void setupCookieManager() {
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(mWebView, true);
        }
        // Sinkronisasi cookie ke disk
        cookieManager.flush();
    }

    /**
     * WebViewClient kustom untuk mengontrol navigasi halaman
     */
    private class CustomWebViewClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            mProgressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            mProgressBar.setVisibility(View.GONE);
            // Simpan cookie ke penyimpanan persisten
            CookieManager.getInstance().flush();
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            // Pastikan URL internal WA Web tetap dibuka di dalam WebView
            if (url.startsWith("https://web.whatsapp.com") || url.startsWith("https://whatsapp.com")) {
                return false;
            }
            // URL eksternal (misal: tel:, mailto:, atau link lain) buka via aplikasi luar
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            // Jika ada masalah koneksi
        }
    }

    /**
     * WebChromeClient untuk:
     * 1. onShowFileChooser (upload gambar/file dari kamera dan galeri)
     * 2. onPermissionRequest (WebRTC request kamera & mikrofon untuk audio/video call)
     * 3. Progress bar update
     */
    private class CustomWebChromeClient extends WebChromeClient {

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            mProgressBar.setProgress(newProgress);
            if (newProgress >= 100) {
                mProgressBar.setVisibility(View.GONE);
            } else {
                mProgressBar.setVisibility(View.VISIBLE);
            }
        }

        // Tangani izin WebRTC (Kamera & Mikrofon untuk Voice Note & Call)
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @TargetApi(Build.VERSION_CODES.LOLLIPOP)
                @Override
                public void run() {
                    // Izinkan izin yang diminta oleh WhatsApp Web
                    request.grant(request.getResources());
                }
            });
        }

        // Menangani input file <input type="file"> pada Android 5.0 (API 21+) & Android 6.0 (API 23)
        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            if (mFilePathCallback != null) {
                mFilePathCallback.onReceiveValue(null);
                mFilePathCallback = null;
            }
            mFilePathCallback = filePathCallback;

            Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
                File photoFile = null;
                try {
                    photoFile = createImageFile();
                    takePictureIntent.putExtra("PhotoPath", mCameraPhotoPath);
                } catch (IOException ex) {
                    Toast.makeText(MainActivity.this, "Gagal membuat berkas foto", Toast.LENGTH_SHORT).show();
                }

                if (photoFile != null) {
                    mCameraPhotoPath = "file:" + photoFile.getAbsolutePath();
                    Uri photoURI = FileProvider.getUriForFile(MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            photoFile);
                    mCapturedImageURI = photoURI;
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                    takePictureIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                } else {
                    takePictureIntent = null;
                }
            }

            // Intent galeri / file dokumen
            Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
            contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
            contentSelectionIntent.setType("*/*");

            Intent[] intentArray;
            if (takePictureIntent != null) {
                intentArray = new Intent[]{takePictureIntent};
            } else {
                intentArray = new Intent[0];
            }

            Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
            chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
            chooserIntent.putExtra(Intent.EXTRA_TITLE, "Pilih Media / Ambil Foto");
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

            startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
            return true;
        }
    }

    /**
     * Membuat berkas sementara untuk foto dari kamera
     */
    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        if (storageDir == null) {
            storageDir = getCacheDir();
        }
        File image = File.createTempFile(imageFileName, ".jpg", storageDir);
        mCameraPhotoPath = image.getAbsolutePath();
        return image;
    }

    /**
     * Menerima hasil pemilihan berkas dari Kamera atau Galeri
     */
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (mFilePathCallback == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }

            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK) {
                if (data == null || data.getData() == null) {
                    // Berasal dari kamera jika data kosong
                    if (mCameraPhotoPath != null) {
                        results = new Uri[]{Uri.parse(mCameraPhotoPath)};
                    } else if (mCapturedImageURI != null) {
                        results = new Uri[]{mCapturedImageURI};
                    }
                } else {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    } else if (data.getClipData() != null) {
                        int numSelected = data.getClipData().getItemCount();
                        results = new Uri[numSelected];
                        for (int i = 0; i < numSelected; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
            }

            mFilePathCallback.onReceiveValue(results);
            mFilePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * Memeriksa dan meminta runtime permissions (Android 6.0 API 23)
     */
    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> listPermissionsNeeded = new ArrayList<>();
            for (String p : REQUIRED_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                    listPermissionsNeeded.add(p);
                }
            }
            if (!listPermissionsNeeded.isEmpty()) {
                ActivityCompat.requestPermissions(this,
                        listPermissionsNeeded.toArray(new String[0]),
                        PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(this, "Izin kamera, mikrofon, dan penyimpanan dibutuhkan agar fitur WhatsApp berfungsi optimal.", Toast.LENGTH_LONG).show();
            }
        }
    }

    /**
     * Navigasi mundur WebView saat tombol Back ditekan
     */
    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Simpan cookies saat aplikasi diminimalkan
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (mWebView != null) {
            mWebView.saveState(outState);
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/waweb/wrapper/SplashActivity.java',
    name: 'SplashActivity.java',
    category: 'java',
    description: 'Splash screen sederhana bertema WhatsApp dengan delay 1500ms dan transisi mulus ke MainActivity.',
    content: `package com.waweb.wrapper;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.Window;
import android.view.WindowManager;

import androidx.appcompat.app.AppCompatActivity;

/**
 * SplashActivity - Tampilan Pembuka Sederhana
 * Menampilkan logo WhatsApp Web dengan transisi otomatis ke MainActivity.
 */
public class SplashActivity extends AppCompatActivity {

    private static final int SPLASH_DELAY_MS = 1500;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Layar Penuh (Fullscreen)
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_splash);

        // Delay sebelum berpindah ke MainActivity
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish(); // Tutup SplashActivity agar tidak bisa kembali ke splash via back
            }
        }, SPLASH_DELAY_MS);
    }
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    description: 'Manifest dengan deklarasi izin kamera, audio, storage, hardware acceleration, dan FileProvider untuk Android 6+.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.waweb.wrapper">

    <!-- Izin Internet dan Jaringan -->
    <uses-permission android:name="android.intent.action.VIEW" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Izin Hardware & Media (Kamera & Audio WebRTC untuk Voice Message/Panggilan) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Izin Penyimpanan (Simpan/Unggah Media di Android 6 API 23) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- Fitur Opsional Kamera (tidak wajib ada autofocus hardware agar bisa di semua tipe device) -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.camera.autofocus"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.microphone"
        android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@style/AppTheme.NoActionBar"
        android:usesCleartextTraffic="true">

        <!-- Splash Activity sebagai Launcher -->
        <activity
            android:name=".SplashActivity"
            android:screenOrientation="portrait"
            android:theme="@style/AppTheme.NoActionBar"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Main Activity dengan WebView Fullscreen -->
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:theme="@style/AppTheme.NoActionBar"
            android:windowSoftInputMode="adjustResize"
            android:exported="false" />

        <!-- FileProvider untuk berbagi file kamera/media secara aman di Android 6+ -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>

</manifest>
`
  },
  {
    path: 'app/build.gradle',
    name: 'build.gradle (Module: app)',
    category: 'gradle',
    description: 'Konfigurasi Gradle modul app dengan minSdk 23 dan targetSdk 28, kompatibel Android 6.0 Marshmallow.',
    content: `plugins {
    id 'com.android.application'
}

android {
    compileSdkVersion 33
    buildToolsVersion "33.0.0"

    defaultConfig {
        applicationId "com.waweb.wrapper"
        // Sesuai syarat: minSdk 23 (Android 6.0 Marshmallow)
        minSdkVersion 23
        // targetSdk 28 (Android 9.0 Pie) untuk menjaga kompatibilitas izin dan menghindari batasan Android terbaru
        targetSdkVersion 28
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.3.1'
    implementation 'com.google.android.material:material:1.4.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.0'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.3'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.4.0'
}
`
  },
  {
    path: 'build.gradle',
    name: 'build.gradle (Project)',
    category: 'gradle',
    description: 'Gradle level proyek dengan Android Gradle Plugin dan repositori Google & MavenCentral.',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`
  },
  {
    path: 'settings.gradle',
    name: 'settings.gradle',
    category: 'gradle',
    description: 'Pengaturan proyek Android Studio yang memuat modul :app.',
    content: `rootProject.name = "WAWebWrapper"
include ':app'
`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    name: 'activity_main.xml',
    category: 'layout',
    description: 'Layout utama berisi WebView fullscreen dan ProgressBar horizontal bergaya WhatsApp.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#111B21">

    <!-- WebView Fullscreen -->
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_alignParentTop="true"
        android:layout_alignParentBottom="true"
        android:layout_alignParentStart="true"
        android:layout_alignParentEnd="true" />

    <!-- Progress Bar Pemuatan Halaman -->
    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:layout_alignParentTop="true"
        android:max="100"
        android:progressDrawable="@drawable/progress_style"
        android:visibility="gone" />

</RelativeLayout>
`
  },
  {
    path: 'app/src/main/res/layout/activity_splash.xml',
    name: 'activity_splash.xml',
    category: 'layout',
    description: 'Layout splash screen elegan bernuansa hijau WhatsApp dengan logo dan loading indicator.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#075E54">

    <!-- Konten Tengah Splash: Logo & Judul -->
    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:gravity="center"
        android:orientation="vertical">

        <!-- Ikon / Gambar WhatsApp -->
        <ImageView
            android:id="@+id/ivSplashLogo"
            android:layout_width="96dp"
            android:layout_height="96dp"
            android:contentDescription="@string/app_name"
            android:src="@drawable/ic_whatsapp_logo" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="18dp"
            android:fontFamily="sans-serif-medium"
            android:text="WhatsApp Web"
            android:textColor="#FFFFFF"
            android:textSize="24sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:fontFamily="sans-serif"
            android:text="WebView Wrapper (API 23)"
            android:textColor="#C8E6C9"
            android:textSize="13sp" />

        <ProgressBar
            android:layout_width="32dp"
            android:layout_height="32dp"
            android:layout_marginTop="28dp"
            android:indeterminateTint="#25D366" />

    </LinearLayout>

    <!-- Footer Copyright / Versi -->
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_alignParentBottom="true"
        android:layout_centerHorizontal="true"
        android:layout_marginBottom="24dp"
        android:fontFamily="sans-serif"
        android:text="Kompatibel Android 6.0 Marshmallow"
        android:textColor="#A5D6A7"
        android:textSize="12sp" />

</RelativeLayout>
`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    category: 'values',
    description: 'String resource untuk nama aplikasi dan pesan teks pendukung.',
    content: `<resources>
    <string name="app_name">WhatsApp Web Wrapper</string>
    <string name="loading">Memuat WhatsApp Web…</string>
    <string name="camera_permission_required">Aplikasi membutuhkan izin kamera untuk mengirim foto dan video.</string>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    name: 'colors.xml',
    category: 'values',
    description: 'Palet warna khas WhatsApp (Teal, Dark Teal, Accent Green, Background Dark).',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#075E54</color>
    <color name="colorPrimaryDark">#054D44</color>
    <color name="colorAccent">#25D366</color>
    <color name="colorBackgroundDark">#111B21</color>
    <color name="colorSurfaceDark">#202C33</color>
    <color name="colorWhite">#FFFFFF</color>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/styles.xml',
    name: 'styles.xml',
    category: 'values',
    description: 'Tema aplikasi Fullscreen NoActionBar untuk memaksimalkan area tampilan WebView.',
    content: `<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <!-- Fullscreen Theme tanpa ActionBar -->
    <style name="AppTheme.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
`
  },
  {
    path: 'app/src/main/res/xml/file_paths.xml',
    name: 'file_paths.xml',
    category: 'xml',
    description: 'Konfigurasi FileProvider aman untuk akses berkas foto/media pada Android 6.0+.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="Android/data/com.waweb.wrapper/files/Pictures" />
    <external-files-path name="external_files" path="." />
    <cache-path name="cache_files" path="." />
</paths>
`
  },
  {
    path: 'app/src/main/res/drawable/progress_style.xml',
    name: 'progress_style.xml',
    category: 'xml',
    description: 'Drawable custom styling untuk progress bar berwarna hijau aksen WhatsApp.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@android:id/background">
        <shape>
            <solid android:color="#1F2C34" />
        </shape>
    </item>
    <item android:id="@android:id/progress">
        <clip>
            <shape>
                <solid android:color="#25D366" />
            </shape>
        </clip>
    </item>
</layer-list>
`
  },
  {
    path: 'app/src/main/res/drawable/ic_whatsapp_logo.xml',
    name: 'ic_whatsapp_logo.xml',
    category: 'xml',
    description: 'Vector drawable logo WhatsApp untuk splash screen dan ikon aplikasi.',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="96dp"
    android:height="96dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#25D366"
      android:pathData="M12.04,2C6.58,2 2.13,6.45 2.13,11.91C2.13,13.66 2.59,15.36 3.45,16.86L2.05,22L7.3,20.62C8.75,21.41 10.38,21.83 12.04,21.83C17.5,21.83 21.95,17.38 21.95,11.92C21.95,9.27 20.92,6.78 19.05,4.91C17.18,3.03 14.69,2 12.04,2M12.05,3.67C14.25,3.67 16.31,4.53 17.87,6.09C19.42,7.65 20.28,9.72 20.28,11.92C20.28,16.46 16.58,20.15 12.04,20.15C10.56,20.15 9.11,19.76 7.85,19L7.55,18.83L4.44,19.65L5.27,16.61L5.09,16.31C4.28,15.03 3.81,13.49 3.81,11.91C3.81,7.37 7.5,3.67 12.05,3.67M8.53,7.33C8.37,7.33 8.1,7.39 7.87,7.64C7.65,7.89 7.02,8.48 7.02,9.68C7.02,10.88 7.89,12.04 8.01,12.2C8.13,12.37 9.71,14.81 12.14,15.86C12.72,16.11 13.17,16.26 13.52,16.37C14.1,16.56 14.63,16.53 15.05,16.47C15.52,16.4 16.49,15.88 16.69,15.31C16.89,14.74 16.89,14.25 16.83,14.15C16.77,14.05 16.61,13.99 16.37,13.87C16.13,13.75 14.95,13.17 14.73,13.09C14.51,13.01 14.35,12.97 14.19,13.21C14.03,13.45 13.57,13.99 13.43,14.15C13.29,14.31 13.15,14.33 12.91,14.21C12.67,14.09 11.89,13.84 10.97,13.02C10.26,12.38 9.77,11.59 9.63,11.35C9.49,11.11 9.62,10.97 9.74,10.86C9.85,10.75 9.99,10.57 10.11,10.43C10.23,10.29 10.27,10.19 10.35,10.03C10.43,9.87 10.39,9.73 10.33,9.61C10.27,9.49 9.81,8.35 9.61,7.88C9.42,7.41 9.22,7.47 9.07,7.46C8.93,7.45 8.77,7.45 8.61,7.45L8.53,7.33Z"/>
</vector>
`
  },
  {
    path: 'README.md',
    name: 'README.md (Panduan Lengkap)',
    category: 'doc',
    description: 'Panduan impor ke Android Studio, kompilasi APK, catatan teknis User-Agent, dan checklist kepatuhan Android 6 (API 23).',
    content: `# WhatsApp Web Wrapper untuk Android 6.0 (API 23)

Aplikasi native Android berbasis Java yang membungkus WhatsApp Web (\`https://web.whatsapp.com/\`) ke dalam WebView layar penuh dengan fitur lengkap untuk kompatibilitas optimal pada perangkat Android lawas (Android 6.0 Marshmallow, API 23) hingga Android modern.

---

## 📋 Fitur & Pemenuhan Syarat

1. **Kompatibilitas SDK:**
   - \`minSdkVersion 23\` (Android 6.0 Marshmallow)
   - \`targetSdkVersion 28\` (Android 9.0 Pie) - Menghindari batasan scoped storage dan kebijakan restriktif Android terbaru.
2. **WebView Fullscreen & Konfigurasi Engine:**
   - \`JavaScript\` aktif (\`setJavaScriptEnabled(true)\`)
   - \`DOM Storage\` aktif (\`setDomStorageEnabled(true)\`)
   - \`Database & AppCache\` aktif
   - Mode layar penuh tanpa ActionBar (\`Theme.NoActionBar\` + \`FLAG_FULLSCREEN\`)
3. **Custom User-Agent:**
   - Dilengkapi User-Agent **Chrome Desktop** (\`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...\`).
   - *Catatan Teknis:* Server WhatsApp Web secara default menolak dan mengalihkan peramban mobile ke \`whatsapp.com\`. Dengan Desktop UA, QR code WhatsApp Web akan tampil dengan sempurna.
4. **Runtime Permissions (Android 6+ API 23):**
   - Penanganan runtime dialog untuk:
     - \`CAMERA\` (kamera)
     - \`RECORD_AUDIO\` (voice note & telepon)
     - \`WRITE_EXTERNAL_STORAGE\` & \`READ_EXTERNAL_STORAGE\` (kirim & simpan foto/file)
   - Penanganan \`WebChromeClient.onPermissionRequest\` untuk WebRTC browser.
5. **WebChromeClient onShowFileChooser:**
   - Mendukung tag \`<input type="file">\` pada WhatsApp Web.
   - Terintegrasi dengan \`FileProvider\` untuk mengambil foto langsung dari Kamera atau memilih berkas dari Galeri / Penyimpanan.
6. **onBackPressed Navigation:**
   - Tombol back fisik/layar memeriksa \`webView.canGoBack()\`. Jika ada riwayat (misal dari chat ke daftar obrolan), WebView akan mundur alih-alih langsung menutup aplikasi.
7. **Persistent Cookies (Anti-Logout):**
   - \`CookieManager.getInstance().setAcceptCookie(true)\`
   - \`CookieManager.getInstance().setAcceptThirdPartyCookies(mWebView, true)\`
   - Pemanggilan \`flush()\` saat \`onPageFinished\` dan \`onPause\` agar sesi login tetap tersimpan di memori lokal bahkan setelah aplikasi ditutup atau HP di-restart.
8. **Splash Screen Sederhana:**
   - \`SplashActivity\` dengan warna khas WhatsApp (\`#075E54\`), logo vektor, dan transisi halus setelah 1.5 detik.

---

## 🚀 Cara Membuka di Android Studio

1. **Unduh Berkas Proyek:**
   - Klik tombol **"Unduh Proyek (.ZIP)"** pada aplikasi ini.
   - Ekstrak berkas ZIP ke folder komputer Anda (misal \`C:\\AndroidProjects\\WAWebWrapper\`).

2. **Buka di Android Studio:**
   - Buka Android Studio (versi Flamingo, Giraffe, Iguana, Koala, atau yang lebih baru).
   - Pilih **File > Open**, lalu arahkan ke folder yang diekstrak.
   - Tunggu Gradle Sync selesai (pastikan koneksi internet aktif untuk mengunduh dependencies).

3. **Jalankan Aplikasi:**
   - Hubungkan HP Android 6.0+ via kabel USB (USB Debugging aktif) atau gunakan Android Virtual Device (AVD).
   - Klik tombol **Run (Segitiga Hijau)** di Android Studio.
`
  }
];
