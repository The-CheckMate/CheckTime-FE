'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkFormData } from '@/types/bookmark';
import { BookmarkAPI } from '@/libs/api/bookmarks';
import BookmarkItem from './BookmarkItem';
import BookmarkModal from './BookmarkModal';

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<
    Bookmark | undefined
  >();
  const [modalLoading, setModalLoading] = useState(false);

  // 초기 데이터 로딩
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BookmarkAPI.getBookmarks();
      setBookmarks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '북마크를 불러오는데 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  // 북마크 추가
  const handleAdd = () => {
    setEditingBookmark(undefined);
    setIsModalOpen(true);
  };

  // 북마크 수정
  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsModalOpen(true);
  };

  // 북마크 삭제
  const handleDelete = async (id: number) => {
    try {
      await BookmarkAPI.deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '북마크 삭제에 실패했습니다.');
    }
  };

  // 모달 제출
  const handleModalSubmit = async (data: BookmarkFormData) => {
    setModalLoading(true);
    try {
      if (editingBookmark) {
        // 수정
        const updated = await BookmarkAPI.updateBookmark(
          editingBookmark.id,
          data,
        );
        setBookmarks((prev) =>
          prev.map((b) => (b.id === editingBookmark.id ? updated : b)),
        );
      } else {
        // 추가
        const created = await BookmarkAPI.createBookmark(data);
        setBookmarks((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.',
      );
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadBookmarks}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 북마크</h1>
          <p className="text-gray-600 mt-1">
            자주 방문하는 사이트를 저장하고 빠르게 접근하세요.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          북마크 추가
        </button>
      </div>

      {/* 북마크 목록 */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            아직 북마크가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">첫 번째 북마크를 추가해보세요!</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            북마크 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 북마크 추가/수정 모달 */}
      <BookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookmark={editingBookmark}
        onSubmit={handleModalSubmit}
        isLoading={modalLoading}
      />
    </div>
  );
}
