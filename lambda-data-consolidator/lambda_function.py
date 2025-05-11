import boto3
import pandas as pd
from io import BytesIO

bucket_name = "gargash-hackathon"
input_keys = {
    "availability": "availability.csv",
    "specs": "specs.csv",
    "pricing": "pricing.csv",
    "campaigns": "campaigns.csv"
}
output_key = "inventory.csv"

def read_csv_from_s3(s3_client, bucket, key):
    try:
        print(f"📥 Reading {key} from S3...")
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        return pd.read_csv(obj['Body'])
    except Exception as e:
        print(f"❌ Failed to read {key}: {e}")
        return None

def merge_and_upload_inventory():
    s3 = boto3.client("s3")

    availability_df = read_csv_from_s3(s3, bucket_name, input_keys["availability"])
    specs_df = read_csv_from_s3(s3, bucket_name, input_keys["specs"])
    pricing_df = read_csv_from_s3(s3, bucket_name, input_keys["pricing"])
    campaigns_df = read_csv_from_s3(s3, bucket_name, input_keys["campaigns"])

    if any(df is None for df in [availability_df, specs_df, pricing_df, campaigns_df]):
        print("❌ One or more files failed to load. Exiting.")
        return {
            "statusCode": 500,
            "body": "Failed to load one or more source files."
        }

    print("🔄 Merging all files on VIN...")
    merged_df = availability_df.merge(specs_df, on="VIN", how="left") \
                               .merge(pricing_df, on="VIN", how="left") \
                               .merge(campaigns_df, on="VIN", how="left")
    print(f"✅ Merge complete. Final record count: {len(merged_df)}")

    csv_buffer = BytesIO()
    merged_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    print(f"📤 Uploading merged file to s3://{bucket_name}/{output_key}")
    s3.put_object(Bucket=bucket_name, Key=output_key, Body=csv_buffer.getvalue())

    return {
        "statusCode": 200,
        "body": f"Merged inventory uploaded to {bucket_name}/{output_key} with {len(merged_df)} records"
    }

# Lambda entry point
def lambda_handler(event, context):
    return merge_and_upload_inventory()
