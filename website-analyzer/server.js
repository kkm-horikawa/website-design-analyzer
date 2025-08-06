import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// URL変形版を生成
function generateUrlVariants(url) {
  const variants = [url];
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;
    
    // www有無の変形
    if (domain.startsWith('www.')) {
      const withoutWww = domain.replace('www.', '');
      variants.push(`${urlObj.protocol}//${withoutWww}${path}`);
      variants.push(`${withoutWww}${path}`);
      variants.push(withoutWww);
    } else {
      variants.push(`${urlObj.protocol}//www.${domain}${path}`);
      variants.push(`www.${domain}${path}`);
      variants.push(`www.${domain}`);
    }
    
    // プロトコル無し版
    variants.push(`${domain}${path}`);
    variants.push(domain);
    
    // パス無し版
    if (path !== '/' && path !== '') {
      variants.push(`${urlObj.protocol}//${domain}`);
      variants.push(domain);
    }
    
  } catch (error) {
    console.warn('URL parsing error:', error);
  }
  
  return [...new Set(variants)]; // 重複除去
}

// Wayback Machine CDX APIから実際のデータを取得
app.get('/api/wayback-snapshots/:url(*)', async (req, res) => {
  const url = req.params.url;
  console.log(`🔍 Fetching snapshots for: ${url}`);

  try {
    // Playwrightでブラウザを起動
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // URL変形版を生成
    const urlVariants = generateUrlVariants(url);
    console.log(`📋 Testing URL variants:`, urlVariants);

    let allSnapshots = [];
    let successfulUrl = null;

    for (const testUrl of urlVariants) {
      console.log(`🌐 Trying CDX API for: ${testUrl}`);
      
      // CDX API URLを構築
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(testUrl)}&matchType=prefix&collapse=timestamp:8&output=json&fl=timestamp,original,statuscode&limit=100`;
      
      console.log(`📡 CDX API URL: ${cdxUrl}`);

      try {
        // CDX APIにアクセス
        const response = await page.goto(cdxUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        if (!response.ok()) {
          console.warn(`❌ CDX API returned ${response.status()} for ${testUrl}`);
          continue;
        }

        // レスポンステキストを取得
        const textContent = await page.textContent('body');
        
        if (!textContent || textContent.trim() === '') {
          console.log(`📭 No snapshots found for ${testUrl}`);
          continue;
        }

        console.log(`📄 CDX Response length: ${textContent.length} characters for ${testUrl}`);

        // CDX形式のデータをパース
        const lines = textContent.trim().split('\n');
        console.log(`📊 Found ${lines.length} lines in CDX response for ${testUrl}`);

        if (lines.length > 1) {
          // JSONパース（CDXはJSONL形式）
          const snapshots = [];
          for (let i = 1; i < lines.length; i++) {
            try {
              // 行末のカンマを削除してからJSONパース
              const line = lines[i].trim().replace(/,$/, '');
              if (line === '') continue;
              
              const data = JSON.parse(line);
              if (data.length >= 3) {
                const [timestamp, originalUrl, statusCode] = data;
                
                // 成功したリクエストのみを含める（301リダイレクトも含める）
                if (statusCode === '200' || statusCode === '301' || statusCode === '-') {
                  snapshots.push({
                    timestamp,
                    url: originalUrl,
                    statusCode,
                    archiveUrl: `https://web.archive.org/web/${timestamp}/${originalUrl}`,
                    changeType: determineChangeType(timestamp)
                  });
                }
              }
            } catch (parseError) {
              console.warn(`❌ Failed to parse line ${i}: ${lines[i]} - Error: ${parseError.message}`);
              continue;
            }
          }

          if (snapshots.length > 0) {
            allSnapshots = allSnapshots.concat(snapshots);
            successfulUrl = testUrl;
            console.log(`✅ Found ${snapshots.length} snapshots for ${testUrl}`);
            break; // 成功したら他の変形版は試さない
          } else {
            console.log(`📭 No valid snapshots in response for ${testUrl}`);
          }
        } else {
          console.log(`📭 No data lines found for ${testUrl}`);
        }

      } catch (fetchError) {
        console.error(`❌ Error fetching ${testUrl}:`, fetchError.message);
        continue;
      }
    }

    await browser.close();

    if (allSnapshots.length === 0) {
      console.log(`😞 No snapshots found for any URL variant of: ${url}`);
      return res.json({
        url,
        available: false,
        historicalSnapshots: [],
        analysisQuality: 'low',
        dataSource: 'wayback_api_no_data'
      });
    }

    // タイムスタンプで逆順ソート（新しいものから古いものへ）
    allSnapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // 重複を削除（同じ年月の重複を除去）
    const uniqueSnapshots = allSnapshots.filter((snapshot, index, arr) => {
      const yearMonth = snapshot.timestamp.substring(0, 6);
      return arr.findIndex(s => s.timestamp.substring(0, 6) === yearMonth) === index;
    });

    const finalSnapshots = uniqueSnapshots.slice(0, 50); // 最大50個に制限

    console.log(`🎉 Successfully processed ${finalSnapshots.length} unique snapshots from ${successfulUrl}`);
    console.log(`📅 Date range: ${formatTimestamp(finalSnapshots[finalSnapshots.length - 1]?.timestamp)} → ${formatTimestamp(finalSnapshots[0]?.timestamp)}`);

    res.json({
      url,
      available: finalSnapshots.length > 0,
      historicalSnapshots: finalSnapshots,
      analysisQuality: finalSnapshots.length > 15 ? 'high' : finalSnapshots.length > 5 ? 'medium' : 'low',
      dataSource: 'wayback_api_playwright',
      successfulUrl: successfulUrl
    });

  } catch (error) {
    console.error('❌ Error launching browser:', error);
    res.status(500).json({
      url,
      available: false,
      historicalSnapshots: [],
      analysisQuality: 'low',
      dataSource: 'error',
      error: error.message
    });
  }
});

// タイムスタンプをフォーマット
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  return `${year}/${month}/${day}`;
}

// タイムスタンプから変更タイプを推定
function determineChangeType(timestamp) {
  const currentTime = new Date();
  const snapshotTime = new Date(
    parseInt(timestamp.substring(0, 4)),
    parseInt(timestamp.substring(4, 6)) - 1,
    parseInt(timestamp.substring(6, 8))
  );
  
  const monthsAgo = Math.floor(
    (currentTime.getTime() - snapshotTime.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (monthsAgo <= 2) return 'recent';
  if (monthsAgo <= 6) return 'moderate';
  if (monthsAgo <= 12) return 'significant';
  if (monthsAgo <= 24) return 'major';
  return 'historical';
}

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Wayback Machine API Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Wayback Machine API Server running at http://localhost:${PORT}`);
  console.log(`📡 CDX API endpoint: http://localhost:${PORT}/api/wayback-snapshots/{url}`);
});