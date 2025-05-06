from huggingface_hub import list_repo_files, hf_hub_download, list_models
import subprocess
import os

ORG_NAME = "software-mansion"
DEST_DIR = "downloaded_models"
EXECUTOR_RUNNER_PATH = "./cmake-out/executor_runner"

os.makedirs(DEST_DIR, exist_ok=True)

repos = list_models(author=ORG_NAME)

for repo in repos:
    repo_id = repo.id
    print(f"\n🔍 Checking repository: {repo_id}")

    try:
        files = list_repo_files(repo_id)
    except Exception as e:
        print(f"⚠️  Error listing files in {repo_id}: {e}")
        continue

    pte_files = [f for f in files if f.endswith(".pte")]
    print(f"Found {len(pte_files)} .pte file(s)")

    for pte_file in pte_files:
        try:
            print(f"⬇️  Downloading {pte_file} from {repo_id}")
            local_path = hf_hub_download(repo_id=repo_id, filename=pte_file, cache_dir=DEST_DIR)
            print(f"✅ Downloaded to: {local_path}")

            print(f"🚀 Running executor_runner on {local_path}")
            result = subprocess.run(
                [EXECUTOR_RUNNER_PATH, "--model_path", local_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            print("📤 executor_runner output:")
            print(result.stdout)

            if result.returncode != 0:
                print("❌ executor_runner failed:")
                print(result.stderr)

        except Exception as e:
            print(f"❌ Error processing {pte_file}: {e}")

        finally:
            if os.path.exists(local_path):
                try:
                    os.remove(local_path)
                    print(f"🧹 Removed {local_path}")
                except Exception as cleanup_err:
                    print(f"⚠️  Failed to remove {local_path}: {cleanup_err}")