FROM ubuntu:20.04

ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV CLANG_VERSION=12
ENV GCC_VERSION=13

RUN apt update && \
    apt install -y --no-install-recommends \
    build-essential \
    curl \
    git

RUN apt update && \
    apt install -y --no-install-recommends \
    software-properties-common && \
    add-apt-repository -y ppa:deadsnakes/ppa && \
    add-apt-repository -y ppa:ubuntu-toolchain-r/test

# Install clang
RUN apt install -y --no-install-recommends \
    clang-"$CLANG_VERSION" \
    llvm-"$CLANG_VERSION" \
    lld "libomp-${CLANG_VERSION}-dev"

RUN update-alternatives --install /usr/bin/clang clang /usr/bin/clang-"$CLANG_VERSION" 1 && \
    update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-"$CLANG_VERSION" 1 && \
    update-alternatives --install /usr/bin/cc cc /usr/bin/clang 1 && \
    update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++ 1

# Install g++
RUN apt update && \
    apt install -y g++-"$GCC_VERSION"

RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-"$GCC_VERSION" 1 && \
    update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-"$GCC_VERSION" 1 && \
    update-alternatives --install /usr/bin/gcov gcov /usr/bin/gcov-"$GCC_VERSION" 1

# Install python 3.10
RUN apt install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3.10-dev \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1

# Install ExecuTorch
RUN git clone https://github.com/pytorch/executorch.git
WORKDIR /executorch
RUN git checkout cbfdf78f8
RUN git submodule sync
RUN git submodule update --init

RUN python -m venv .venv
ENV PATH="/executorch/.venv/bin:$PATH"

RUN ./install_requirements.sh --pybind xnnpack
RUN ./examples/models/llama/install_requirements.sh

COPY ./scripts /scripts

ENTRYPOINT ["bash", "-c", "/scripts/export_llama.sh"]
