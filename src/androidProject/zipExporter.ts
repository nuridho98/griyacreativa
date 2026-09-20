import JSZip from 'jszip';
import { ANDROID_FILES } from './projectData';

export async function generateAndroidProjectZip(
  targetSdk: number = 28,
  userAgentMode: 'desktop' | 'mobile' = 'desktop'
): Promise<Blob> {
  const zip = new JSZip();

  // Add standard Gradle wrapper files structure or configs
  zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
`);

  zip.file('gradle/wrapper/gradle-wrapper.properties', `#Wed Sep 19 19:00:00 UTC 2026
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-7.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

  zip.file('app/proguard-rules.pro', `# Proguard rules for WebView and AndroidX
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class android.webkit.** { *; }
`);

  for (const file of ANDROID_FILES) {
    let fileContent = file.content;
    
    // Dynamic replacement if user customized targetSdk or user-agent
    if (file.path === 'app/build.gradle') {
      fileContent = fileContent.replace(/targetSdkVersion \d+/, `targetSdkVersion ${targetSdk}`);
    }

    if (file.path === 'app/src/main/java/com/waweb/wrapper/MainActivity.java' && userAgentMode === 'mobile') {
      fileContent = fileContent.replace(
        /public static final String DESKTOP_USER_AGENT =[^;]+;/,
        `public static final String DESKTOP_USER_AGENT = \n            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";`
      );
    }

    zip.file(file.path, fileContent);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  return content;
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
