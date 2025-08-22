'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import BookmarkList from '@/components/bookmarks/BookmarkList';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function BookmarksPage() {
  const router = useRouter();
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 새로고침 시에도 로그인 유지
  useEffect(() => {
    const at = localStorage.getItem('accessToken');
    const name = localStorage.getItem('userName') || undefined;
    if (at) {
      setIsAuthed(true);
      setUserName(name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userName');
    setIsAuthed(false);
    setUserName(undefined);
    setConfirmOpen(false);

    alert('로그아웃 되었습니다.');
    router.push('/'); // 홈으로 리다이렉트
  };

  const headerProps: React.ComponentProps<typeof Header> = isAuthed
    ? {
        isAuthed: true as const,
        userName: userName!,
        onLogoutClick: () => setConfirmOpen(true),
      }
    : {
        onLoginClick: () => setLoginOpen(true),
      };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header {...headerProps} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <BookmarkList />
      </div>

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
            return true;
          } catch (err) {
            alert(err instanceof Error ? err.message : '로그인 중 오류 발생');
            return false; // 실패 시 false 반환
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
            setLoginOpen(true); // 바로 로그인 유도
          } catch (err) {
            alert(err instanceof Error ? err.message : '회원가입 중 오류 발생');
          }
        }}
      />

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        open={confirmOpen}
        title="로그아웃 확인"
        message="정말 로그아웃하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={handleLogout}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
