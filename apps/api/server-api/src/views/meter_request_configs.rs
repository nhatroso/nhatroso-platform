use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfigParams {
    pub day_of_month: i32,
    pub grace_days: i32,
    pub auto_generate: bool,
}
