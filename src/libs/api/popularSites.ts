export interface Site {
  site_id: number;
  name: string;
  url: string;
  category: string;
  click_count: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    period: string;
    category: string;
    sites: Site[];
  };
}

interface FetchParams {
  period: 'realtime' | 'daily' | 'weekly' | 'all';
  category: string;
}

export const getPopularSites = async ({
  period,
  category,
}: FetchParams): Promise<Site[]> => {
  const BASE_URL = 'http://localhost:3001/api/sites/popular/popular-sites';

  const params = new URLSearchParams({
    period,
    limit: '10',
  });

  // '전체' 카테고리가 아닐 경우에만 파라미터를 추가
  if (category !== '전체') {
    params.append('category', category);
  }

  try {
    // API 요청
    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    // HTTP 응답 상태가 'ok'가 아니면 에러를 발생시킴
    if (!response.ok) {
      throw new Error('네트워크 응답에 문제가 있습니다.');
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error('API에서 데이터를 가져오지 못했습니다.');
    }

    return result.data.sites;
  } catch (error) {
    console.error('인기 사이트 API 연동 중 오류 발생:', error);
    throw error;
  }
};
