import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getS3Config() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return { region, bucket, accessKeyId, secretAccessKey };
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    const config = getS3Config();
    if (!config) throw new Error("AWS S3 not configured");

    _client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return _client;
}

export function isS3Configured(): boolean {
  return getS3Config() !== null;
}

export async function uploadPdf(
  key: string,
  buffer: Buffer,
): Promise<string> {
  const config = getS3Config();
  if (!config) throw new Error("AWS S3 not configured");

  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    }),
  );

  return key;
}
