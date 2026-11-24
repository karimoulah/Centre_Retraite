/** Private file storage reached through short-lived signed URLs: the API never streams user files itself in production. */
export abstract class StorageService {
  /** URL the browser PUTs the file to, with exactly this Content-Type. */
  abstract signUpload(key: string, contentType: string, expiresInSeconds: number): Promise<string>;
  /** URL to read the file, served as an attachment named `fileName`. */
  abstract signDownload(key: string, fileName: string, expiresInSeconds: number): Promise<string>;
  /** Size and type of the stored file, or null if nothing was uploaded under this key. */
  abstract stat(key: string): Promise<{ size: number; contentType: string | null } | null>;
  abstract remove(key: string): Promise<void>;
}
