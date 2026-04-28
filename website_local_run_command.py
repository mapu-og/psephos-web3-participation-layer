from pathlib import Path
import subprocess
import sys


def main() -> int:
    repo_root = Path(__file__).resolve().parent
    frontend_dir = repo_root / "alchemy-final" / "frontend"

    if not frontend_dir.exists():
        print(f"Frontend directory not found: {frontend_dir}", file=sys.stderr)
        return 1

    print(f"Starting Next.js dev server in: {frontend_dir}")
    print("Open http://localhost:3000/create to inspect the create flow directly.")
    print("Keep this terminal open; save changes and Next.js will usually reload automatically.\n")

    try:
        subprocess.run(["npm", "run", "dev"], cwd=frontend_dir, check=True)
    except KeyboardInterrupt:
        print("\nDev server stopped.")
        return 0
    except subprocess.CalledProcessError as exc:
        print(f"\nDev server exited with code {exc.returncode}.", file=sys.stderr)
        return exc.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
