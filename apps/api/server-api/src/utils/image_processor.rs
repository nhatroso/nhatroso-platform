use image::{DynamicImage, ImageFormat};
// use imageproc::threshold::otsu_level;
use anyhow::{Result, Context};
use std::io::Cursor;

pub fn preprocess_for_ocr(image_bytes: &[u8]) -> Result<Vec<u8>> {
    let img = image::load_from_memory(image_bytes)
        .context("Failed to decode image")?;

    let gray_img = img.to_luma8();

    // Otsu automatically finds the optimal threshold value
    let threshold_val = imageproc::contrast::otsu_level(&gray_img);

    let mut thresh_img = gray_img.clone();
    for pixel in thresh_img.pixels_mut() {
        if pixel.0[0] > threshold_val {
            pixel.0[0] = 255;
        } else {
            pixel.0[0] = 0;
        }
    }

    let (width, height) = thresh_img.dimensions();
    let target_width = 800;
    let scale = target_width as f32 / width as f32;
    let target_height = (height as f32 * scale) as u32;

    let resized_img = image::imageops::resize(
        &thresh_img,
        target_width,
        target_height,
        image::imageops::FilterType::Lanczos3,
    );

    let mut buf = Vec::new();
    let mut cursor = Cursor::new(&mut buf);
    DynamicImage::ImageLuma8(resized_img)
        .write_to(&mut cursor, ImageFormat::Jpeg)
        .context("Failed to encode image")?;

    Ok(buf)
}
