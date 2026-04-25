use loco_rs::cli;
use migration::Migrator;
use server_api::app::App;

#[tokio::main]
async fn main() -> loco_rs::Result<()> {
    // Manually force global initialization of dot env vars BEFORE Loco CLI builder consumes YAML
    let _ = dotenvy::dotenv().ok();

    cli::main::<App, Migrator>().await
}
