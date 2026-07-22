use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::MacosLauncher;

#[tauri::command]
fn show_panel(app: AppHandle, tab: String) -> Result<(), String> {
    if let Some(panel) = app.get_webview_window("panel") {
        panel.show().map_err(|error| error.to_string())?;
        panel.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }

    let safe_tab = if tab == "settings" { "settings" } else { "profile" };
    let url = format!("index.html?view=panel&tab={safe_tab}");
    WebviewWindowBuilder::new(&app, "panel", WebviewUrl::App(url.into()))
        .title("Panda Island · 花花的小岛")
        .inner_size(520.0, 680.0)
        .min_inner_size(440.0, 560.0)
        .center()
        .build()
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "显示花花", true, None::<&str>)?;
    let profile = MenuItem::with_id(app, "profile", "查看资料", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "隐藏桌宠", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出 Panda Island", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &profile, &settings, &hide, &quit])?;

    let mut builder = TrayIconBuilder::with_id("panda-island-tray")
        .tooltip("Panda Island · 花花")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("pet") {
                    let _ = window.show();
                }
            }
            "profile" | "settings" => {
                let _ = show_panel(app.clone(), event.id.as_ref().to_string());
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("pet") {
                    let _ = window.hide();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_panel, quit_app])
        .run(tauri::generate_context!())
        .expect("Panda Island 启动失败");
}
