# Capacitor bridge — jangan di-obfuscate, JS butuh nama aslinya
-keep class com.getcapacitor.** { *; }
-keep class com.kontrakanku.app.** { *; }

# WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX core & appcompat
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }

# Preserve stack trace info untuk crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Jangan hapus annotation yang digunakan runtime
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
