'use client';

const DB_NAME = 'slideviral-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an image (data URL or blob URL content) to IndexedDB.
 * Key format: `{projectId}:{slideId}`
 */
export async function saveImage(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    console.warn('Failed to save image to IndexedDB');
  }
}

/**
 * Load an image from IndexedDB by key.
 */
export async function loadImage(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete all images for a project.
 */
export async function deleteProjectImages(projectId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith(projectId + ':')) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    console.warn('Failed to delete project images from IndexedDB');
  }
}

/**
 * Save all slide images for a project to IndexedDB.
 */
export async function saveProjectImages(
  projectId: string,
  slides: Array<{ id: string; imageUrl?: string }>,
): Promise<void> {
  for (const slide of slides) {
    if (slide.imageUrl) {
      await saveImage(`${projectId}:${slide.id}`, slide.imageUrl);
    }
  }
}

/**
 * Restore all slide images for a project from IndexedDB.
 * Returns a map of slideId -> imageUrl.
 */
export async function loadProjectImages(
  projectId: string,
  slideIds: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const slideId of slideIds) {
    const img = await loadImage(`${projectId}:${slideId}`);
    if (img) result[slideId] = img;
  }
  return result;
}
