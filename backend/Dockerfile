FROM oven/bun:1-debian AS base

WORKDIR /app

# Cài đặt ffmpeg cho xử lý video và chứng chỉ bảo mật
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Sao chép toàn bộ mã nguồn backend
COPY . .

# Tạo sẵn các thư mục lưu trữ dữ liệu
RUN mkdir -p data/uploads data/videos data/thumbnails data/temp

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

CMD ["bun", "run", "src/index.ts"]
