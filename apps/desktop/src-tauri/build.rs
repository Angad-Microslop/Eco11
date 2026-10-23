fn main() {
    // Skip windows resource compilation if icon doesn't exist to prevent RC2175 errors
    if std::path::Path::new("icons/icon.ico").exists() {
        tauri_build::build();
    } else {
        // Build without embedding windows resource files
        let mut config = tauri_build::BuildConfig::new();
        config.app_compile_dll(false);
        tauri_build::try_build(config).unwrap_or_default();
    }
}
