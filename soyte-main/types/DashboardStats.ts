export interface DashboardStats {
  overview: {
    total: number;
    pending: number;
    accepted: number;
    averageRating: number;
  };
  reflect: {
    tiendo: {
      daLam: number;
      dangLam: number;
      chuaLam: number;
    };
    danhgia: {
      dat: number;
      khongDat: number;
    };
    bySection: {
      name: string;
      total: number;
      tiendo: {
        daLam: number;
        dangLam: number;
        chuaLam: number;
      };
      danhgia: {
        dat: number;
        khongDat: number;
      };
    }[];
    summary: {
      completedProgress: number;
      completedRate: number;
      needsFix: number;
      reachedRate: number;
      totalContent: number;
    };
  };
  evaluate: {
    ratingDistribution: {
      star5: number;
      star4: number;
      star3: number;
      star2: number;
      star1: number;
      star0: number;
    };
  };
  categories: string[];
  summary: {
    id: number;
    name: string;
    series: {
      name: string;
      data: number[];
    }[];
  }[];
  trend: Array<{ date: string; count: number }>;
}
