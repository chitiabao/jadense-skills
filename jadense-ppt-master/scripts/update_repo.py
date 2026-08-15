#!/usr/bin/env python3
"""Jadense PPT Master - Derivative Repository Updater

Pull only from the Jadense derivative repository and sync Python dependencies
when the Skill's effective requirements include tree changes. Refuse any
checkout whose repository identity cannot be proven.

Usage:
    python3 scripts/update_repo.py
    python3 scripts/update_repo.py --skip-pip

Examples:
    python3 /path/to/jadense-ppt-master/scripts/update_repo.py
    python3 /path/to/jadense-ppt-master/scripts/update_repo.py --skip-pip

Dependencies:
    None (standard library only)
"""

from __future__ import annotations

import argparse
import hashlib
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

from console_encoding import configure_utf8_stdio

configure_utf8_stdio()


TOOLS_DIR = Path(__file__).resolve().parent
SKILL_DIR = TOOLS_DIR.parent
REPO_ROOT = SKILL_DIR.parent
REQUIREMENTS_FILE = SKILL_DIR / "requirements.txt"
DERIVATIVE_REPOSITORY = "https://github.com/chitiabao/jadense-skills"
_ALLOWED_ORIGIN_URLS = frozenset(
    {
        DERIVATIVE_REPOSITORY,
        f"{DERIVATIVE_REPOSITORY}.git",
        "git@github.com:chitiabao/jadense-skills.git",
        "ssh://git@github.com/chitiabao/jadense-skills.git",
    }
)


def non_git_checkout_message() -> str:
    return f"""This copy of Jadense PPT Master is not the expected Git checkout, so it cannot be updated automatically.

Repository path:
  {REPO_ROOT}

If you installed with Download ZIP:
  1. Download the latest ZIP from {DERIVATIVE_REPOSITORY}.
  2. Unzip it into a new folder.
  3. Copy only your local configuration and generated projects into the new folder.
  4. Run: pip install -r jadense-ppt-master/requirements.txt

If you want one-command updates next time, install with Git clone:
  git clone {DERIVATIVE_REPOSITORY}.git

If you installed through a skill marketplace, update or reinstall through the
same marketplace / skills tool."""


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Pull the Jadense derivative repository and sync Python "
            "dependencies only when this Skill's requirements include tree changes."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--skip-pip",
        action="store_true",
        help="Skip Python dependency sync even if the requirements include tree changed.",
    )
    return parser.parse_args(argv)


def print_status(message: str = "") -> None:
    """Print progress/status messages to stderr."""
    print(message, file=sys.stderr)


def run_command(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=REPO_ROOT,
        check=check,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def _requirement_includes(path: Path, content: str) -> list[Path]:
    """Resolve local -r/--requirement includes relative to their owning file."""
    includes: list[Path] = []
    for raw_line in content.splitlines():
        try:
            tokens = shlex.split(raw_line, comments=True, posix=True)
        except ValueError:
            continue
        if not tokens:
            continue

        option = tokens[0]
        include_value: str | None = None
        if option in {"-r", "--requirement"}:
            if len(tokens) >= 2:
                include_value = tokens[1]
        elif option.startswith("--requirement="):
            include_value = option.partition("=")[2]
        elif option.startswith("-r") and len(option) > 2:
            include_value = option[2:].lstrip("=")

        if not include_value:
            continue
        include_path = Path(include_value)
        if not include_path.is_absolute():
            include_path = path.parent / include_path
        includes.append(include_path)
    return includes


def requirements_digest(path: Path) -> str | None:
    """Hash one requirements file and its recursive local include closure."""
    if not path.exists():
        return None

    digest = hashlib.sha256()
    visited: set[Path] = set()

    def visit(current: Path) -> None:
        try:
            resolved = current.resolve()
        except OSError as exc:
            raise RuntimeError(
                f"Unable to resolve requirements file {current}: {exc}"
            ) from exc
        if resolved in visited:
            digest.update(b"repeat\0")
            return
        visited.add(resolved)

        if not resolved.is_file():
            digest.update(b"missing\0")
            return
        try:
            content = resolved.read_bytes()
        except OSError as exc:
            raise RuntimeError(
                f"Unable to read requirements file {resolved}: {exc}"
            ) from exc
        digest.update(b"file\0")
        digest.update(len(content).to_bytes(8, "big"))
        digest.update(content)
        for included in _requirement_includes(
            resolved,
            content.decode("utf-8", errors="replace"),
        ):
            visit(included)

    visit(path)
    return digest.hexdigest()


def ensure_git_available() -> None:
    if shutil.which("git") is None:
        raise RuntimeError("Missing executable: git")


def ensure_git_checkout() -> None:
    result = run_command(["git", "rev-parse", "--show-toplevel"], check=False)
    if result.returncode != 0:
        raise RuntimeError(non_git_checkout_message())
    try:
        checkout_root = Path(result.stdout.strip()).resolve()
    except OSError as exc:
        raise RuntimeError(non_git_checkout_message()) from exc
    if checkout_root != REPO_ROOT.resolve():
        raise RuntimeError(
            "Refusing update: the Skill is not inside the expected Jadense "
            f"Skills checkout root ({REPO_ROOT})."
        )


def ensure_derivative_repository_identity() -> None:
    """Refuse pulls unless origin is the Jadense-maintained derivative repo."""
    result = run_command(["git", "remote", "get-url", "origin"], check=False)
    origin = result.stdout.strip()
    if result.returncode != 0 or origin not in _ALLOWED_ORIGIN_URLS:
        reported = origin or "<missing>"
        raise RuntimeError(
            "Refusing update because Git origin is not the Jadense derivative "
            f"repository. Expected {DERIVATIVE_REPOSITORY}; found {reported}. "
            "Never update this derivative directly from the upstream ppt-master repo."
        )


def ensure_clean_tracked_worktree() -> None:
    status = run_command(["git", "status", "--porcelain", "--untracked-files=no"], check=False)
    if status.returncode != 0:
        details = (status.stderr or status.stdout or "").strip()
        raise RuntimeError(details or "Unable to inspect git status.")

    if status.stdout.strip():
        raise RuntimeError(
            "Tracked local changes detected. Please commit or stash them before running the update command."
        )


def get_head_revision() -> str:
    result = run_command(["git", "rev-parse", "HEAD"])
    return result.stdout.strip()


def get_current_branch() -> str:
    """Return a live local branch or fail closed for detached HEAD."""
    result = run_command(
        ["git", "symbolic-ref", "--quiet", "--short", "HEAD"],
        check=False,
    )
    branch = result.stdout.strip()
    if result.returncode != 0 or not branch:
        raise RuntimeError(
            "Refusing update from detached HEAD; switch to a Jadense Skills branch first."
        )
    return branch


def sync_python_dependencies() -> None:
    if not REQUIREMENTS_FILE.exists():
        print_status("requirements.txt not found; skipping Python dependency sync.")
        return

    print_status("Requirements include tree changed. Syncing Python dependencies...")
    result = run_command([sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS_FILE)])
    if result.stdout.strip():
        print_status(result.stdout.strip())
    if result.stderr.strip():
        print_status(result.stderr.strip())


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    try:
        ensure_git_available()
        ensure_git_checkout()
        ensure_derivative_repository_identity()
        ensure_clean_tracked_worktree()

        branch = get_current_branch()
        before_head = get_head_revision()
        before_requirements = requirements_digest(REQUIREMENTS_FILE)

        print_status(f"Derivative repository: {REPO_ROOT}")
        print_status(f"Source: {DERIVATIVE_REPOSITORY} ({branch})")
        pull_result = run_command(["git", "pull", "--ff-only", "origin", branch])
        if pull_result.stdout.strip():
            print_status(pull_result.stdout.strip())
        if pull_result.stderr.strip():
            print_status(pull_result.stderr.strip())

        after_head = get_head_revision()
        after_requirements = requirements_digest(REQUIREMENTS_FILE)

        if before_head == after_head:
            print_status("Repository is already up to date.")
        else:
            print_status(f"Updated from {before_head[:7]} to {after_head[:7]}.")

        if args.skip_pip:
            print_status("Skipped Python dependency sync (--skip-pip).")
        elif before_requirements != after_requirements:
            sync_python_dependencies()
        else:
            print_status(
                "Requirements include tree unchanged. Skipping Python dependency sync."
            )

        print_status(
            "Note: system dependencies such as Node.js and Pandoc still need "
            "to be installed manually."
        )
        return 0
    except subprocess.CalledProcessError as exc:
        details = (exc.stderr or exc.stdout or "").strip()
        print(details or "Command failed.", file=sys.stderr)
        return exc.returncode or 1
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
