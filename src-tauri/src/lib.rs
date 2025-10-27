use tauri_plugin_updater::UpdaterExt;
use std::time::Duration;
use std::sync::OnceLock;
use std::time::SystemTime;

// Global variable to store app start time
static APP_START_TIME: OnceLock<SystemTime> = OnceLock::new();

#[tauri::command]
fn get_app_start_time() -> Result<String, String> {
    APP_START_TIME
        .get()
        .and_then(|start_time| {
            start_time
                .duration_since(SystemTime::UNIX_EPOCH)
                .ok()
                .map(|duration| {
                    // Return milliseconds since UNIX epoch
                    duration.as_millis().to_string()
                })
        })
        .ok_or_else(|| "App start time not initialized".to_string())
}

#[tauri::command]
fn get_app_uptime_seconds() -> Result<f64, String> {
    APP_START_TIME
        .get()
        .and_then(|start_time| {
            SystemTime::now()
                .duration_since(*start_time)
                .ok()
                .map(|duration| duration.as_secs_f64())
        })
        .ok_or_else(|| "App start time not initialized".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize app start time
    APP_START_TIME.get_or_init(|| SystemTime::now());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![get_app_start_time, get_app_uptime_seconds])
        .setup(|app| {
            let handle = app.handle().clone();
            
            // Check for updates on startup
            tauri::async_runtime::spawn(async move {
                update(handle).await.ok();
            });
            
            // Spawn a background task to check for updates every hour
            let handle_periodic = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                periodic_update_check(handle_periodic).await;
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


async fn periodic_update_check(app: tauri::AppHandle) {
    loop {
        // Wait for 1 hour before checking for updates again
        tokio::time::sleep(Duration::from_secs(1 * 60 * 60)).await;
        if let Err(e) = update(app.clone()).await {
            eprintln!("Periodic update check failed: {}", e);
        }
    }
}

async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    println!("download finished");
                },
            )
            .await?;

        println!("update installed");
        app.restart();
    }
    Ok(())
}

