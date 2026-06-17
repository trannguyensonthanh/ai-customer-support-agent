import subprocess
import sys

MODELS = [
    "qwen3:14b",
    "nomic-embed-text",
]

def run(cmd):
    print(f"\n> {' '.join(cmd)}")
    result = subprocess.run(cmd, text=True)
    if result.returncode != 0:
        sys.exit(result.returncode)

def main():
    print("Checking Ollama...")

    try:
        subprocess.run(
            ["ollama", "--version"],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        print("ERROR: Chưa cài Ollama hoặc Ollama chưa có trong PATH.")
        print("Cài Ollama trước rồi chạy lại.")
        sys.exit(1)
    except subprocess.CalledProcessError:
        print("ERROR: Không kiểm tra được Ollama.")
        sys.exit(1)

    for model in MODELS:
        run(["ollama", "pull", model])

    print("\nOK — đã tải xong model:")
    for model in MODELS:
        print(f"- {model}")

if __name__ == "__main__":
    main()