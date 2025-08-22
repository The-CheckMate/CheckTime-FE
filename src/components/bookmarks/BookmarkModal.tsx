'use client';

import { useEffect } from 'react';
import { Bookmark, BookmarkFormData } from '@/types/bookmark';
import BookmarkForm from './BookmarkForm';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark?: Bookmark; // 수정 모드일 때 전달
  onSubmit: (data: BookmarkFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function BookmarkModal({
  isOpen,
  onClose,
  bookmark,
  onSubmit,
  isLoading,
}: BookmarkModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center"
    >
      {/* 배경 오버레이 */}
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {bookmark ? '북마크 수정' : '북마크 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 폼 내용 */}
        <div className="p-4">
          <BookmarkForm
            bookmark={bookmark}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
