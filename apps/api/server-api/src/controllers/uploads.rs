use loco_rs::prelude::*;
use axum::{
    extract::Multipart,
    http::StatusCode,
};
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

use crate::utils::error::error_response;

pub async fn post_upload(
    _ctx: State<AppContext>,
    mut multipart: Multipart,
) -> Result<Response> {
    if let Some(field) = multipart.next_field().await.map_err(|e| Error::BadRequest(e.to_string()))? {
        let file_name = field.file_name().unwrap_or("upload.jpg").to_string();
        let extension = Path::new(&file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");

        let new_file_name = format!("{}.{}", Uuid::new_v4(), extension);
        let upload_dir = "static/uploads";

        // Ensure directory exists
        if let Err(e) = fs::create_dir_all(upload_dir).await {
            return error_response(&format!("UPLOAD_DIR_CREATE_FAILED: {}", e), StatusCode::INTERNAL_SERVER_ERROR);
        }

        let path = Path::new(upload_dir).join(&new_file_name);
        let data = match field.bytes().await {
            Ok(d) => d,
            Err(e) => return error_response(&format!("UPLOAD_READ_FAILED: {}", e), StatusCode::BAD_REQUEST),
        };

        if let Err(e) = fs::write(&path, data).await {
            return error_response(&format!("UPLOAD_WRITE_FAILED: {}", e), StatusCode::INTERNAL_SERVER_ERROR);
        }

        let url = format!("/static/uploads/{}", new_file_name);

        return format::json(serde_json::json!({
            "url": url
        }));
    }

    error_response("NO_FILE_UPLOADED", StatusCode::BAD_REQUEST)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/v1/uploads")
        .add("/", post(post_upload))
}
