import React, { useState, useEffect, useMemo } from 'react';
import {
  Code,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileText,
  Minus,
  Plus,
  GitCompare,
  Layers,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'context';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  isSignificant?: boolean; // CSS, JS, HTML structure changes
}

interface DiffSection {
  type: 'html' | 'css' | 'js' | 'meta';
  title: string;
  lines: DiffLine[];
  changeCount: number;
}

interface CodeDiffViewerProps {
  leftSnapshot: {
    archiveUrl: string;
    timestamp: string;
  };
  rightSnapshot: {
    archiveUrl: string;
    timestamp: string;
  };
  className?: string;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  leftSnapshot,
  rightSnapshot,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['html', 'css'])
  );
  const [filterType, setFilterType] = useState<
    'all' | 'significant' | 'structure'
  >('all');

  // HTMLコンテンツを取得してDIFF比較
  const fetchAndCompare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // CORS制限のため、実際の実装では代替方法を使用
      // ここではモックデータで差分を生成
      const mockDiff = generateMockDiff();
      setDiffSections(mockDiff);
    } catch (err) {
      setError(
        'コードの取得中にエラーが発生しました: ' + (err as Error).message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // モックDIFFデータを生成（実際のプロジェクトでは実際のHTMLを比較）
  const generateMockDiff = (): DiffSection[] => {
    return [
      {
        type: 'html',
        title: 'HTML構造',
        changeCount: 23,
        lines: [
          {
            type: 'unchanged',
            oldLineNumber: 1,
            newLineNumber: 1,
            content: '<!DOCTYPE html>',
          },
          {
            type: 'unchanged',
            oldLineNumber: 2,
            newLineNumber: 2,
            content: '<html lang="ja">',
          },
          {
            type: 'unchanged',
            oldLineNumber: 3,
            newLineNumber: 3,
            content: '<head>',
          },
          {
            type: 'removed',
            oldLineNumber: 4,
            content: '  <title>旧タイトル - 商品比較サイト</title>',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 4,
            content: '  <title>新タイトル - 最新商品比較サイト</title>',
            isSignificant: true,
          },
          {
            type: 'unchanged',
            oldLineNumber: 5,
            newLineNumber: 5,
            content: '  <meta charset="utf-8">',
          },
          {
            type: 'removed',
            oldLineNumber: 6,
            content: '  <meta name="description" content="旧説明文">',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 6,
            content:
              '  <meta name="description" content="最新の商品比較とレビュー">',
            isSignificant: true,
          },
          { type: 'context', content: '...' },
          {
            type: 'unchanged',
            oldLineNumber: 15,
            newLineNumber: 15,
            content: '<body>',
          },
          {
            type: 'unchanged',
            oldLineNumber: 16,
            newLineNumber: 16,
            content: '  <header class="header">',
          },
          {
            type: 'removed',
            oldLineNumber: 17,
            content: '    <h1>商品比較サイト</h1>',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 17,
            content: '    <h1>最新商品比較サイト</h1>',
            isSignificant: true,
          },
          {
            type: 'unchanged',
            oldLineNumber: 18,
            newLineNumber: 18,
            content: '    <nav class="nav">',
          },
          {
            type: 'added',
            newLineNumber: 19,
            content: '      <a href="/new-feature">新機能</a>',
            isSignificant: true,
          },
          {
            type: 'unchanged',
            oldLineNumber: 19,
            newLineNumber: 20,
            content: '      <a href="/products">商品一覧</a>',
          },
        ],
      },
      {
        type: 'css',
        title: 'CSS スタイル',
        changeCount: 15,
        lines: [
          {
            type: 'unchanged',
            oldLineNumber: 1,
            newLineNumber: 1,
            content: '.header {',
          },
          {
            type: 'removed',
            oldLineNumber: 2,
            content: '  background-color: #ffffff;',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 2,
            content: '  background-color: #f8f9fa;',
            isSignificant: true,
          },
          { type: 'removed', oldLineNumber: 3, content: '  padding: 20px;' },
          { type: 'added', newLineNumber: 3, content: '  padding: 24px;' },
          {
            type: 'unchanged',
            oldLineNumber: 4,
            newLineNumber: 4,
            content: '}',
          },
          { type: 'context', content: '...' },
          {
            type: 'added',
            newLineNumber: 25,
            content: '.new-feature-btn {',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 26,
            content: '  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 27,
            content: '  color: white;',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 28,
            content: '  border: none;',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 29,
            content: '  padding: 12px 24px;',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 30,
            content: '  border-radius: 8px;',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 31,
            content: '}',
            isSignificant: true,
          },
        ],
      },
      {
        type: 'js',
        title: 'JavaScript',
        changeCount: 8,
        lines: [
          {
            type: 'unchanged',
            oldLineNumber: 1,
            newLineNumber: 1,
            content: '// Analytics tracking',
          },
          {
            type: 'removed',
            oldLineNumber: 2,
            content: 'gtag("config", "GA_MEASUREMENT_ID");',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 2,
            content: 'gtag("config", "GA_MEASUREMENT_ID", {',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 3,
            content: '  custom_parameter: "new_value"',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 4,
            content: '});',
            isSignificant: true,
          },
          { type: 'context', content: '...' },
          {
            type: 'added',
            newLineNumber: 15,
            content: '// New feature tracking',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 16,
            content: 'function trackNewFeature() {',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 17,
            content: '  gtag("event", "click", {',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 18,
            content: '    event_category: "engagement",',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 19,
            content: '    event_label: "new_feature_button"',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 20,
            content: '  });',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 21,
            content: '}',
            isSignificant: true,
          },
        ],
      },
      {
        type: 'meta',
        title: 'メタデータ',
        changeCount: 5,
        lines: [
          {
            type: 'unchanged',
            oldLineNumber: 1,
            newLineNumber: 1,
            content: '<meta property="og:site_name" content="商品比較サイト">',
          },
          {
            type: 'removed',
            oldLineNumber: 2,
            content:
              '<meta property="og:image" content="https://example.com/old-image.jpg">',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 2,
            content:
              '<meta property="og:image" content="https://example.com/new-hero-image.jpg">',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 3,
            content: '<meta name="twitter:card" content="summary_large_image">',
            isSignificant: true,
          },
          {
            type: 'added',
            newLineNumber: 4,
            content: '<meta name="twitter:creator" content="@newaccount">',
            isSignificant: true,
          },
        ],
      },
    ];
  };

  // フィルタリングされた差分セクション
  const filteredSections = useMemo(() => {
    return diffSections.map((section) => {
      let filteredLines = section.lines;

      if (showOnlyChanges) {
        filteredLines = section.lines.filter(
          (line) => line.type !== 'unchanged' || line.type === 'context'
        );
      }

      if (filterType === 'significant') {
        filteredLines = filteredLines.filter(
          (line) =>
            line.type === 'context' ||
            line.type === 'unchanged' ||
            line.isSignificant
        );
      } else if (filterType === 'structure') {
        filteredLines = filteredLines.filter(
          (line) =>
            line.type === 'context' ||
            (line.isSignificant &&
              (line.content.includes('<') ||
                line.content.includes('class=') ||
                line.content.includes('id=')))
        );
      }

      return {
        ...section,
        lines: filteredLines,
      };
    });
  }, [diffSections, showOnlyChanges, filterType]);

  // セクションの展開/折りたたみ
  const toggleSection = (sectionType: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionType)) {
      newExpanded.delete(sectionType);
    } else {
      newExpanded.add(sectionType);
    }
    setExpandedSections(newExpanded);
  };

  // 行タイプに応じたスタイル
  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-l-4 border-l-green-500 text-green-900';
      case 'removed':
        return 'bg-red-50 border-l-4 border-l-red-500 text-red-900';
      case 'context':
        return 'bg-gray-100 text-gray-600 italic';
      default:
        return 'bg-white';
    }
  };

  // 行番号のスタイル
  const getLineNumberStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-700';
      case 'removed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  useEffect(() => {
    fetchAndCompare();
  }, [leftSnapshot, rightSnapshot]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
        <span className="text-gray-600">コードを比較しています...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      >
        <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">比較エラー</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchAndCompare}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  const totalChanges = diffSections.reduce(
    (sum, section) => sum + section.changeCount,
    0
  );

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <GitCompare className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              コードDIFF比較
            </h3>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {totalChanges} 変更
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 表示フィルター */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべての変更</option>
              <option value="significant">重要な変更のみ</option>
              <option value="structure">構造的変更のみ</option>
            </select>

            {/* 差分のみ表示切り替え */}
            <button
              onClick={() => setShowOnlyChanges(!showOnlyChanges)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showOnlyChanges
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showOnlyChanges ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="text-sm">
                {showOnlyChanges ? '差分のみ' : '全文表示'}
              </span>
            </button>
          </div>
        </div>

        {/* タイムスタンプ比較 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Minus className="h-4 w-4 text-red-600" />
            <div>
              <div className="font-medium text-red-900">変更前</div>
              <div className="text-red-700">{leftSnapshot.timestamp}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Plus className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-green-900">変更後</div>
              <div className="text-green-700">{rightSnapshot.timestamp}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Diff Sections */}
      <div className="divide-y divide-gray-200">
        {filteredSections.map((section) => (
          <div key={section.type} className="bg-white">
            {/* Section Header */}
            <div
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => toggleSection(section.type)}
            >
              <div className="flex items-center space-x-3">
                {section.type === 'html' && (
                  <FileText className="h-5 w-5 text-orange-600" />
                )}
                {section.type === 'css' && (
                  <Layers className="h-5 w-5 text-blue-600" />
                )}
                {section.type === 'js' && (
                  <Code className="h-5 w-5 text-yellow-600" />
                )}
                {section.type === 'meta' && (
                  <GitCompare className="h-5 w-5 text-purple-600" />
                )}

                <h4 className="font-medium text-gray-900">{section.title}</h4>
                <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {section.changeCount} 変更
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  {section.lines.length} 行
                </div>
                {expandedSections.has(section.type) ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>

            {/* Section Content */}
            {expandedSections.has(section.type) && (
              <div className="border-t border-gray-100">
                <div className="font-mono text-sm">
                  {section.lines.map((line, index) => (
                    <div
                      key={index}
                      className={`flex ${getLineStyle(line.type)} ${
                        line.isSignificant
                          ? 'ring-1 ring-inset ring-yellow-300'
                          : ''
                      }`}
                    >
                      {/* Line Numbers */}
                      <div
                        className={`flex-shrink-0 w-20 px-2 py-1 text-xs text-center ${getLineNumberStyle(line.type)}`}
                      >
                        {line.type === 'context' ? (
                          <span>⋯</span>
                        ) : (
                          <>
                            <span className="inline-block w-6">
                              {line.oldLineNumber || ''}
                            </span>
                            <span className="inline-block w-6">
                              {line.newLineNumber || ''}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Change Indicator */}
                      <div className="flex-shrink-0 w-6 px-1 py-1 text-xs text-center">
                        {line.type === 'added' && (
                          <span className="text-green-600">+</span>
                        )}
                        {line.type === 'removed' && (
                          <span className="text-red-600">-</span>
                        )}
                        {line.type === 'context' && (
                          <span className="text-gray-400">⋯</span>
                        )}
                      </div>

                      {/* Code Content */}
                      <div className="flex-1 px-2 py-1 overflow-x-auto">
                        <code className="whitespace-pre">{line.content}</code>
                        {line.isSignificant && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            重要
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-green-600" />
              <span>
                {diffSections.reduce(
                  (sum, s) =>
                    sum + s.lines.filter((l) => l.type === 'added').length,
                  0
                )}{' '}
                行追加
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Minus className="h-4 w-4 text-red-600" />
              <span>
                {diffSections.reduce(
                  (sum, s) =>
                    sum + s.lines.filter((l) => l.type === 'removed').length,
                  0
                )}{' '}
                行削除
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <GitCompare className="h-4 w-4 text-blue-600" />
              <span>{totalChanges} 変更箇所</span>
            </div>
          </div>

          <div className="text-gray-500">
            {showOnlyChanges ? '差分表示' : '全文表示'} •{' '}
            {filterType === 'all'
              ? '全て'
              : filterType === 'significant'
                ? '重要のみ'
                : '構造のみ'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeDiffViewer;
