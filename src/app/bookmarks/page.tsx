'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, BookmarkFormData } from '@/types/bookmark';
import { BookmarkAPI } from '@/libs/api/bookmarks';
import BookmarkItem from '@/components/bookmarks/BookmarkItem';
import BookmarkModal from '@/components/bookmarks/BookmarkModal';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Auth states
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();
  const [modalLoading, setModalLoading] = useState(false);

  // 새로고침 시에도 로그인 유지
  useEffect(() => {
    const at = localStorage.getItem('accessToken');
    const name = localStorage.getItem('userName') || undefined;
    if (at) {
      setIsAuthed(true);
      setUserName(name);
      loadBookmarks();
    } else {
      setLoading(false);
    }
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

  // 검색 필터링
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const query = searchQuery.toLowerCase();
    return (
      bookmark.custom_name.toLowerCase().includes(query) ||
      bookmark.custom_url.toLowerCase().includes(query)
    );
  });

  // 북마크 추가
  const handleAdd = () => {
    if (!isAuthed) {
      setLoginOpen(true);
      return;
    }
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
    if (confirm('이 북마크를 삭제하시겠습니까?')) {
      try {
        await BookmarkAPI.deleteBookmark(id);
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : '북마크 삭제에 실패했습니다.');
      }
    }
  };

  // 북마크 시간 확인 (확인 모달 표시)
  const handleCheckTime = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setConfirmOpen(true);
  };

  // 실제 시간 확인 실행
  const executeCheckTime = async () => {
    if (!selectedBookmark) return;
    
    try {
      await BookmarkAPI.clickBookmark(selectedBookmark.id);
      // 시간 확인 결과를 새 창에서 열기
      window.open(`/result?url=${encodeURIComponent(selectedBookmark.custom_url)}`, '_blank');
      setConfirmOpen(false);
      setSelectedBookmark(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '시간 확인에 실패했습니다.');
      setConfirmOpen(false);
      setSelectedBookmark(null);
    }
  };

  // 모달 제출
  const handleModalSubmit = async (data: BookmarkFormData) => {
    setModalLoading(true);
    try {
      if (editingBookmark) {
        // 수정
        const updated = await BookmarkAPI.updateBookmark(editingBookmark.id, data);
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userName');
    setIsAuthed(false);
    setUserName(undefined);
    setLogoutConfirmOpen(false);
    setBookmarks([]);
    alert('로그아웃 되었습니다.');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-black font-semibold text-base no-underline">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center text-white text-sm">
              ⏰
            </div>
            Check Time
          </Link>
          
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-gray-600 text-sm font-medium hover:text-black transition-colors no-underline">홈</Link>
            <a href="#" className="text-gray-600 text-sm font-medium hover:text-black transition-colors no-underline">실시간 랭킹</a>
            <a href="#" className="text-gray-600 text-sm font-medium hover:text-black transition-colors no-underline">반응속도 게임</a>
            <a href="/bookmarks" className="text-black text-sm font-semibold no-underline">북마크</a>
            <a href="#" className="text-gray-600 text-sm font-medium hover:text-black transition-colors no-underline">도움말</a>
          </nav>
          
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <>
                <span className="text-sm text-gray-600">안녕하세요, {userName}님</span>
                <button
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:text-black hover:bg-black/5 transition-all"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:text-black hover:bg-black/5 transition-all"
                >
                  로그인
                </button>
                <button
                  onClick={() => setSignupOpen(true)}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-black/80 transition-all"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* 컨트롤 바 */}
        <div className="flex justify-between items-center mb-8 gap-6">
          <div className="relative max-w-md flex-1">
            <input
              type="text"
              className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              placeholder="북마크 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-5 items-center">
            <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
              <button
                className={`px-3 py-2 border-none rounded-md cursor-pointer transition-all text-sm font-medium ${
                  viewMode === 'grid'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
                onClick={() => setViewMode('grid')}
              >
                카드
              </button>
              <button
                className={`px-3 py-2 border-none rounded-md cursor-pointer transition-all text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
                onClick={() => setViewMode('list')}
              >
                리스트
              </button>
      </div>
            
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-black/80 transition-all"
            >
              ➕ 북마크 추가
            </button>
          </div>
        </div>

        {/* 북마크 컨테이너 */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {!isAuthed ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                로그인이 필요합니다
              </h3>
              <p className="text-gray-600 mb-4">북마크 기능을 사용하려면 로그인해주세요</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => setSignupOpen(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  회원가입
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={loadBookmarks}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '아직 북마크가 없습니다'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? '다른 검색어를 시도해보세요' : '첫 번째 북마크를 추가해보세요!'}
              </p>
            </div>
          ) : (
            <div className={`grid gap-5 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {filteredBookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCheckTime={handleCheckTime}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 북마크 추가/수정 모달 */}
      <BookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookmark={editingBookmark}
        onSubmit={handleModalSubmit}
        isLoading={modalLoading}
      />

      {/* 로그인 모달 */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSignupClick={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
        onSubmit={async ({ email, password }) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/login`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              },
            );

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || '로그인 실패');

            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            if (data?.data?.user?.username) {
              localStorage.setItem('userName', data.data.user.username);
              setUserName(data.data.user.username);
            }
            setIsAuthed(true);
            setLoginOpen(false);
            loadBookmarks();
            return true;
          } catch (err) {
            alert(err instanceof Error ? err.message : '로그인 중 오류 발생');
            return false;
          }
        }}
      />

      {/* 회원가입 모달 */}
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onLoginClick={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
        onSubmit={async ({ username, email, password }) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/register`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
              },
            );
            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || '회원가입 실패');
            }

            console.log('회원가입 성공', data.data.user);
            alert('회원가입이 완료되었습니다. 로그인 해주세요.');
            setSignupOpen(false);
            setLoginOpen(true);
          } catch (err) {
            alert(err instanceof Error ? err.message : '회원가입 중 오류 발생');
          }
        }}
      />

      {/* 시간확인 확인 모달 */}
      <ConfirmModal
        open={confirmOpen}
        title="시간 확인"
        message={`"${selectedBookmark?.custom_name}" 사이트의 시간을 확인하시겠습니까?`}
        confirmText="확인"
        cancelText="취소"
        onConfirm={executeCheckTime}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedBookmark(null);
        }}
      />

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        open={logoutConfirmOpen}
        title="로그아웃 확인"
        message="정말 로그아웃하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={handleLogout}
        onClose={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}