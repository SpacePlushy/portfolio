FROM ubuntu:22.04

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    build-essential \
    python3 \
    python3-pip \
    nodejs \
    npm \
    openssh-server \
    sudo \
    tmux \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -s /bin/bash ubuntu && \
    echo "ubuntu:ubuntu" | chpasswd && \
    usermod -aG sudo ubuntu

# Create mount point for persistent volume
RUN mkdir -p /workspace && \
    chown -R ubuntu:ubuntu /workspace

# Set up SSH (for Railway SSH feature)
RUN mkdir /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Switch to non-root user
USER ubuntu
WORKDIR /workspace

# Keep container running
CMD ["tail", "-f", "/dev/null"]