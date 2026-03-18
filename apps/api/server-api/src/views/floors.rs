use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub struct CreateFloorParams {
    pub identifier: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateFloorParams {
    pub identifier: Option<String>,
}
