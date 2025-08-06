import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ExternalLink,
  Clock,
  Target,
  TrendingUp,
  Eye,
  Layers,
  Zap,
  Grid,
  List,
  BarChart3,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import SnapshotPreview from './SnapshotPreview';
import CodeDiffViewer from './CodeDiffViewer';

interface Snapshot {
  timestamp: string;
  url: string;
  statusCode: string;
  archiveUrl: string;
  changeType?: string;
}

interface TimelineComparisonProps {
  snapshots: Snapshot[];
  pageUrl: string;
  pageName: string;
  onClose: () => void;
}

const TimelineComparison: React.FC<TimelineComparisonProps> = ({
  snapshots,
  pageUrl,
  pageName,
  onClose,
}) => {
  const [selectedSnapshots, setSelectedSnapshots] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<
    'timeline' | 'comparison' | 'analysis'
  >('timeline');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [compareMode, setCompareMode] = useState<
    'side-by-side' | 'overlay' | 'diff' | 'code-diff'
  >('side-by-side');

  // スナップショットを時系列順にソートとフィルタリング
  const sortedSnapshots = useMemo(() => {
    let filtered = [...snapshots];

    // フィルタリング
    if (filterType !== 'all') {
      filtered = filtered.filter(
        (snapshot) => snapshot.changeType === filterType
      );
    }

    // 検索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (snapshot) =>
          snapshot.timestamp.includes(term) ||
          (snapshot.changeType || '').toLowerCase().includes(term)
      );
    }

    // ソート
    return filtered.sort((a, b) => {
      const comparison = a.timestamp.localeCompare(b.timestamp);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [snapshots, filterType, searchTerm, sortOrder]);

  // 日付フォーマット
  const formatDate = (timestamp: string): string => {
    if (!timestamp || timestamp.length < 8) return 'Invalid Date';
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    return `${year}/${month}/${day}`;
  };

  // 時間差計算
  const calculateTimeDiff = (
    timestamp1: string,
    timestamp2: string
  ): string => {
    if (!timestamp1 || !timestamp2) return '';

    const date1 = new Date(
      parseInt(timestamp1.substring(0, 4)),
      parseInt(timestamp1.substring(4, 6)) - 1,
      parseInt(timestamp1.substring(6, 8))
    );
    const date2 = new Date(
      parseInt(timestamp2.substring(0, 4)),
      parseInt(timestamp2.substring(4, 6)) - 1,
      parseInt(timestamp2.substring(6, 8))
    );

    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays}日後`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月後`;
    return `${Math.floor(diffDays / 365)}年後`;
  };

  // 変更タイプのスタイル
  const getChangeTypeStyle = (changeType?: string) => {
    switch (changeType) {
      case 'recent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderate':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'significant':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'redesign':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'launch':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 変更タイプのラベル
  const getChangeTypeLabel = (changeType?: string) => {
    const labels = {
      recent: '最近の変更',
      moderate: '通常更新',
      significant: '大きな変更',
      major: '大幅変更',
      redesign: 'リデザイン',
      launch: 'ローンチ',
    };
    return labels[changeType as keyof typeof labels] || '変更';
  };

  // スナップショット選択/選択解除
  const toggleSnapshotSelection = (index: number) => {
    setSelectedSnapshots((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else if (prev.length < 4) {
        return [...prev, index].sort();
      }
      return prev;
    });
  };

  // 分析データ生成
  const generateAnalysis = () => {
    const totalSnapshots = sortedSnapshots.length;
    const timeSpan =
      totalSnapshots > 1
        ? calculateTimeDiff(
            sortedSnapshots[0].timestamp,
            sortedSnapshots[totalSnapshots - 1].timestamp
          )
        : '不明';

    const changeTypes = sortedSnapshots.reduce(
      (acc, snapshot) => {
        const type = snapshot.changeType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostFrequentChange = Object.entries(changeTypes).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      totalSnapshots,
      timeSpan,
      changeTypes,
      mostFrequentChange: mostFrequentChange
        ? {
            type: mostFrequentChange[0],
            count: mostFrequentChange[1],
          }
        : null,
      avgChangeInterval:
        totalSnapshots > 1
          ? Math.floor(365 / (totalSnapshots - 1)) + '日'
          : '不明',
    };
  };

  const analysis = generateAnalysis();

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pageName}</h1>
                <p className="text-sm text-gray-600 truncate max-w-2xl">
                  {pageUrl}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {sortedSnapshots.length} スナップショット
                </div>
                {selectedSnapshots.length > 0 && (
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {selectedSnapshots.length} 選択中
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                タイムライン
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'comparison'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                比較表示
              </button>
              <button
                onClick={() => setViewMode('analysis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'analysis'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                分析結果
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        </div>

        {/* Enhanced Control Bar */}
        {viewMode !== 'analysis' && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="タイムスタンプで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべての変更</option>
                <option value="recent">最近の変更</option>
                <option value="moderate">通常更新</option>
                <option value="significant">大きな変更</option>
                <option value="major">大幅変更</option>
                <option value="redesign">リデザイン</option>
                <option value="launch">ローンチ</option>
              </select>

              {/* Sort */}
              <button
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
                <span>{sortOrder === 'asc' ? '古い順' : '新しい順'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {viewMode === 'timeline' && (
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`p-2 rounded ${layoutMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`p-2 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              )}

              {viewMode === 'comparison' && selectedSnapshots.length > 1 && (
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setCompareMode('side-by-side')}
                    className={`px-3 py-1 text-xs rounded ${compareMode === 'side-by-side' ? 'bg-white shadow-sm' : ''}`}
                  >
                    並列表示
                  </button>
                  <button
                    onClick={() => setCompareMode('overlay')}
                    className={`px-3 py-1 text-xs rounded ${compareMode === 'overlay' ? 'bg-white shadow-sm' : ''}`}
                  >
                    重畳表示
                  </button>
                  <button
                    onClick={() => setCompareMode('code-diff')}
                    className={`px-3 py-1 text-xs rounded ${compareMode === 'code-diff' ? 'bg-white shadow-sm' : ''}`}
                  >
                    コードDIFF
                  </button>
                </div>
              )}

              {selectedSnapshots.length > 0 && (
                <button
                  onClick={() => setSelectedSnapshots([])}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  選択をクリア
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {viewMode === 'timeline' && (
          <div className="h-full overflow-y-auto">
            {layoutMode === 'grid' ? (
              /* Grid Layout */
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedSnapshots.map((snapshot, index) => (
                    <div key={snapshot.timestamp} className="group">
                      <div
                        className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                          selectedSnapshots.includes(index)
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Preview */}
                        <SnapshotPreview
                          archiveUrl={snapshot.archiveUrl}
                          timestamp={snapshot.timestamp}
                          originalUrl={snapshot.url}
                          className="rounded-t-xl"
                        />

                        {/* Info Card */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(snapshot.timestamp)}
                            </div>
                            {snapshot.changeType && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeStyle(
                                  snapshot.changeType
                                )}`}
                              >
                                {getChangeTypeLabel(snapshot.changeType)}
                              </span>
                            )}
                          </div>

                          {index > 0 && (
                            <div className="text-xs text-gray-500 mb-3">
                              前回から{' '}
                              {calculateTimeDiff(
                                sortedSnapshots[index - 1].timestamp,
                                snapshot.timestamp
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-gray-500">
                                #{index + 1}
                              </div>
                              <div className="text-xs text-green-600">
                                Status: {snapshot.statusCode}
                              </div>
                            </div>

                            <button
                              onClick={() => toggleSnapshotSelection(index)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                                selectedSnapshots.includes(index)
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {selectedSnapshots.includes(index)
                                ? '選択中'
                                : '選択'}
                            </button>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {selectedSnapshots.includes(index) && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {selectedSnapshots.indexOf(index) + 1}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* List Layout - Enhanced Timeline */
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"></div>

                    {sortedSnapshots.map((snapshot, index) => (
                      <div
                        key={snapshot.timestamp}
                        className="relative flex items-start mb-8 group"
                      >
                        {/* Enhanced Timeline Dot */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-4 transition-all duration-200 ${
                            selectedSnapshots.includes(index)
                              ? 'bg-blue-600 border-blue-600 shadow-lg'
                              : 'bg-white border-gray-300 group-hover:border-blue-400'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              selectedSnapshots.includes(index)
                                ? 'bg-white'
                                : 'bg-gray-300 group-hover:bg-blue-400'
                            }`}
                          ></div>

                          {selectedSnapshots.includes(index) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              ✓
                            </div>
                          )}
                        </div>

                        {/* Enhanced Content Card */}
                        <div className="ml-6 flex-1">
                          <div
                            className={`bg-white border-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg ${
                              selectedSnapshots.includes(index)
                                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                                : 'border-gray-200 group-hover:border-gray-300'
                            }`}
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                              {/* Left: Preview */}
                              <div className="lg:col-span-1">
                                <SnapshotPreview
                                  archiveUrl={snapshot.archiveUrl}
                                  timestamp={snapshot.timestamp}
                                  originalUrl={snapshot.url}
                                  className="w-full"
                                />
                              </div>

                              {/* Right: Info */}
                              <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                      {formatDate(snapshot.timestamp)}
                                    </h3>
                                    {index > 0 && (
                                      <p className="text-sm text-gray-500">
                                        前回から{' '}
                                        {calculateTimeDiff(
                                          sortedSnapshots[index - 1].timestamp,
                                          snapshot.timestamp
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  {snapshot.changeType && (
                                    <span
                                      className={`px-3 py-2 rounded-full text-sm font-medium border ${getChangeTypeStyle(
                                        snapshot.changeType
                                      )}`}
                                    >
                                      {getChangeTypeLabel(snapshot.changeType)}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">
                                      スナップショット番号
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                      #{index + 1}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">
                                      ステータス
                                    </div>
                                    <div className="text-lg font-semibold text-green-600">
                                      {snapshot.statusCode}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                  <div className="text-xs text-gray-500">
                                    {snapshot.url}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() =>
                                        toggleSnapshotSelection(index)
                                      }
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        selectedSnapshots.includes(index)
                                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {selectedSnapshots.includes(index)
                                        ? '選択解除'
                                        : '比較に追加'}
                                    </button>
                                    <a
                                      href={snapshot.archiveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <ExternalLink className="h-5 w-5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'comparison' && (
          <div className="h-full overflow-y-auto">
            {selectedSnapshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white">
                <div className="text-center p-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <Layers className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    比較モード
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    タイムラインビューでスナップショットを選択すると、ここで詳細な比較ができます。
                    最大4つまで同時比較が可能です。
                  </p>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    タイムラインに戻る
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Comparison Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        スナップショット比較
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {selectedSnapshots.length}件を比較表示中
                      </p>
                    </div>
                    {selectedSnapshots.length >= 2 && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-2">
                          分析期間
                        </div>
                        <div className="text-xl font-semibold text-gray-900">
                          {calculateTimeDiff(
                            sortedSnapshots[selectedSnapshots[0]].timestamp,
                            sortedSnapshots[
                              selectedSnapshots[selectedSnapshots.length - 1]
                            ].timestamp
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedSnapshots.length >= 2 && (
                    <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {selectedSnapshots.length - 1}
                        </div>
                        <div className="text-sm text-gray-600">変更回数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {selectedSnapshots.length > 1
                            ? Math.floor(365 / (selectedSnapshots.length - 1))
                            : 0}
                        </div>
                        <div className="text-sm text-gray-600">
                          平均間隔 (日)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {Math.round(
                            (selectedSnapshots.length /
                              sortedSnapshots.length) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">選択率</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comparison Grid */}
                <div
                  className={`grid gap-6 ${
                    selectedSnapshots.length === 1
                      ? 'grid-cols-1 max-w-2xl mx-auto'
                      : selectedSnapshots.length === 2
                        ? 'grid-cols-1 lg:grid-cols-2'
                        : selectedSnapshots.length === 3
                          ? 'grid-cols-1 lg:grid-cols-3'
                          : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
                  }`}
                >
                  {selectedSnapshots.map((snapshotIndex, compareIndex) => {
                    const snapshot = sortedSnapshots[snapshotIndex];
                    return (
                      <div key={snapshot.timestamp} className="group">
                        <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-lg">
                          {/* Card Header */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {compareIndex + 1}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {formatDate(snapshot.timestamp)}
                                  </h3>
                                  <div className="text-xs text-gray-500">
                                    #{snapshotIndex + 1}
                                  </div>
                                </div>
                              </div>
                              {snapshot.changeType && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getChangeTypeStyle(
                                    snapshot.changeType
                                  )}`}
                                >
                                  {getChangeTypeLabel(snapshot.changeType)}
                                </span>
                              )}
                            </div>

                            {compareIndex > 0 && (
                              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                前のスナップショットから{' '}
                                {calculateTimeDiff(
                                  sortedSnapshots[
                                    selectedSnapshots[compareIndex - 1]
                                  ].timestamp,
                                  snapshot.timestamp
                                )}
                              </div>
                            )}
                          </div>

                          {/* Preview */}
                          <div className="p-4">
                            <SnapshotPreview
                              archiveUrl={snapshot.archiveUrl}
                              timestamp={snapshot.timestamp}
                              originalUrl={snapshot.url}
                              className="rounded-lg"
                            />
                          </div>

                          {/* Card Footer */}
                          <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <div className="text-gray-500 mb-1">
                                  ステータス
                                </div>
                                <div className="font-semibold text-green-600">
                                  {snapshot.statusCode}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">
                                  タイムスタンプ
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {snapshot.timestamp}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <a
                                href={snapshot.archiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                アーカイブを表示
                              </a>
                              <button
                                onClick={() =>
                                  toggleSnapshotSelection(snapshotIndex)
                                }
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                選択解除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Advanced Comparison Tools */}
                {selectedSnapshots.length >= 2 &&
                  compareMode === 'code-diff' && (
                    <div className="mt-8">
                      <CodeDiffViewer
                        leftSnapshot={{
                          archiveUrl:
                            sortedSnapshots[selectedSnapshots[0]].archiveUrl,
                          timestamp:
                            sortedSnapshots[selectedSnapshots[0]].timestamp,
                        }}
                        rightSnapshot={{
                          archiveUrl:
                            sortedSnapshots[selectedSnapshots[1]].archiveUrl,
                          timestamp:
                            sortedSnapshots[selectedSnapshots[1]].timestamp,
                        }}
                      />
                    </div>
                  )}

                {selectedSnapshots.length >= 2 &&
                  compareMode !== 'code-diff' && (
                    <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        高度な比較分析
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Timeline Visualization */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">
                            変更タイムライン
                          </h4>
                          <div className="space-y-2">
                            {selectedSnapshots.map((snapshotIndex) => {
                              const snapshot = sortedSnapshots[snapshotIndex];
                              return (
                                <div
                                  key={snapshot.timestamp}
                                  className="flex items-center space-x-3"
                                >
                                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                  <div className="flex-1 text-sm">
                                    <span className="font-medium">
                                      {formatDate(snapshot.timestamp)}
                                    </span>
                                    {snapshot.changeType && (
                                      <span className="ml-2 text-gray-500">
                                        (
                                        {getChangeTypeLabel(
                                          snapshot.changeType
                                        )}
                                        )
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Change Analysis */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">
                            変更パターン分析
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                変更頻度
                              </span>
                              <span className="text-sm font-medium">
                                {selectedSnapshots.length > 1
                                  ? `${Math.round(365 / (selectedSnapshots.length - 1))}日間隔`
                                  : '単一スナップショット'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                変更の一貫性
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                {selectedSnapshots.length >= 3
                                  ? '継続的改善'
                                  : '比較対象少'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                推定テスト期間
                              </span>
                              <span className="text-sm font-medium text-purple-600">
                                {selectedSnapshots.length >= 2
                                  ? `約${Math.floor(selectedSnapshots.length * 1.5)}ヶ月`
                                  : '不明'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'analysis' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                変遷分析レポート
              </h3>

              {/* 概要統計 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">
                        総スナップショット
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {analysis.totalSnapshots}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">
                        分析期間
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {analysis.timeSpan}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">
                        平均更新間隔
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {analysis.avgChangeInterval}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">
                        主な変更タイプ
                      </p>
                      <p className="text-lg font-bold text-orange-900">
                        {analysis.mostFrequentChange
                          ? getChangeTypeLabel(analysis.mostFrequentChange.type)
                          : '不明'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 変更タイプ分布 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  変更タイプ分布
                </h4>
                <div className="space-y-3">
                  {Object.entries(analysis.changeTypes).map(([type, count]) => {
                    const percentage = (
                      (count / analysis.totalSnapshots) *
                      100
                    ).toFixed(1);
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getChangeTypeStyle(
                              type
                            )}`}
                          >
                            {getChangeTypeLabel(type)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count}回
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 改善提案 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  改善提案とインサイト
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h5 className="font-medium text-blue-900 mb-2">
                        更新頻度分析
                      </h5>
                      <p className="text-sm text-blue-700">
                        {analysis.totalSnapshots > 10
                          ? '積極的な改善サイクルが確認できます。継続的な最適化が行われている可能性があります。'
                          : analysis.totalSnapshots > 5
                            ? '適度な更新頻度です。計画的な改善が実施されていると考えられます。'
                            : '更新頻度が低めです。より積極的な改善施策を検討することをお勧めします。'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <h5 className="font-medium text-purple-900 mb-2">
                        変更パターン
                      </h5>
                      <p className="text-sm text-purple-700">
                        {analysis.mostFrequentChange?.type === 'recent'
                          ? '最近の変更が多く、継続的な改善が行われています。'
                          : analysis.mostFrequentChange?.type === 'redesign'
                            ? '大規模なリデザインが実施されており、戦略的な変更が確認できます。'
                            : '通常の更新パターンが確認できます。'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <h5 className="font-medium text-green-900 mb-2">
                      競合分析への活用
                    </h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 競合サイトの更新頻度と自社サイトの比較検討</li>
                      <li>• 主要な変更時期の特定と市場動向との相関分析</li>
                      <li>• 効果的な改善サイクルの参考情報として活用</li>
                      <li>• A/Bテスト実施期間の推定と戦略立案</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>合計 {sortedSnapshots.length} スナップショット</span>
            </div>
            {selectedSnapshots.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>{selectedSnapshots.length}件選択中</span>
              </div>
            )}
            {analysis.timeSpan && (
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>期間: {analysis.timeSpan}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {viewMode === 'timeline' && (
              <div className="text-sm text-gray-600">
                {layoutMode === 'grid' ? 'グリッド表示' : 'リスト表示'}
                {sortOrder === 'asc' ? ' • 古い順' : ' • 新しい順'}
              </div>
            )}

            <div className="text-sm text-gray-500">
              {filterType === 'all' ? '全て表示' : `フィルタ: ${filterType}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineComparison;
