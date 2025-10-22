use tauri_plugin_updater::UpdaterExt;
use std::time::Duration;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
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

