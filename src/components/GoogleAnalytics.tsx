'use client'; // 클라이언트 컴포넌트임을 명시합니다.

import Script from 'next/script';

const GoogleAnalytics = () => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // 환경 변수가 설정되지 않았다면 아무것도 렌더링하지 않습니다.
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* 외부 gtag.js 스크립트를 로드합니다. */}
      <Script
        strategy="afterInteractive" // 페이지가 상호작용 가능해진 후에 스크립트를 로드합니다.
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      {/* gtag 초기화 및 설정 스크립트를 삽입합니다. */}
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
