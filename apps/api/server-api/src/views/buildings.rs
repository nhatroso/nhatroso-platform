use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub struct CreateBuildingParams {
    pub name: String,
    pub address: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateBuildingParams {
    pub name: Option<String>,
    pub address: Option<String>,
}
