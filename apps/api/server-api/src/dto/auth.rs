use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize)]
pub struct RegisterParams {
    pub email: Option<String>,
    pub phone: String,
    pub name: String,
    pub password: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct LoginParams {
    pub phone: String,
    pub password: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct RefreshParams {
    pub refresh_token: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub refresh_token: String,
    pub id: Uuid,
}
