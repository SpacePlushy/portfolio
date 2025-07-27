# Railway Ubuntu Development Environment

This is a persistent Ubuntu environment on Railway with a 9GB volume for your development work.

## Features
- Ubuntu 22.04 LTS
- 9GB persistent storage mounted at `/workspace`
- Pre-installed development tools:
  - Git, Vim, Nano
  - Python 3, pip
  - Node.js, npm
  - Build essentials
  - tmux, zsh
- Non-root user setup
- Data persists between restarts

## Setup Instructions

### 1. Install Railway CLI (if not already installed)
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize and Deploy
```bash
cd railway-ubuntu
railway init

# Link to a new project
railway link

# Create the persistent volume (9GB)
railway volume add --mount /workspace --size 9

# Deploy the container
railway up --detach
```

### 4. Access Your Ubuntu Environment
```bash
# SSH into your container
railway run bash

# Or for a more interactive session
railway shell
```

## Usage Tips

### Working Directory
- Always work in `/workspace` - this is your persistent volume
- Everything outside `/workspace` will be lost on restart
- Your home directory is temporary - store important files in `/workspace`

### First Time Setup
After first SSH, you might want to:
```bash
# Switch to workspace
cd /workspace

# Create your project directories
mkdir -p projects configs scripts

# Clone your dotfiles or configs
git clone https://github.com/yourusername/dotfiles.git configs/dotfiles

# Set up symbolic links for configs
ln -s /workspace/configs/dotfiles/.bashrc ~/.bashrc
ln -s /workspace/configs/dotfiles/.vimrc ~/.vimrc
```

### Installing Additional Software
```bash
# Update package list
sudo apt update

# Install any additional packages you need
sudo apt install -y package-name

# For persistence, create a setup script in /workspace
echo "#!/bin/bash" > /workspace/setup.sh
echo "sudo apt update && sudo apt install -y package1 package2" >> /workspace/setup.sh
chmod +x /workspace/setup.sh
```

### Saving Your Work
- Git repositories should be cloned to `/workspace/projects/`
- Configuration files should be in `/workspace/configs/`
- Scripts and tools in `/workspace/scripts/`

### Resource Management
- The container only uses resources when running
- Stop the container when not in use:
  ```bash
  railway down
  ```
- Start it again when needed:
  ```bash
  railway up --detach
  ```

### Cost Optimization
- Railway charges for active compute time
- Stop the container when not actively developing
- The 9GB volume persists even when container is stopped
- You only pay for storage (very cheap) when container is off

## Important Notes
- Default user: `ubuntu` (password: `ubuntu`)
- The container runs with limited resources by default
- For heavy workloads, you may need to adjust resource limits in Railway dashboard
- Always save important work to `/workspace` or push to git

## Troubleshooting

### Container won't start
```bash
# Check logs
railway logs
```

### Lost connection
```bash
# Restart the service
railway restart
```

### Need more resources
- Go to Railway dashboard
- Navigate to your service settings
- Adjust CPU/Memory limits as needed