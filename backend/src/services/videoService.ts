import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { VideoItem } from '../types.js';
import { HybridStore } from '../db/hybridStore.js';

// Setup directories for video uploads and thumbnails
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');

[UPLOADS_DIR, VIDEOS_DIR, THUMBNAILS_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Setup FFmpeg and FFprobe binary paths
const defaultWindowsFfmpeg = 'C:\\Users\\admin\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
const defaultWindowsFfprobe = 'C:\\Users\\admin\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe';

const ffmpegPath = process.env.FFMPEG_PATH || (fs.existsSync(defaultWindowsFfmpeg) ? defaultWindowsFfmpeg : 'ffmpeg');
const ffprobePath = process.env.FFPROBE_PATH || (fs.existsSync(defaultWindowsFfprobe) ? defaultWindowsFfprobe : 'ffprobe');

try {
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
} catch (err) {
  console.warn('[VideoService] Could not configure ffmpeg binary path automatically:', err);
}

// Cloudflare R2 S3 Client Initialization
let r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
let r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
let r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
let r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'ownedu-videos';
let r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

let isR2Configured = Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey);
let s3Client: S3Client | null = null;

export function reloadR2Config(): boolean {
  r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'ownedu-videos';
  r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

  isR2Configured = Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey);
  if (isR2Configured) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId!,
        secretAccessKey: r2SecretAccessKey!,
      },
    });
    console.log('[VideoService] Cloudflare R2 re-initialized successfully for bucket:', r2BucketName);
    return true;
  } else {
    s3Client = null;
    console.log('[VideoService] Operating in LOCAL FALLBACK mode.');
    return false;
  }
}

// Initial bootstrap
reloadR2Config();

export class VideoService {
  private db: HybridStore;

  constructor(db: HybridStore) {
    this.db = db;
  }

  public isCloudflareR2Active(): boolean {
    return isR2Configured;
  }

  /**
   * Tạo Presigned URL cho Direct-to-Cloud Upload lên Cloudflare R2 (giống Bloomfit)
   */
  public async getPresignedUploadUrl(filename: string, contentType: string = 'video/mp4'): Promise<{ presignedUrl: string; key: string } | null> {
    if (!isR2Configured || !s3Client) {
      return null;
    }

    const ext = path.extname(filename) || '.mp4';
    const key = `raw/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 phút
    return { presignedUrl, key };
  }

  /**
   * Tải file nhị phân lên Cloudflare R2
   */
  private async uploadFileToR2(localFilePath: string, key: string, contentType: string): Promise<string> {
    if (!s3Client) throw new Error('R2 client not initialized');

    const fileStream = fs.createReadStream(localFilePath);
    await s3Client.send(new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    }));

    if (r2PublicDomain) {
      const cleanDomain = r2PublicDomain.replace(/\/$/, '');
      return `${cleanDomain}/${key}`;
    }
    return `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${key}`;
  }

  /**
   * Phân tích thông số video bằng FFprobe (duration, resolution)
   */
  public getVideoMetadata(filePath: string): Promise<{ duration: number; width: number; height: number; resolution: string }> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err || !metadata) {
          console.warn('[VideoService] ffprobe error, using default metadata:', err);
          return resolve({ duration: 0, width: 1280, height: 720, resolution: '720p' });
        }

        const duration = Math.round(metadata.format.duration || 0);
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const width = videoStream?.width || 1280;
        const height = videoStream?.height || 720;
        const resolution = height >= 1080 ? '1080p' : height >= 720 ? '720p' : '480p';

        resolve({ duration, width, height, resolution });
      });
    });
  }

  /**
   * Trích xuất ảnh poster thumbnail tại giây thứ 1 bằng FFmpeg
   */
  public extractThumbnail(videoPath: string, thumbnailPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '640x360'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', (err) => {
          console.error('[VideoService] Error extracting thumbnail:', err);
          reject(err);
        });
    });
  }

  /**
   * Nén video bằng FFmpeg với chuẩn tối ưu cho Web: H.264, CRF 24, Faststart, AAC 128k
   */
  public compressVideoWithFfmpeg(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-crf 24',
          '-preset fast',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-pix_fmt yuv420p' // Đảm bảo hiển thị màu tương thích 100% trên Safari/iOS/Chrome
        ])
        .save(outputPath)
        .on('end', () => {
          console.log(`[VideoService] FFmpeg compression finished: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error('[VideoService] FFmpeg compression error:', err);
          reject(err);
        });
    });
  }

  /**
   * Pipeline xử lý video hoàn chỉnh (Chạy ngầm - Asynchronous Worker Job)
   */
  public async processUploadedVideo(
    videoId: string,
    rawTempFilePath: string,
    originalFilename: string,
    title?: string,
    courseId?: string
  ): Promise<void> {
    const rawStats = fs.existsSync(rawTempFilePath) ? fs.statSync(rawTempFilePath) : null;
    const originalSizeBytes = rawStats ? rawStats.size : 0;

    // 1. Tạo bản ghi ban đầu trong database với trạng thái PROCESSING
    const initialVideo: VideoItem = {
      id: videoId,
      courseId: courseId || undefined,
      title: title || originalFilename.replace(/\.[^/.]+$/, ''),
      filename: originalFilename,
      originalSizeBytes,
      storageUrl: `/api/v1/videos/${videoId}/stream`,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
    };
    this.db.addVideo(initialVideo);

    // Nếu có courseId, tự động thêm videoId vào danh sách video của Course
    if (courseId) {
      const course = this.db.getCourse(courseId);
      if (course) {
        const currentVideoIds = course.videoIds || [];
        if (!currentVideoIds.includes(videoId)) {
          this.db.updateCourse(courseId, { videoIds: [...currentVideoIds, videoId] });
        }
      }
    }

    // 2. Chạy tác vụ nén ngầm (không chặn luồng HTTP request)
    (async () => {
      const compressedFilePath = path.join(VIDEOS_DIR, `${videoId}.mp4`);
      const thumbnailFilePath = path.join(THUMBNAILS_DIR, `${videoId}.jpg`);

      try {
        console.log(`[VideoService] Bắt đầu xử lý video ${videoId} (${(originalSizeBytes / (1024 * 1024)).toFixed(1)} MB)...`);

        // Bước A: Phân tích metadata
        const metadata = await this.getVideoMetadata(rawTempFilePath);

        // Bước B: Trích xuất ảnh bìa thumbnail
        try {
          await this.extractThumbnail(rawTempFilePath, thumbnailFilePath);
        } catch (thumbErr) {
          console.warn('[VideoService] Bỏ qua lỗi thumbnail:', thumbErr);
        }

        // Bước C: Chạy nén video bằng FFmpeg
        await this.compressVideoWithFfmpeg(rawTempFilePath, compressedFilePath);

        const compressedStats = fs.statSync(compressedFilePath);
        const compressedSizeBytes = compressedStats.size;
        const compressionRatio = originalSizeBytes > 0 
          ? Math.max(0, Math.round((1 - compressedSizeBytes / originalSizeBytes) * 100))
          : 0;

        let finalStorageUrl = `/api/v1/videos/${videoId}/stream`;
        let finalThumbnailUrl = fs.existsSync(thumbnailFilePath) ? `/api/v1/videos/${videoId}/thumbnail` : undefined;

        // Bước D: Đẩy lên Cloudflare R2 nếu đã cấu hình
        if (isR2Configured && s3Client) {
          console.log(`[VideoService] Đang tải bản nén ${videoId} lên Cloudflare R2...`);
          try {
            const r2VideoKey = `videos/${videoId}.mp4`;
            finalStorageUrl = await this.uploadFileToR2(compressedFilePath, r2VideoKey, 'video/mp4');

            if (fs.existsSync(thumbnailFilePath)) {
              const r2ThumbKey = `thumbnails/${videoId}.jpg`;
              finalThumbnailUrl = await this.uploadFileToR2(thumbnailFilePath, r2ThumbKey, 'image/jpeg');
            }
            console.log(`[VideoService] Tải lên R2 thành công: ${finalStorageUrl}`);
          } catch (r2Err) {
            console.error('[VideoService] Lỗi upload R2, fallback về local:', r2Err);
          }
        }

        // Bước E: Cập nhật trạng thái READY
        this.db.updateVideo(videoId, {
          status: 'READY',
          storageUrl: finalStorageUrl,
          thumbnailUrl: finalThumbnailUrl,
          durationSeconds: metadata.duration,
          resolution: metadata.resolution,
          compressedSizeBytes,
          compressionRatio,
        });

        console.log(`[VideoService] ✅ Video ${videoId} đã hoàn tất nén! Giảm ${compressionRatio}% (${(originalSizeBytes / (1024 * 1024)).toFixed(1)}MB -> ${(compressedSizeBytes / (1024 * 1024)).toFixed(1)}MB)`);

        // Bước F: Dọn dẹp file thô gốc để giải phóng ổ cứng server
        if (fs.existsSync(rawTempFilePath)) {
          fs.unlinkSync(rawTempFilePath);
        }
      } catch (err: any) {
        console.error(`[VideoService] ❌ Xử lý video ${videoId} thất bại:`, err);
        this.db.updateVideo(videoId, {
          status: 'FAILED',
        });
        if (fs.existsSync(rawTempFilePath)) {
          try { fs.unlinkSync(rawTempFilePath); } catch {}
        }
      }
    })();
  }

  public getLocalVideoPath(videoId: string): string {
    return path.join(VIDEOS_DIR, `${videoId}.mp4`);
  }

  public getLocalThumbnailPath(videoId: string): string {
    return path.join(THUMBNAILS_DIR, `${videoId}.jpg`);
  }

  public extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.trim().match(regExp);
    return match ? match[1] : null;
  }

  public createYoutubeVideo(
    videoId: string,
    youtubeUrl: string,
    title?: string,
    courseId?: string
  ): VideoItem | null {
    const youtubeId = this.extractYoutubeId(youtubeUrl);
    if (!youtubeId) return null;

    const videoItem: VideoItem = {
      id: videoId,
      courseId,
      title: title?.trim() || `Bài giảng YouTube (${youtubeId})`,
      filename: `youtube_${youtubeId}.mp4`,
      originalSizeBytes: 0,
      compressedSizeBytes: 0,
      compressionRatio: 0,
      resolution: 'YouTube Embed (HD)',
      storageUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      status: 'READY',
      sourceType: 'YOUTUBE',
      youtubeId,
      youtubeUrl: youtubeUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    this.db.addVideo(videoItem);
    return videoItem;
  }
}

