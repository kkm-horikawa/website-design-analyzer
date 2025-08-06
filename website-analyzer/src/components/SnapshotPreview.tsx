import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface SnapshotPreviewProps {
  archiveUrl: string;
  timestamp: string;
  originalUrl: string;
  isLoading?: boolean;
  className?: string;
}

const SnapshotPreview: React.FC<SnapshotPreviewProps> = ({
  archiveUrl,
  timestamp,
  originalUrl,
  isLoading = false,
  className = '',
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const formatDate = (timestamp: string): string => {
    if (!timestamp || timestamp.length < 8) return 'Invalid Date';
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10) || '00';
    const minute = timestamp.substring(10, 12) || '00';
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
  };

  return (
    <div
      className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-gray-900">
              {formatDate(timestamp)}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1 rounded ${viewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="デスクトップビュー"
              >
                <Monitor className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1 rounded ${viewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="モバイルビュー"
              >
                <Smartphone className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="新しいタブで開く"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div
        className={`relative ${viewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'}`}
      >
        <div
          className={`relative overflow-hidden bg-gray-100 ${viewMode === 'mobile' ? 'aspect-[9/16] rounded-lg' : 'aspect-video'}`}
        >
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-sm text-gray-600">
                プレビューを読み込み中...
              </span>
            </div>
          )}

          {iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium mb-1">
                プレビューの読み込みに失敗しました
              </p>
              <p className="text-xs mb-3">
                セキュリティ制限またはネットワークエラーの可能性があります
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIframeError(false);
                    setIframeLoaded(false);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                >
                  再試行
                </button>
                <a
                  href={archiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  直接表示
                </a>
              </div>
            </div>
          ) : (
            <iframe
              key={`${archiveUrl}-${viewMode}`}
              src={archiveUrl}
              style={
                viewMode === 'mobile'
                  ? {
                      width: '800px', // Provide a wider viewport to the iframe
                      height: '1422px', // Adjust height to match container aspect ratio after scaling
                      transform: `scale(${375 / 800})`, // Scale down to fit the visual container
                      transformOrigin: 'top left',
                      border: 'none',
                    }
                  : {
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }
              }
              className={viewMode === 'desktop' ? 'w-full h-full' : ''}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
              title={`Archive snapshot from ${formatDate(timestamp)}`}
            />
          )}
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="truncate max-w-xs">{originalUrl}</div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                iframeLoaded
                  ? 'bg-green-100 text-green-600'
                  : iframeError
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {iframeLoaded ? 'ライブ' : iframeError ? 'エラー' : '読み込み中'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotPreview;
