export interface Bookmark {
  id: number;
  user_id?: number;
  custom_name: string;
  custom_url: string;
  favicon?: string;
  created_at?: string;
  updated_at?: string;
  click_count?: number;
}

export interface BookmarkCreateRequest {
  custom_name: string;
  custom_url: string;
}

export interface BookmarkUpdateRequest {
  custom_name: string;
  custom_url: string;
  favicon?: string;
}

export interface BookmarkFormData {
  custom_name: string;
  custom_url: string;
  favicon?: string;
}
