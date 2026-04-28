/**
 * Uploads a file to S3 using a pre-signed PUT URL.
 * @param uri Local file URI
 * @param presignedUrl The PUT URL provided by the backend
 */
export async function uploadToS3(
  uri: string,
  presignedUrl: string,
): Promise<void> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`S3 upload failed: ${uploadResponse.status} ${errorText}`);
  }
}
