import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs';
import { join, extname } from 'path';
import { success, error } from '../utils/response.js';
import prisma from '../config/prisma.js';

const DATA_PATH = join(process.cwd(), 'data', 'payment-accounts.json');

const readAccounts = () => {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { accounts: [] };
  }
};

const writeAccounts = (data) => {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

export const getPaymentAccounts = (req, res) => {
  const data = readAccounts();
  return success(res, data.accounts, 'Payment accounts fetched');
};

export const savePaymentAccounts = (req, res) => {
  const { accounts } = req.body;
  if (!Array.isArray(accounts)) {
    return error(res, 'accounts must be an array', 400);
  }
  // Assign IDs to new accounts
  const stamped = accounts.map((a, i) => ({ ...a, id: a.id || String(Date.now() + i) }));
  writeAccounts({ accounts: stamped });
  return success(res, stamped, 'Payment accounts saved');
};

// ── App Version Management ────────────────────────────────

const VERSION_PATH = join(process.cwd(), 'data', 'app-version.json');

const readVersions = () => {
  try { return JSON.parse(readFileSync(VERSION_PATH, 'utf-8')); }
  catch { return { android: {}, ios: {} }; }
};

/**
 * Public: Get current app version info
 */
export const getAppVersion = (req, res) => {
  return success(res, readVersions(), 'App version fetched');
};

/**
 * Admin: Upload new APK or IPA + update version info
 */
export const uploadAppVersion = async (req, res, next) => {
  try {
    const { platform, version, versionCode, releaseNotes, appStoreUrl } = req.body;

    if (!platform || !['android', 'ios'].includes(platform)) {
      return error(res, 'platform harus "android" atau "ios"', 400);
    }
    if (!version) return error(res, 'version wajib diisi (contoh: 1.1.0)', 400);

    const data = readVersions();

    if (platform === 'android') {
      let downloadUrl = data.android?.downloadUrl || '/uploads/apps/KontrakanKu.apk';
      let fileName = data.android?.fileName || 'KontrakanKu.apk';
      let fileSize = data.android?.fileSize || '';

      if (req.file) {
        const ext = extname(req.file.originalname).toLowerCase();
        if (ext !== '.apk') return error(res, 'File harus berformat .apk', 400);
        fileName = `KontrakanKu-v${version}.apk`;
        const dest = join(process.cwd(), 'uploads', 'apps', fileName);
        renameSync(req.file.path, dest);
        downloadUrl = `/uploads/apps/${fileName}`;
        fileSize = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      data.android = {
        version,
        versionCode: parseInt(versionCode) || (data.android?.versionCode || 0) + 1,
        fileName,
        downloadUrl,
        releaseNotes: releaseNotes || '',
        fileSize,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // iOS — hanya update metadata (App Store URL)
      data.ios = {
        version,
        appStoreUrl: appStoreUrl || data.ios?.appStoreUrl || '',
        releaseNotes: releaseNotes || '',
        updatedAt: new Date().toISOString(),
      };
    }

    writeFileSync(VERSION_PATH, JSON.stringify(data, null, 2), 'utf-8');

    // Kirim notifikasi ke semua user aktif
    const platformLabel = platform === 'android' ? 'Android' : 'iOS';
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          type: 'INFO',
          title: `🚀 Update Aplikasi ${platformLabel} v${version} Tersedia!`,
          body: releaseNotes
            ? `Versi baru KontrakanKu ${platformLabel} sudah tersedia. ${releaseNotes}`
            : `Versi baru KontrakanKu ${platformLabel} v${version} sudah tersedia. Segera update untuk fitur & perbaikan terbaru!`,
        })),
      });
    }

    return success(res, data[platform], `Versi ${platformLabel} v${version} berhasil diupload. ${users.length} user akan mendapat notifikasi.`);
  } catch (err) {
    next(err);
  }
};
