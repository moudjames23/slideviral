import type { Slide, AspectRatio } from './slide';

export interface Account {
  id: string;
  name: string;
  website?: string | null;
  appStoreLink?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Post {
  id: string;
  accountId: string;
  name: string;
  slideshowData: SlideshowData;
  createdAt: number;
  updatedAt: number;
}

export interface PostWithAccount extends Post {
  accountName: string;
}

/** What gets stored in the SQLite JSON blob */
export interface SlideshowData {
  slides: Slide[];
  aspectRatio: AspectRatio;
  templateId?: string;
  audioUrl?: string;
  audioName?: string;
}
