# Git Guide: How to Clone and Push Code

This guide will walk you through the essential Git commands for cloning repositories and pushing your code changes.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Cloning a Repository](#cloning-a-repository)
3. [Making Changes](#making-changes)
4. [Pushing Code](#pushing-code)
5. [Common Workflow](#common-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, make sure you have:
- Git installed on your system ([Download Git](https://git-scm.com/downloads))
- A GitHub account
- Access to the repository (either as owner or collaborator)

### Configure Git (First Time Only)

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"
```

---

## Cloning a Repository

### Step 1: Clone the Repository

To clone a repository, use the `git clone` command:

```bash
git clone https://github.com/pryndor/Vigi-Vault.git
```

This will:
- Create a new folder called `Vigi-Vault` in your current directory
- Download all the files and history from the repository
- Set up the remote connection to the original repository

### Step 2: Navigate into the Repository

```bash
cd Vigi-Vault
```

---

## Making Changes

### Step 1: Check Current Status

Before making changes, check what files have been modified:

```bash
git status
```

### Step 2: Create or Edit Files

- Create new files or edit existing ones
- Use your preferred code editor

### Step 3: Stage Your Changes

After making changes, you need to stage them (tell Git which files to include):

```bash
# Stage a specific file
git add filename.py

# Stage all modified files
git add .

# Stage all files in a directory
git add directory/
```

### Step 4: Commit Your Changes

Commit your staged changes with a descriptive message:

```bash
git commit -m "Your commit message describing the changes"
```

**Good commit messages:**
- `"Add user authentication feature"`
- `"Fix bug in database connection"`
- `"Update README with installation instructions"`

**Bad commit messages:**
- `"changes"`
- `"fix"`
- `"update"`

---

## Pushing Code

### Step 1: Check Your Branch

First, check which branch you're on:

```bash
git branch
```

The current branch will have an asterisk (*) next to it.

### Step 2: Pull Latest Changes (Important!)

Before pushing, always pull the latest changes from the remote repository:

```bash
git pull origin main
```

(Replace `main` with your branch name if different, e.g., `master`)

### Step 3: Push Your Changes

Push your committed changes to the remote repository:

```bash
git push origin main
```

(Replace `main` with your branch name if different)

**If this is your first push**, you might need to set the upstream:

```bash
git push -u origin main
```

---

## Common Workflow

Here's a typical workflow when working with a repository:

```bash
# 1. Clone the repository (only once)
git clone https://github.com/pryndor/Vigi-Vault.git
cd Vigi-Vault

# 2. Create a new branch for your feature (recommended)
git checkout -b feature/my-new-feature

# 3. Make your changes to files
# (edit files using your code editor)

# 4. Check what changed
git status

# 5. Stage your changes
git add .

# 6. Commit your changes
git commit -m "Add new feature: description of what you did"

# 7. Pull latest changes from remote
git pull origin main

# 8. Push your changes
git push origin feature/my-new-feature

# 9. Create a Pull Request on GitHub (if working with others)
```

---

## Working with Branches

### Create a New Branch

```bash
git checkout -b branch-name
```

### Switch Between Branches

```bash
git checkout branch-name
```

### List All Branches

```bash
git branch
```

### Delete a Branch

```bash
git branch -d branch-name
```

---

## Additional Useful Commands

### View Commit History

```bash
git log
```

### View Changes in Files

```bash
git diff
```

### Undo Changes (Before Staging)

```bash
# Restore a specific file
git restore filename.py

# Restore all files
git restore .
```

### Undo Staged Changes

```bash
git reset HEAD filename.py
```

### View Remote Repository

```bash
git remote -v
```

---

## Troubleshooting

### Authentication Issues

If you get authentication errors when pushing:

1. **Use Personal Access Token (Recommended)**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` permissions
   - Use the token as your password when pushing

2. **Or use SSH instead of HTTPS**
   ```bash
   # Change remote URL to SSH
   git remote set-url origin git@github.com:pryndor/Vigi-Vault.git
   ```

### Merge Conflicts

If you get merge conflicts when pulling:

1. Git will mark the conflicted files
2. Open the files and look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Resolve the conflicts manually
4. Stage the resolved files: `git add .`
5. Complete the merge: `git commit`

### "Your branch is behind" Error

If you see this message:

```bash
# Pull and merge
git pull origin main

# Or rebase (cleaner history)
git pull --rebase origin main
```

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
```

⚠️ **Warning**: `git reset --hard` permanently deletes your changes!

---

## Quick Reference Card

| Action | Command |
|--------|---------|
| Clone repository | `git clone <repository-url>` |
| Check status | `git status` |
| Stage files | `git add .` |
| Commit changes | `git commit -m "message"` |
| Pull changes | `git pull origin main` |
| Push changes | `git push origin main` |
| Create branch | `git checkout -b branch-name` |
| Switch branch | `git checkout branch-name` |
| View history | `git log` |
| View changes | `git diff` |

---

## Best Practices

1. **Always pull before pushing** to avoid conflicts
2. **Write clear commit messages** that describe what and why
3. **Commit often** with small, logical changes
4. **Use branches** for new features or experiments
5. **Never commit sensitive data** (passwords, API keys, etc.)
6. **Review your changes** with `git status` and `git diff` before committing

---

## Need Help?

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Happy Coding! 🚀**

