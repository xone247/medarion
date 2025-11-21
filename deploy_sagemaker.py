#!/usr/bin/env python3
"""
SageMaker Deployment Script for Medarion AI Model
Deploys model from S3 to SageMaker endpoint
"""

import boto3
import json
import time
import sys
import os
from botocore.exceptions import ClientError

# Set AWS credentials if not in environment
if not os.environ.get('AWS_ACCESS_KEY_ID'):
    os.environ['AWS_ACCESS_KEY_ID'] = 'YOUR_AWS_ACCESS_KEY_ID'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'YOUR_AWS_SECRET_ACCESS_KEY'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-2'

# Configuration - GPU Deployment for 7B Model (14GB)
# Optimized for realtime inference with proper GPU instance
CONFIG = {
    "region": "us-east-2",  # Region for GPU deployment (matches S3 bucket region)
    "model_name": "medarion-7b-model-gpu",
    "endpoint_config_name": "medarion-7b-gpu-config",
    "endpoint_name": "medarion-7b-gpu",  # This will be used by the application
    "s3_model_path": "s3://medarion7b-model-2025-ue2/medarion-final-model.tar.gz",  # Using tar.gz format required by SageMaker
    "s3_code_path": "s3://medarion7b-model-2025-ue2/entry-point-code.tar.gz",  # Proper model tar with code/entry_point.py
    "inference_s3_bucket": "medarion7b-model-2025-ue2",  # Bucket where inference.py is stored
    "inference_s3_key": "inference.py",  # Key for inference.py in S3
    "execution_role_name": "MedarionSageMakerExecutionRole",
    "deployment_type": "realtime",  # Realtime GPU for better performance with 7B model
    # Serverless config (unused for realtime)
    "memory_size_mb": 3072,
    "max_concurrency": 5,
    # Realtime GPU config - ml.g5.2xlarge (1 GPU NVIDIA A10G, 8 vCPU, 32GB RAM)
    # This instance type is optimal for 7B models with 14GB memory requirements
    # Provides excellent performance for realtime inference
    "instance_type": "ml.g5.2xlarge",  # GPU instance - will be auto-selected based on quota
    "initial_instance_count": 1,
    # Async inference output path (for fallback)
    "async_output_path": "s3://medarion7b-model-2025-ue2/async-outputs/",
    "async_input_prefix": "async-inputs/",
    # Container image - GPU version with PyTorch 2.0 and CUDA 11.8 (us-east-2)
    "image_uri": "763104351884.dkr.ecr.us-east-2.amazonaws.com/pytorch-inference:2.0.0-gpu-py310-cu118-ubuntu20.04-sagemaker"
}

def get_account_id():
    """Get AWS account ID"""
    sts = boto3.client('sts')
    return sts.get_caller_identity()['Account']

def create_iam_role(iam_client, role_name):
    """Create IAM execution role for SageMaker"""
    account_id = get_account_id()
    
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "sagemaker.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
    
    try:
        # Check if role exists
        iam_client.get_role(RoleName=role_name)
        print(f"✅ IAM role already exists: {role_arn}")
        return role_arn
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchEntity':
            # Create role
            print(f"📝 Creating IAM role: {role_name}...")
            iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description="Execution role for Medarion SageMaker endpoints"
            )
            
            # Attach policies
            print("📎 Attaching policies...")
            iam_client.attach_role_policy(
                RoleName=role_name,
                PolicyArn="arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
            )
            iam_client.attach_role_policy(
                RoleName=role_name,
                PolicyArn="arn:aws:iam::aws:policy/AmazonS3FullAccess"
            )
            
            # Wait a moment for policies to propagate
            import time
            print("⏳ Waiting for policies to propagate...")
            time.sleep(5)
            
            print(f"✅ IAM role created: {role_arn}")
            return role_arn
        else:
            raise

def create_model(sagemaker_client, model_name, role_arn, s3_model_path, image_uri, s3_code_path=None, inference_bucket=None, inference_key=None):
    """Create SageMaker model"""
    try:
        # Check if model exists
        sagemaker_client.describe_model(ModelName=model_name)
        print(f"✅ Model already exists: {model_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            # Create model
            print(f"📝 Creating SageMaker model: {model_name}...")
            
            # Build container config
            # Try standard approach first (inference.py in model zip)
            # This is simpler and more reliable
            print(f"   Using standard approach: inference.py in model zip")
            print(f"   Model data: {s3_model_path}")
            container_config = {
                "Image": image_uri,
                "ModelDataUrl": s3_model_path,
                "Environment": {
                    "SAGEMAKER_PROGRAM": "inference.py"
                }
            }
            
            # Note: If inference.py is not in the model zip, you'll need to:
            # 1. Add inference.py to the model zip, or
            # 2. Use the entry point approach (requires valid entry-point-code.tar.gz)
            
            sagemaker_client.create_model(
                ModelName=model_name,
                ExecutionRoleArn=role_arn,
                PrimaryContainer=container_config
            )
            print(f"✅ Model created: {model_name}")
        else:
            raise

def create_endpoint_config(sagemaker_client, config_name, model_name, deployment_type, config):
    """Create endpoint configuration"""
    try:
        # Check if config exists
        sagemaker_client.describe_endpoint_config(EndpointConfigName=config_name)
        print(f"✅ Endpoint configuration already exists: {config_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            print(f"📝 Creating endpoint configuration: {config_name}...")
            
            if deployment_type == "serverless":
                production_variants = [{
                    "VariantName": "serverless",
                    "ModelName": model_name,
                    "ServerlessConfig": {
                        "MaxConcurrency": config["max_concurrency"],
                        "MemorySizeInMB": config["memory_size_mb"]
                    }
                }]
                sagemaker_client.create_endpoint_config(
                    EndpointConfigName=config_name,
                    ProductionVariants=production_variants
                )
            elif deployment_type == "realtime":
                production_variants = [{
                    "VariantName": "realtime",
                    "ModelName": model_name,
                    "InstanceType": config["instance_type"],
                    "InitialInstanceCount": config["initial_instance_count"]
                    # Note: VolumeSizeInGB is not supported for ml.g5.2xlarge
                }]
                sagemaker_client.create_endpoint_config(
                    EndpointConfigName=config_name,
                    ProductionVariants=production_variants
                )
            else:
                # async inference on GPU
                production_variants = [{
                    "VariantName": "async",
                    "ModelName": model_name,
                    "InstanceType": config["instance_type"],
                    "InitialInstanceCount": config["initial_instance_count"]
                    # Note: VolumeSizeInGB is not supported for ml.g5.2xlarge
                }]
                sagemaker_client.create_endpoint_config(
                    EndpointConfigName=config_name,
                    ProductionVariants=production_variants,
                    AsyncInferenceConfig={
                        "OutputConfig": {
                            "S3OutputPath": config["async_output_path"]
                        }
                    }
                )
            print(f"✅ Endpoint configuration created: {config_name}")
        else:
            raise

def create_endpoint(sagemaker_client, endpoint_name, config_name):
    """Create and deploy endpoint"""
    try:
        # Check if endpoint exists
        response = sagemaker_client.describe_endpoint(EndpointName=endpoint_name)
        status = response['EndpointStatus']
        
        if status == 'InService':
            print(f"✅ Endpoint already exists and is InService: {endpoint_name}")
            return True
        elif status in ['Creating', 'Updating']:
            print(f"⏳ Endpoint is {status}, waiting...")
            wait_for_endpoint(sagemaker_client, endpoint_name)
            return True
        else:
            print(f"⚠️  Endpoint exists but status is: {status}")
            return False
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            # Create endpoint
            print(f"📝 Creating endpoint: {endpoint_name}...")
            sagemaker_client.create_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=config_name
            )
            print(f"✅ Endpoint creation started: {endpoint_name}")
            print("⏳ This will take 5-10 minutes...")
            wait_for_endpoint(sagemaker_client, endpoint_name)
            return True
        else:
            raise

def wait_for_endpoint(sagemaker_client, endpoint_name, max_wait_minutes=20):
    """Wait for endpoint to become InService with progress indicator"""
    print(f"⏳ Waiting for endpoint to be InService...")
    print(f"   This typically takes 5-10 minutes for GPU instances...")
    
    start_time = time.time()
    max_wait_seconds = max_wait_minutes * 60
    last_status = None
    check_count = 0
    
    try:
        from tqdm import tqdm
        pbar = tqdm(total=max_wait_minutes, desc="   Progress", unit="min", initial=0)
    except ImportError:
        pbar = None
    
    while True:
        response = sagemaker_client.describe_endpoint(EndpointName=endpoint_name)
        status = response['EndpointStatus']
        
        elapsed = time.time() - start_time
        elapsed_minutes = elapsed / 60
        
        # Update progress bar
        if pbar:
            pbar.n = min(int(elapsed_minutes), max_wait_minutes)
            pbar.set_postfix(status=status)
            pbar.refresh()
        
        # Print status changes
        if status != last_status:
            if last_status is not None:
                print(f"\n   Status changed: {last_status} → {status}")
            last_status = status
        
        if status == 'InService':
            if pbar:
                pbar.close()
            print(f"\n✅ Endpoint is InService! (took {elapsed_minutes:.1f} minutes)")
            return True
        elif status == 'Failed':
            if pbar:
                pbar.close()
            print(f"\n❌ Endpoint creation failed!")
            if 'FailureReason' in response:
                print(f"   Reason: {response['FailureReason']}")
            print(f"   Check CloudWatch logs: /aws/sagemaker/Endpoints/{endpoint_name}")
            return False
        elif status in ['RollingBack', 'Deleting']:
            if pbar:
                pbar.close()
            print(f"\n❌ Endpoint is {status} - deployment failed")
            return False
        elif elapsed > max_wait_seconds:
            if pbar:
                pbar.close()
            print(f"\n⏰ Timeout waiting for endpoint (>{max_wait_minutes} minutes)")
            print(f"   Current status: {status}")
            return False
        
        # Check every 30 seconds
        time.sleep(30)
        check_count += 1

def test_endpoint_async(sagemaker_runtime, endpoint_name, region, async_bucket, async_input_prefix):
    """Test the endpoint with a simple async request"""
    print(f"🧪 Testing async endpoint: {endpoint_name}...")
    import uuid
    s3 = boto3.client('s3', region_name=region)
    test_key = f"{async_input_prefix.rstrip('/')}/test-{uuid.uuid4().hex}.json"
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "You are Medarion, an expert AI assistant for African healthcare markets."
            },
            {
                "role": "user",
                "content": "What is telemedicine? Answer in one sentence."
            }
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
    # Upload input to S3
    s3.put_object(Bucket=async_bucket, Key=test_key, Body=json.dumps(payload).encode('utf-8'), ContentType='application/json')
    # Invoke async
    try:
        resp = sagemaker_runtime.invoke_endpoint_async(
            EndpointName=endpoint_name,
            InputLocation=f"s3://{async_bucket}/{test_key}",
        )
        output_location = resp.get("OutputLocation")
        if not output_location:
            print("❌ No OutputLocation returned from async invocation")
            return False
        print(f"⏳ Waiting for output at: {output_location}")
        # Parse output location
        assert output_location.startswith("s3://")
        out = output_location[5:]
        out_bucket, out_key = out.split("/", 1)
        # Poll S3 for result
        import time as _time
        for _ in range(60):  # up to ~120s
            try:
                obj = s3.get_object(Bucket=out_bucket, Key=out_key)
                body = obj["Body"].read()
                try:
                    result = json.loads(body.decode("utf-8"))
                except Exception:
                    print("⚠️ Output is not JSON, printing first 200 bytes")
                    print(body[:200])
                    return True
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                print("✅ Async endpoint test successful!")
                print(f"   Response: {content[:120]}...")
                return True
            except s3.exceptions.NoSuchKey:
                pass
            except Exception:
                pass
            _time.sleep(2)
        print("❌ Timed out waiting for async output")
        return False
    except Exception as e:
        print(f"❌ Async invoke failed: {e}")
        return False
def test_endpoint_sync(sagemaker_runtime, endpoint_name):
    """Test realtime endpoint with a simple request - starts with very small test"""
    print(f"🧪 Testing realtime endpoint: {endpoint_name}...")
    
    # Start with a VERY small test to verify basic functionality
    print("   Step 1: Testing with minimal request (max_tokens=5)...")
    small_payload = {
        "messages": [
            {"role": "user", "content": "Hi"}
        ],
        "temperature": 0.7,
        "max_tokens": 5  # Very small to test quickly
    }
    
    try:
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(small_payload)
        )
        result = json.loads(response['Body'].read())
        text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        print("   ✅ Minimal test successful!")
        print(f"   Response: {text[:100]}")
        
        # If minimal test works, try a slightly larger one
        print("\n   Step 2: Testing with slightly larger request (max_tokens=20)...")
        medium_payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello."}
            ],
            "temperature": 0.7,
            "max_tokens": 20
        }
        
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(medium_payload)
        )
        result = json.loads(response['Body'].read())
        text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        print("   ✅ Medium test successful!")
        print(f"   Response: {text[:150]}")
        
        print("\n✅ All endpoint tests passed!")
        return True
        
    except Exception as e:
        error_msg = str(e)
        print(f"   ❌ Test failed: {error_msg}")
        
        # Provide helpful error information
        if 'ModelError' in error_msg or '500' in error_msg:
            print("\n   💡 This indicates the model/inference code has an error")
            print("   Check CloudWatch logs for detailed error messages")
        elif 'ValidationException' in error_msg:
            print("\n   💡 This indicates a request format issue")
        elif 'ThrottlingException' in error_msg:
            print("\n   💡 Endpoint may still be initializing, try again in a minute")
        
        return False

def delete_endpoint(sagemaker_client, endpoint_name):
    """Delete existing endpoint if it exists"""
    try:
        print(f"🗑️  Checking for existing endpoint: {endpoint_name}...")
        response = sagemaker_client.describe_endpoint(EndpointName=endpoint_name)
        status = response['EndpointStatus']
        print(f"   Found endpoint with status: {status}")
        
        if status in ['InService', 'Creating', 'Updating']:
            print(f"   Deleting endpoint: {endpoint_name}...")
            sagemaker_client.delete_endpoint(EndpointName=endpoint_name)
            
            # Wait for deletion to complete
            print("   Waiting for endpoint deletion...")
            waiter = sagemaker_client.get_waiter('endpoint_deleted')
            waiter.wait(EndpointName=endpoint_name, WaiterConfig={'MaxAttempts': 60, 'Delay': 30})
            print(f"   ✅ Endpoint deleted: {endpoint_name}")
        elif status == 'Deleting':
            print(f"   Endpoint is already being deleted, waiting...")
            waiter = sagemaker_client.get_waiter('endpoint_deleted')
            waiter.wait(EndpointName=endpoint_name, WaiterConfig={'MaxAttempts': 60, 'Delay': 30})
            print(f"   ✅ Endpoint deletion complete")
        else:
            print(f"   Endpoint status: {status}, proceeding with deletion...")
            sagemaker_client.delete_endpoint(EndpointName=endpoint_name)
            print(f"   ✅ Deletion initiated")
            
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            print(f"   ✅ No existing endpoint found (this is OK)")
        else:
            print(f"   ⚠️  Error checking endpoint: {e}")
            raise

def delete_endpoint_config(sagemaker_client, config_name):
    """Delete existing endpoint configuration if it exists"""
    try:
        print(f"🗑️  Checking for existing endpoint config: {config_name}...")
        sagemaker_client.describe_endpoint_config(EndpointConfigName=config_name)
        print(f"   Deleting endpoint configuration: {config_name}...")
        sagemaker_client.delete_endpoint_config(EndpointConfigName=config_name)
        print(f"   ✅ Endpoint configuration deleted: {config_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            print(f"   ✅ No existing endpoint config found (this is OK)")
        else:
            print(f"   ⚠️  Error checking endpoint config: {e}")

def delete_model(sagemaker_client, model_name):
    """Delete existing model if it exists"""
    try:
        print(f"🗑️  Checking for existing model: {model_name}...")
        sagemaker_client.describe_model(ModelName=model_name)
        print(f"   Deleting model: {model_name}...")
        sagemaker_client.delete_model(ModelName=model_name)
        print(f"   ✅ Model deleted: {model_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            print(f"   ✅ No existing model found (this is OK)")
        else:
            print(f"   ⚠️  Error checking model: {e}")

def check_and_select_instance(sagemaker_client, region):
    """Check available quotas and select best GPU instance type"""
    print("\n📊 Checking available GPU instance quotas...")
    
    # GPU instances ordered by size/power (largest first for best performance)
    # These are the best options for 7B models
    gpu_instances = [
        'ml.g5.2xlarge',    # 1x NVIDIA A10G, 8 vCPU, 32GB RAM - Best for 7B
        'ml.g5.4xlarge',    # 1x NVIDIA A10G, 16 vCPU, 64GB RAM - Larger
        'ml.g5.8xlarge',    # 1x NVIDIA A10G, 32 vCPU, 128GB RAM - Even larger
        'ml.g5.xlarge',     # 1x NVIDIA A10G, 4 vCPU, 16GB RAM - Smaller
        'ml.g4dn.2xlarge',  # 1x NVIDIA T4, 8 vCPU, 32GB RAM - Older gen
        'ml.p3.2xlarge',    # 1x NVIDIA V100, 8 vCPU, 61GB RAM - Older
    ]
    
    # Try to check quotas, but if it fails, we'll try instances anyway
    available_instances = []
    
    try:
        service_quotas = boto3.client('service-quotas', region_name=region)
        
        for inst_type in gpu_instances:
            try:
                quota_code = f"L-{inst_type.replace('.', '-').upper()}"
                response = service_quotas.get_service_quota(
                    ServiceCode='sagemaker',
                    QuotaCode=quota_code
                )
                quota_value = response['Quota']['Value']
                if quota_value > 0:
                    print(f"   ✅ {inst_type} available (quota: {int(quota_value)})")
                    available_instances.append((inst_type, quota_value))
            except:
                # Quota check failed, but instance might still be available
                print(f"   ⚠️  {inst_type} - quota check failed (will try anyway)")
                available_instances.append((inst_type, 1))  # Assume available
    except Exception as e:
        print(f"   ⚠️  Could not check quotas: {e}")
        print(f"   Will try GPU instances in order of preference")
        # Add all instances as potential options
        for inst_type in gpu_instances:
            available_instances.append((inst_type, 1))
    
    # Select the best available (largest first)
    if available_instances:
        # Sort by instance size (larger first)
        selected = available_instances[0][0]  # Take first (already ordered by size)
        print(f"\n   ✅ Selected: {selected} (GPU - best for 7B models)")
        return selected, 'GPU'
    else:
        # Fallback to default
        print(f"\n   ⚠️  Using default: {CONFIG['instance_type']} (GPU)")
        return CONFIG['instance_type'], 'GPU'

def main():
    """Main deployment function"""
    print("🚀 Medarion SageMaker Deployment Script")
    print("=" * 70)
    print(f"📦 Model: {CONFIG['s3_model_path']}")
    print(f"🌍 Region: {CONFIG['region']}")
    print("=" * 70)
    
    # Check AWS credentials
    import os
    if not os.environ.get('AWS_ACCESS_KEY_ID') and not os.environ.get('AWS_PROFILE'):
        print("⚠️  Warning: AWS credentials not found in environment")
        print("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        print("   Or run: python deploy_sagemaker_with_creds.py")
        print("   Or configure AWS CLI: aws configure")
    
    # Initialize clients
    region = CONFIG["region"]
    iam = boto3.client('iam', region_name=region)
    sagemaker = boto3.client('sagemaker', region_name=region)
    sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
    
    try:
        # Step 0: Select best instance type based on quota
        print("\n📋 Step 0: Selecting Instance Type")
        print("-" * 70)
        selected_instance, instance_category = check_and_select_instance(sagemaker, region)
        CONFIG["instance_type"] = selected_instance
        
        # Update image URI if needed for different GPU instances
        # All g5 instances use the same image, but if we fall back to g4dn or p3, might need different
        if 'g4dn' in selected_instance:
            CONFIG["image_uri"] = "763104351884.dkr.ecr.us-east-2.amazonaws.com/pytorch-inference:2.0.0-gpu-py310-cu118-ubuntu20.04-sagemaker"
        elif 'p3' in selected_instance:
            CONFIG["image_uri"] = "763104351884.dkr.ecr.us-east-2.amazonaws.com/pytorch-inference:2.0.0-gpu-py310-cu118-ubuntu20.04-sagemaker"
        # g5 instances use the default image (already set)
        
        print(f"   💰 Estimated cost: ~$1.00-2.50/hour (realtime)")
        print(f"   🚀 GPU acceleration enabled for smooth AI performance")
        print()
        
        # Step 0.5: Delete existing resources (if any)
        print("📋 Step 0.5: Cleaning up existing resources")
        print("-" * 70)
        delete_endpoint(sagemaker, CONFIG["endpoint_name"])
        delete_endpoint_config(sagemaker, CONFIG["endpoint_config_name"])
        delete_model(sagemaker, CONFIG["model_name"])
        print("   ✅ Cleanup complete\n")
        
        # Step 1: Create IAM role
        print("📋 Step 1: Creating IAM Execution Role")
        print("-" * 70)
        role_arn = create_iam_role(iam, CONFIG["execution_role_name"])
        
        # Step 2: Create model
        print("\n📋 Step 2: Creating SageMaker Model")
        print("-" * 70)
        create_model(
            sagemaker,
            CONFIG["model_name"],
            role_arn,
            CONFIG["s3_model_path"],
            CONFIG["image_uri"],
            CONFIG.get("s3_code_path"),  # Optional entry point code package
            CONFIG.get("inference_s3_bucket"),  # Bucket for inference.py
            CONFIG.get("inference_s3_key")  # Key for inference.py
        )
        
        # Step 3: Create endpoint configuration
        print("\n📋 Step 3: Creating Endpoint Configuration")
        print("-" * 70)
        create_endpoint_config(
            sagemaker,
            CONFIG["endpoint_config_name"],
            CONFIG["model_name"],
            CONFIG["deployment_type"],
            CONFIG
        )
        
        # Step 4: Create and deploy endpoint
        print("\n📋 Step 4: Deploying Endpoint")
        print("-" * 70)
        success = create_endpoint(
            sagemaker,
            CONFIG["endpoint_name"],
            CONFIG["endpoint_config_name"]
        )
        
        if not success:
            print("\n❌ Deployment failed. Check logs above.")
            sys.exit(1)
        
        # Step 5: Test endpoint
        print("\n📋 Step 5: Testing Endpoint")
        print("-" * 70)
        if CONFIG["deployment_type"] == "async":
            test_success = test_endpoint_async(
                sagemaker_runtime,
                CONFIG["endpoint_name"],
                region,
                CONFIG["inference_s3_bucket"],
                CONFIG["async_input_prefix"],
            )
        else:
            test_success = test_endpoint_sync(sagemaker_runtime, CONFIG["endpoint_name"])
        
        if test_success:
            print("\n" + "=" * 70)
            print("🎉 Deployment Complete!")
            print("=" * 70)
            print(f"\n✅ Endpoint Name: {CONFIG['endpoint_name']}")
            print(f"✅ Region: {region}")
            print(f"✅ Instance: {CONFIG['instance_type']} ({instance_category})")
            print(f"✅ Model: {CONFIG['s3_model_path']}")
            print(f"\n📝 Next Steps:")
            print(f"1. Update server/.env file with:")
            print(f"   AI_MODE=cloud")
            print(f"   SAGEMAKER_REGION={region}")
            print(f"   SAGEMAKER_ENDPOINT_NAME={CONFIG['endpoint_name']}")
            print(f"   SAGEMAKER_INFERENCE_MODE=realtime")
            print(f"   AWS_ACCESS_KEY_ID=<your-key>")
            print(f"   AWS_SECRET_ACCESS_KEY=<your-secret>")
            print(f"\n2. Restart your server: cd server && npm run dev")
            print(f"\n3. Test in Admin Dashboard → Data Management → AI Tools")
            print(f"\n4. Test AI chat in the application")
        else:
            print("\n⚠️  Deployment completed but test failed.")
            print("Check CloudWatch logs for details.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
