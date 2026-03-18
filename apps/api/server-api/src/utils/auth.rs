use loco_rs::prelude::*;
use loco_rs::controller::extractor::auth::JWT;
use uuid::Uuid;

pub fn get_user_id(auth: &JWT) -> Result<Uuid> {
    Uuid::parse_str(&auth.claims.pid)
        .map_err(|_| Error::BadRequest("invalid user id".to_string()))
}
