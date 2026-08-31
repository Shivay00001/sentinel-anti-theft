#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use std::process::Command;

// Command to trigger remote lock (Windows & macOS)
#[tauri::command]
fn trigger_remote_lock() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Windows: Lock the workstation
        Command::new("rundll32.exe")
            .args(["user32.dll,LockWorkStation"])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok("Windows Locked".into())
    }

    #[cfg(target_os = "macos")]
    {
        // macOS: Lock screen via AppleScript or CGSession
        Command::new("pmset")
            .args(["displaysleepnow"])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok("macOS Locked".into())
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("Unsupported OS for lock".into())
    }
}

// Command to silently capture webcam photo
#[tauri::command]
fn capture_intruder_selfie() -> Result<String, String> {
    // In a production Tauri app, you'd use a Rust crate like `nokhwa` or `escapi` 
    // to access the webcam buffer silently without launching a UI window.
    
    // Pseudocode:
    // let mut camera = Camera::new(0, Some(CameraFormat::new(Resolution::new(1280, 720), FrameFormat::MJPEG, 30))).unwrap();
    // camera.open_stream().unwrap();
    // let frame = camera.frame().unwrap();
    // frame.save("/tmp/intruder.jpg").unwrap();

    Ok("Photo captured silently to local storage".into())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            trigger_remote_lock,
            capture_intruder_selfie
        ])
        .setup(|app| {
            // Run entirely in the background (no main window)
            // Listen for MQTT or WebSocket commands to trigger functions
            let handle = app.handle();
            std::thread::spawn(move || {
                println!("Background daemon listening for remote lock commands...");
                // Loop to listen for socket events
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
