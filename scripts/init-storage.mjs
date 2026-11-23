// Cria o bucket da foto de capa (se não existir) e libera a leitura pública dos objetos.
// Uso: npm run storage:init (depois de npm run storage:up). Lê as variáveis S3_* do .env.
import "dotenv/config";
import { CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Defina ${name} no .env (veja .env.example).`);
    process.exit(1);
  }
  return value;
}

const bucket = required("S3_BUCKET");
const client = new S3Client({
  endpoint: required("S3_ENDPOINT"),
  region: required("S3_REGION"),
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: { accessKeyId: required("S3_ACCESS_KEY_ID"), secretAccessKey: required("S3_SECRET_ACCESS_KEY") },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

async function bucketExists() {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

if (!(await bucketExists())) {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`Bucket ${bucket} criado.`);
}

const publicRead = {
  Version: "2012-10-17",
  Statement: [{ Effect: "Allow", Principal: "*", Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${bucket}/*`] }],
};
await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(publicRead) }));
console.log(`Leitura pública liberada em ${bucket}.`);
