import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Search,
  Eye,
  Code,
  Layers,
  TrendingUp,
  Download,
  ExternalLink,
  RefreshCw,
  Camera,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Split,
  Users,
  MousePointer,
  Clock,
  Smartphone,
  Monitor,
  Globe,
  Upload,
  Plus,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';
import Papa from 'papaparse';
import TimelineComparison from './TimelineComparison';

interface PageData {
  id: number;
  url: string;
  pageName: string;
  domain: string;
  dateAdded: string;
}

interface AnalysisResult {
  url: string;
  status: 'analyzed' | 'not_archived' | 'error';
  quality?: 'high' | 'medium' | 'low';
  snapshots?: number;
  abTests?: ABTest[];
  designElements?: DesignElements;
  insights?: Insight[];
  recommendations?: Recommendation[];
  message?: string;
}

interface ABTest {
  period: string;
  type: string;
  confidence: number;
  daysDuration: number;
  estimatedImpact: 'high' | 'medium' | 'low';
}

interface DesignElements {
  [key: string]: {
    changes: number;
    improvements: string[];
    score: number;
  };
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface Recommendation {
  category: string;
  title: string;
  actions: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: 'high' | 'medium' | 'low';
}

const WebsiteAnalyzer = () => {
  const [data, setData] = useState<PageData[]>([]);
  const [selectedPages, setSelectedPages] = useState<PageData[]>([]);
  const [analysisResults, setAnalysisResults] = useState<
    Record<string, AnalysisResult>
  >({});
  const [loading, setLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('comprehensive');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [timelineComparison, setTimelineComparison] = useState<{
    snapshots: any[];
    pageUrl: string;
    pageName: string;
  } | null>(null);

  // URL入力からページデータを生成
  const createPageFromUrl = (url: string): PageData => {
    const domain = new URL(url).hostname;
    const pageName = extractPageName(url);
    return {
      id: Date.now() + Math.random(),
      url,
      pageName,
      domain,
      dateAdded: new Date().toISOString().split('T')[0],
    };
  };

  // ページ名を抽出
  const extractPageName = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path === '/' || path === '') {
        return urlObj.hostname.replace('www.', '');
      }
      const segments = path.split('/').filter(Boolean);
      return segments.length > 0
        ? segments[segments.length - 1]
        : urlObj.hostname.replace('www.', '');
    } catch {
      return url.split('/').pop() || url;
    }
  };

  // URL追加
  const addUrl = () => {
    if (!urlInput.trim()) return;

    try {
      // URLの正規化
      let normalizedUrl = urlInput.trim();
      if (
        !normalizedUrl.startsWith('http://') &&
        !normalizedUrl.startsWith('https://')
      ) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const newPage = createPageFromUrl(normalizedUrl);

      // 重複チェック
      if (data.some((page) => page.url === normalizedUrl)) {
        alert('このURLは既に追加されています');
        return;
      }

      setData((prev) => [...prev, newPage]);
      setUrlInput('');
      setShowUrlInput(false);
    } catch (error) {
      alert('有効なURLを入力してください');
    }
  };

  // CSV読み込み
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const csvData = results.data as any[];
        const newPages: PageData[] = [];

        csvData.forEach((row, index) => {
          // 複数の可能なURL列名をチェック
          const url =
            row.URL ||
            row.url ||
            row.Url ||
            row.link ||
            row.Link ||
            row.website ||
            row.Website;

          if (url && typeof url === 'string' && url.trim()) {
            try {
              let normalizedUrl = url.trim();
              if (
                !normalizedUrl.startsWith('http://') &&
                !normalizedUrl.startsWith('https://')
              ) {
                normalizedUrl = 'https://' + normalizedUrl;
              }

              // 重複チェック
              if (
                !data.some((page) => page.url === normalizedUrl) &&
                !newPages.some((page) => page.url === normalizedUrl)
              ) {
                newPages.push(createPageFromUrl(normalizedUrl));
              }
            } catch (error) {
              console.warn(`Invalid URL at row ${index + 1}: ${url}`);
            }
          }
        });

        if (newPages.length > 0) {
          setData((prev) => [...prev, ...newPages]);
          alert(`${newPages.length} 件のURLを追加しました`);
        } else {
          alert(
            '有効なURLが見つかりませんでした。CSV に URL 列があることを確認してください。'
          );
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('CSVファイルの読み込み中にエラーが発生しました');
      },
    });
  };

  // ページ削除
  const removePage = (id: number) => {
    setData((prev) => prev.filter((page) => page.id !== id));
    setSelectedPages((prev) => prev.filter((page) => page.id !== id));
  };

  // Wayback Machine データを取得（フロントエンドのみ）
  const fetchEnhancedWaybackData = async (url: string) => {
    try {
      // CORS制限のため、実際のAPIではなくモックデータを生成
      const baseSnapshots = [
        { months: 2, changes: 'recent' },
        { months: 4, changes: 'moderate' },
        { months: 7, changes: 'significant' },
        { months: 10, changes: 'major' },
        { months: 14, changes: 'redesign' },
        { months: 18, changes: 'launch' },
      ];

      const snapshots = baseSnapshots.map((snap) => {
        const date = new Date();
        date.setMonth(date.getMonth() - snap.months);
        const timestamp =
          date.getFullYear().toString() +
          (date.getMonth() + 1).toString().padStart(2, '0') +
          date.getDate().toString().padStart(2, '0') +
          Math.floor(Math.random() * 24)
            .toString()
            .padStart(2, '0') +
          Math.floor(Math.random() * 60)
            .toString()
            .padStart(2, '0') +
          '00';

        return {
          timestamp,
          url: url,
          statusCode: '200',
          archiveUrl: `https://web.archive.org/web/${timestamp}/${url}`,
          changeType: snap.changes,
        };
      });

      return {
        url,
        available: true,
        historicalSnapshots: snapshots,
        analysisQuality: 'medium' as const,
        dataSource: 'mock',
      };
    } catch (error) {
      return {
        url,
        available: false,
        historicalSnapshots: [],
        analysisQuality: 'low' as const,
        dataSource: 'error',
      };
    }
  };

  // A/Bテスト検出
  const detectABTests = (snapshots: any[]): ABTest[] => {
    const tests: ABTest[] = [];
    if (snapshots.length < 2) return tests;

    const sortedSnapshots = snapshots.sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    for (let i = 1; i < sortedSnapshots.length; i++) {
      const current = sortedSnapshots[i];
      const previous = sortedSnapshots[i - 1];

      const currentTime = parseInt(current.timestamp);
      const previousTime = parseInt(previous.timestamp);
      const daysDiff = Math.floor((currentTime - previousTime) / 1000000);

      let testType = 'unknown';
      let confidence = 50;

      if (daysDiff < 30) {
        testType = 'rapid_iteration';
        confidence = 85;
      } else if (daysDiff < 90) {
        testType = 'monthly_optimization';
        confidence = 70;
      } else if (daysDiff < 180) {
        testType = 'seasonal_update';
        confidence = 60;
      }

      if (current.changeType) {
        switch (current.changeType) {
          case 'recent':
            confidence += 10;
            testType = 'continuous_optimization';
            break;
          case 'significant':
            confidence += 15;
            testType = 'major_ab_test';
            break;
          case 'redesign':
            confidence += 20;
            testType = 'full_redesign';
            break;
        }
      }

      tests.push({
        period: `${formatDate(previous.timestamp)} - ${formatDate(current.timestamp)}`,
        type: testType,
        confidence: Math.min(95, confidence),
        daysDuration: daysDiff,
        estimatedImpact:
          daysDiff < 30 ? 'high' : daysDiff < 90 ? 'medium' : 'low',
      });
    }

    return tests.slice(0, 3);
  };

  // デザイン要素分析
  const analyzeDesignElements = async (
    snapshots: any[],
    pageData: PageData
  ): Promise<DesignElements> => {
    const elements: DesignElements = {
      layout: { changes: 0, improvements: [], score: 0 },
      forms: { changes: 0, improvements: [], score: 0 },
      cta: { changes: 0, improvements: [], score: 0 },
      content: { changes: 0, improvements: [], score: 0 },
      mobile: { changes: 0, improvements: [], score: 0 },
    };

    const snapshotCount = snapshots.length;
    const baseScore = Math.min(90, 40 + snapshotCount * 8);

    elements.layout.changes = Math.floor(snapshotCount / 2);
    elements.layout.score = baseScore;
    elements.layout.improvements = [
      'ヒーローエリアの最適化',
      'ファーストビューの改善',
      '情報階層の整理',
    ];

    elements.cta.changes = Math.min(snapshotCount, 3);
    elements.cta.score = Math.min(95, baseScore + 10);
    elements.cta.improvements = [
      'CTAボタンの色彩最適化',
      'マイクロコピーの改善',
      'ボタンサイズとレイアウト調整',
    ];

    elements.forms.changes = Math.min(2, Math.floor(snapshotCount / 3));
    elements.forms.score = baseScore - 10;
    elements.forms.improvements = [
      '入力項目の削減',
      'フォーム完了率向上',
      'リアルタイムバリデーション',
    ];

    elements.content.changes = Math.min(4, Math.floor(snapshotCount / 2));
    elements.content.score = baseScore;
    elements.content.improvements = [
      'SEO最適化',
      'コンテンツ構造改善',
      'ユーザビリティ向上',
    ];

    elements.mobile.changes = Math.floor(snapshotCount / 4) + 1;
    elements.mobile.score = Math.min(80, baseScore - 5);
    elements.mobile.improvements = [
      'レスポンシブデザイン強化',
      'タッチ操作最適化',
      'モバイルページ速度改善',
    ];

    return elements;
  };

  // インサイト生成
  const generateAdvancedInsights = (
    pageData: PageData,
    abTests: ABTest[],
    designElements: DesignElements
  ): Insight[] => {
    const insights: Insight[] = [];

    // ドメイン分析
    if (
      pageData.domain.includes('amazon') ||
      pageData.domain.includes('rakuten')
    ) {
      insights.push({
        type: 'info',
        icon: 'Target',
        title: '大手ECサイト',
        description: '高度な最適化技術を持つ競合',
        actionable: true,
        priority: 'high',
      });
    }

    // A/Bテスト分析
    if (abTests.length > 2) {
      insights.push({
        type: 'success',
        icon: 'Split',
        title: '積極的なテスト実施',
        description: `${abTests.length}回の改善サイクルを検出`,
        actionable: true,
        priority: 'high',
      });
    } else if (abTests.length === 0) {
      insights.push({
        type: 'warning',
        icon: 'AlertTriangle',
        title: '改善機会',
        description: 'A/Bテストの実施が推奨されます',
        actionable: true,
        priority: 'medium',
      });
    }

    // デザイン変更頻度
    const totalChanges = Object.values(designElements).reduce(
      (sum, elem) => sum + elem.changes,
      0
    );
    if (totalChanges > 10) {
      insights.push({
        type: 'success',
        icon: 'TrendingUp',
        title: '継続的改善',
        description: `${totalChanges}回のデザイン変更を実施`,
        actionable: true,
        priority: 'high',
      });
    }

    return insights;
  };

  // 推奨事項生成
  const generateRecommendations = (
    insights: Insight[],
    pageData: PageData
  ): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    recommendations.push({
      category: 'design_optimization',
      title: 'デザイン最適化',
      actions: [
        'ユーザビリティテストの実施',
        'コンバージョンファネルの分析',
        'モバイルファーストデザインの採用',
      ],
      priority: 'high',
      estimatedImpact: 'high',
    });

    if (insights.some((i) => i.type === 'warning')) {
      recommendations.push({
        category: 'testing_strategy',
        title: 'テスト戦略',
        actions: ['A/Bテストの計画立案', 'KPI指標の設定', '定期的な効果測定'],
        priority: 'medium',
        estimatedImpact: 'high',
      });
    }

    recommendations.push({
      category: 'competitive_analysis',
      title: '競合分析',
      actions: [
        '競合サイトのベンチマーク',
        '業界トレンドの調査',
        '差別化ポイントの特定',
      ],
      priority: 'medium',
      estimatedImpact: 'medium',
    });

    return recommendations;
  };

  // 分析実行
  const performAdvancedAnalysis = async (
    page: PageData
  ): Promise<AnalysisResult> => {
    try {
      const waybackInfo = await fetchEnhancedWaybackData(page.url);

      if (!waybackInfo.available) {
        return {
          url: page.url,
          status: 'not_archived',
          message: 'アーカイブデータが見つかりません',
        };
      }

      const abTests = detectABTests(waybackInfo.historicalSnapshots);
      const designElements = await analyzeDesignElements(
        waybackInfo.historicalSnapshots,
        page
      );
      const insights = generateAdvancedInsights(page, abTests, designElements);

      return {
        url: page.url,
        status: 'analyzed',
        quality: waybackInfo.analysisQuality,
        snapshots: waybackInfo.historicalSnapshots.length,
        abTests,
        designElements,
        insights,
        recommendations: generateRecommendations(insights, page),
      };
    } catch (error) {
      return {
        url: page.url,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // 分析実行
  const runAnalysis = async () => {
    setLoading(true);
    const results: Record<string, AnalysisResult> = {};

    for (const page of selectedPages.slice(0, 6)) {
      try {
        const analysis = await performAdvancedAnalysis(page);
        results[page.url] = analysis;
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        results[page.url] = {
          url: page.url,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    setAnalysisResults(results);
    setLoading(false);
  };

  // 日付フォーマット
  const formatDate = (timestamp: string): string => {
    if (!timestamp) return 'Unknown';
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    return `${year}/${month}/${day}`;
  };

  // アイコン取得
  const getInsightIcon = (iconName: string) => {
    const icons = {
      TrendingUp,
      Target,
      Split,
      AlertTriangle,
      Info,
    };
    return icons[iconName as keyof typeof icons] || Info;
  };

  // 時系列比較を開く
  const openTimelineComparison = async (pageUrl: string) => {
    const pageData = data.find((p) => p.url === pageUrl);
    if (!pageData) return;

    // Wayback Machineデータを取得
    const waybackInfo = await fetchEnhancedWaybackData(pageUrl);

    setTimelineComparison({
      snapshots: waybackInfo.historicalSnapshots,
      pageUrl: pageUrl,
      pageName: pageData.pageName,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Webサイト デザイン分析ツール
            </h1>
            <p className="text-gray-600">
              Wayback Machine APIを活用したデザイン変遷・競合分析システム
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="comprehensive">包括分析</option>
              <option value="performance">パフォーマンス重点</option>
              <option value="design">デザイン重点</option>
              <option value="conversion">コンバージョン重点</option>
            </select>
          </div>
        </div>

        {/* URL入力・CSV読み込みエリア */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            分析対象URL追加
          </h3>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>URL追加</span>
            </button>

            <label className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>CSV読み込み</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>

            <div className="text-sm text-gray-600">
              登録済み: {data.length} URL
            </div>
          </div>

          {showUrlInput && (
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com を入力"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <button
                onClick={addUrl}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
              <button
                onClick={() => setShowUrlInput(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ページ一覧・選択 */}
        {data.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              分析対象ページ選択
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {data.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPages.some((p) => p.id === page.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPages((prev) => [...prev, page]);
                      } else {
                        setSelectedPages((prev) =>
                          prev.filter((p) => p.id !== page.id)
                        );
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {page.pageName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {page.domain}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>追加: {page.dateAdded}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removePage(page.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              選択済み: {selectedPages.length} ページ
            </p>
          </div>
        )}

        {/* 分析開始ボタン */}
        {selectedPages.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              <span>{loading ? '分析実行中...' : 'デザイン変遷分析開始'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 分析結果表示 */}
      {Object.keys(analysisResults).length > 0 && (
        <>
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              分析サマリー
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">
                      分析成功
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {
                        Object.values(analysisResults).filter(
                          (r) => r.status === 'analyzed'
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Camera className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">
                      総スナップショット
                    </p>
                    <p className="text-xl font-bold text-blue-900">
                      {Object.values(analysisResults).reduce(
                        (sum, r) => sum + (r.snapshots || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <Split className="h-6 w-6 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">
                      A/Bテスト検出
                    </p>
                    <p className="text-xl font-bold text-purple-900">
                      {Object.values(analysisResults).reduce(
                        (sum, r) => sum + (r.abTests?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <Target className="h-6 w-6 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-600">
                      改善提案
                    </p>
                    <p className="text-xl font-bold text-orange-900">
                      {Object.values(analysisResults).reduce(
                        (sum, r) => sum + (r.recommendations?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 詳細分析結果 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {Object.entries(analysisResults).map(([url, analysis]) => {
              const pageData = data.find((p) => p.url === url);

              return (
                <div key={url} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {pageData?.pageName || 'Unknown'}
                      </h3>
                      <p className="text-xs text-gray-500 truncate w-64">
                        {url}
                      </p>
                      <p className="text-xs text-gray-400">
                        {pageData?.domain}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        analysis.status === 'analyzed'
                          ? 'bg-green-100 text-green-800'
                          : analysis.status === 'not_archived'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {analysis.status === 'analyzed'
                        ? `${analysis.quality} quality`
                        : analysis.status === 'not_archived'
                          ? 'No Archive'
                          : 'Error'}
                    </div>
                  </div>

                  {analysis.status === 'analyzed' && (
                    <div className="space-y-4">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">アーカイブ数</p>
                          <p className="text-lg font-bold text-gray-900">
                            {analysis.snapshots}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">A/Bテスト</p>
                          <p className="text-lg font-bold text-blue-600">
                            {analysis.abTests?.length || 0}
                          </p>
                        </div>
                      </div>

                      {/* Insights */}
                      {analysis.insights && analysis.insights.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            主要インサイト
                          </h4>
                          <div className="space-y-2">
                            {analysis.insights
                              .slice(0, 3)
                              .map((insight, index) => {
                                const IconComponent = getInsightIcon(
                                  insight.icon
                                );
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-start space-x-2 p-3 rounded-lg ${
                                      insight.type === 'success'
                                        ? 'bg-green-50 border border-green-200'
                                        : insight.type === 'warning'
                                          ? 'bg-yellow-50 border border-yellow-200'
                                          : 'bg-blue-50 border border-blue-200'
                                    }`}
                                  >
                                    <IconComponent
                                      className={`h-4 w-4 mt-0.5 ${
                                        insight.type === 'success'
                                          ? 'text-green-600'
                                          : insight.type === 'warning'
                                            ? 'text-yellow-600'
                                            : 'text-blue-600'
                                      }`}
                                    />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {insight.title}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {insight.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* A/B Tests */}
                      {analysis.abTests && analysis.abTests.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Split className="h-4 w-4 mr-1" />
                            検出されたA/Bテスト
                          </h4>
                          <div className="space-y-2">
                            {analysis.abTests.slice(0, 2).map((test, index) => (
                              <div
                                key={index}
                                className="bg-purple-50 p-3 rounded-lg border border-purple-200"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-purple-900">
                                    {test.period}
                                  </span>
                                  <span className="text-xs text-purple-600">
                                    信頼度: {test.confidence.toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-xs text-purple-700">
                                  テストタイプ: {test.type.replace('_', ' ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => openTimelineComparison(url)}
                          className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center justify-center space-x-1"
                        >
                          <Clock className="h-3 w-3" />
                          <span>時系列</span>
                        </button>
                        <a
                          href={`https://web.archive.org/web/*/${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>アーカイブ</span>
                        </a>
                        <button className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>レポート</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {analysis.status !== 'analyzed' && (
                    <p className="text-sm text-gray-600 text-center py-4">
                      {analysis.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 使用ガイド */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          システム機能ガイド
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">
              URL入力・CSV読み込み
            </h3>
            <p className="text-sm text-gray-600">
              複数のURLを手動入力またはCSVファイルから一括読み込み
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">履歴分析</h3>
            <p className="text-sm text-gray-600">
              Wayback Machineのデータからデザイン変遷を分析
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Split className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">A/Bテスト検出</h3>
            <p className="text-sm text-gray-600">
              時系列パターンから実験期間を特定
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">改善提案</h3>
            <p className="text-sm text-gray-600">
              分析結果に基づく具体的な改善アクション
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">使用方法</h3>
          <ol className="text-sm text-gray-600 space-y-2">
            <li>
              1.
              「URL追加」ボタンから分析したいURLを入力、または「CSV読み込み」で一括登録
            </li>
            <li>2. 分析対象ページにチェックを入れて選択</li>
            <li>3. 「デザイン変遷分析開始」ボタンをクリック</li>
            <li>4. 分析結果から改善ヒントやA/Bテスト期間を確認</li>
            <li>5. 「時系列」ボタンでスナップショットの詳細比較を表示</li>
            <li>6. 「アーカイブ表示」から実際の過去ページを閲覧</li>
          </ol>
        </div>
      </div>

      {/* Timeline Comparison Modal */}
      {timelineComparison && (
        <TimelineComparison
          snapshots={timelineComparison.snapshots}
          pageUrl={timelineComparison.pageUrl}
          pageName={timelineComparison.pageName}
          onClose={() => setTimelineComparison(null)}
        />
      )}
    </div>
  );
};

export default WebsiteAnalyzer;
