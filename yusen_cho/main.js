let rankingChart;   // ★ファイル先頭のほう（Papa.parseより上でも下でもOK）
let municipalityData = {};

let currentMapMode = 'normal';  //市町村の色分け制御変数
// 'nomal'|'heatmap'
let currentValueMode = 'total'; //getMunicipalityValueの結果のどれを返すかを決める変数
// 'total' | 'perCapita' | 'normalized'



Papa.parse('data/nara_purchases.csv', {
  download: true,
  header: true,
  dynamicTyping: true,
  complete: function(results) {
  results.data.forEach(row => {
    console.log(
      row.municipality,
      row.total_amount,
      typeof row.total_amount,
      Number(row.total_amount),
      isNaN(Number(row.total_amount))
    );
    municipalityData[row.municipality] = {
      goods: toNumberOrNull(row.goods_amount),
      services: toNumberOrNull(row.services_amount),
      total: toNumberOrNull(row.total_amount),
      population: toNumberOrNull(row.population),
      url: row.url
    };
  });



    // ▼▼▼ データ読込完了後にランキングチャート生成 ▼▼▼
    
    // ▼▼▼ ここから マップ順に並べ替え ▼▼▼
        const mapOrder = Array.from(document.querySelectorAll('.box')).map(e => e.id);

    // municipalityData をマップ順で並べた配列へ変換
        const rankingData = mapOrder
        .filter(name => municipalityData[name])  // CSVに存在する市町村のみ
        .map(name => ({
            name: name,
            total: (municipalityData[name].total || 0) 
        }));
    // ▲▲▲ ここまで ▲▲▲


    const labels = rankingData.map(d => d.name);
    const totals = rankingData.map(d => d.total);

    const ctxRanking = document.getElementById('rankingChart').getContext('2d');

    // ▼ 市町村数に応じて高さを調整（1行あたり px × 件数）
     //const rowHeight = 30;             // 行の高さ調整したければここを変える
     //const chartHeight = rankingData.length * rowHeight;
     //document.getElementById('rankingChart').height = chartHeight; 
    // ↑ これによりすべて表示可能に

    rankingChart = new Chart(ctxRanking, {   // ★ここだけ変更！
      type:'bar',
      data:{
        labels:labels,
        datasets:[{
          label:'合計額(円)',
          data:totals,
          backgroundColor:'rgba(54,162,235,0.6)'
        }]
      },
      options:{
        indexAxis:'y',
        responsive:true,
        maintainAspectRatio:false,  // 高さ指定を効かせるため必須
        plugins:{
          legend:{display:false},
         
      datalabels:{
        anchor:'end',
        align:'right',

        formatter: (v, ctx) => {
          // v === null → データ不明
          if (v == null || Number.isNaN(v)) {
            return 'データ不明';
          }

          // 0 は正当な値
          return v.toLocaleString() + '円';
        }
      }


        },
        scales:{ 
          x:{ 
            min:0,
            max:50000000,                     // ★横最大値 50,000,000
            ticks:{ 
              stepSize:5000000,               // ★目盛り 5,000,000刻み
              callback:v=>v.toLocaleString()+'円'
              }
            },          
          y:{ ticks:{ autoSkip:false, padding:4, maxRotation:0, minRotation:0 } }  // ← 省略を防ぐ
        }
      },
      plugins:[ChartDataLabels]
    });
    // ▲▲▲ ここまで ▲▲▲
  currentMapMode = 'normal';
  updateRankingChart();
  updateMapView();
  }
});

const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['物品','役務'],
    datasets:[{
      label: '金額 (円)',
      data:[0,0],
      backgroundColor:['#ff6384','#36a2eb']
    }]
  },
  options:{
    responsive:true,
    maintainAspectRatio:false,
    layout: {
      padding: {
        top: 40,
        right: 20
      }     //上に40px余白を足す
    },
    plugins:{
      title:{display:false, text:'', font:{size:18}}, // タイトル非表示
      datalabels:{
        anchor:'end',
        align:'end',
        formatter: value=> value.toLocaleString()+'円',
        font:{weight:'bold'}
      },
      legend: { display: false }
    },
    scales:{
      y:{beginAtZero:true, min:0, max:30000000, ticks:{callback: val=>val.toLocaleString()+'円'}}
    }
  },
  plugins:[ChartDataLabels]
});

// ←ここに追加（chartが出来た後なので安全）
handleResize();
window.addEventListener('resize', handleResize);

// 赤枠用矩形を追加しておく
const svg = document.getElementById('map');
const hoverRect = document.createElementNS('http://www.w3.org/2000/svg','rect');
hoverRect.setAttribute('fill','none');
hoverRect.setAttribute('stroke','#ff0000');
hoverRect.setAttribute('stroke-width','4');
hoverRect.style.display = 'none';
svg.appendChild(hoverRect);

// 1円単位まで日本語表記（例：123,456,789 → 1億2345万6789円）
  // 万未満（1〜9999円）を4桁ゼロ埋めにして接続（桁揃えで自然になる）
function toJapaneseAmount(num) {
  // 不正値は即終了
  if (num == null || isNaN(num)) {
    return 'データ不明';
  }

  // 小数は四捨五入（円表示前提）
  const value = Math.round(num);

  const oku = Math.floor(value / 100000000);
  const man = Math.floor((value % 100000000) / 10000);
  const yen = value % 10000;

  let result = '';

  if (oku > 0) result += oku + '億';
  if (man > 0) result += man + '万';

  // 0円でも必ず表示
  if (yen > 0 || result === '') {
    result += yen + '円';
  } else {
    result += '円';
  }

  return result;
}



document.querySelectorAll('.box').forEach(rect => {
  rect.addEventListener('click', () => {
    const name = rect.id;
    const data = municipalityData[name];
    if(!data) return;

    // ▼ ▼ ここでリンク作成（URLは例。自由に変更OK） ▼ ▼
    const url = data.url || `pages/${name}.html`;  // URLが無い場合は詳細ページにも飛ばせる
    document.getElementById('chart-title').innerHTML = `<a href="${url}" target="_blank">${name}</a>`;

    // グラフ更新
    const result = getMunicipalityChartValues(data);

    chart.data.datasets[0].data = result.values;
    chart.data.datasets[0].label = result.label;


    chart.options.plugins.title.text = name;
    chart.update();

    // ▼ ここに差し替え（他は変更不要）
    let total;

    // goods/servicesが空欄・null・undefinedなら不明扱い
    const isUnknown =
      (data.goods == null || data.goods === "" || isNaN(data.goods)) &&
      (data.services == null || data.services === "" || isNaN(data.services));

    const value = getMunicipalityValue(data);

    if (value == null) {
      document.getElementById('total-label').innerText = '合計: データ不明';
    } else {
      document.getElementById('total-label').innerText =
        `合計: ${value.toLocaleString()}円（${toJapaneseAmount(value)}）`;
    }


    
    // 赤枠用矩形を矩形に合わせて表示
    const bbox = rect.getBBox();
    hoverRect.setAttribute('x', bbox.x);
    hoverRect.setAttribute('y', bbox.y);
    hoverRect.setAttribute('width', bbox.width);
    hoverRect.setAttribute('height', bbox.height);
    hoverRect.style.display = 'block';

    // ▼▼▼ ここから追記（既存コードは触らない） ▼▼▼
    if (rankingChart) {
      // 棒グラフの色変更
    rankingChart.data.datasets[0].backgroundColor =
    rankingChart.data.labels.map(label =>
      label === name ? 'rgba(255,0,0,0.9)' : 'rgba(54,162,235,0.6)' // ★クリック市町村だけ赤
    );
    
    // ラベル文字色変更
    rankingChart.options.scales.y.ticks.color =
    rankingChart.data.labels.map(label =>
      label === name ? 'red' : '#555'   // 選択市は赤、それ以外はグレー
    );

    // 棒グラフ横の数字（datalabels）の色変更
    rankingChart.options.plugins.datalabels.color = (ctx) => {
    const label = rankingChart.data.labels[ctx.dataIndex];
    return label === name ? 'red' : '#555';   // 選択市は赤、それ以外はグレー
    };

    rankingChart.update();
    }
    // ▲▲▲ 追記ここまで ▲▲▲

  });
});

function handleResize() {
  if (!chart) return; // ← 安全チェック（重要）

  const scale = Math.min(Math.max(window.innerWidth / 1400, 0.8), 1.3);  // ★ 

  /* resizeMap(); // マップのリサイズ */

  // グラフのリサイズ
  chart.resize(); 

  // 文字サイズの調整
  // フォント設定が存在する場合だけ変更
    if (chart.options?.plugins?.title?.font) {
      chart.options.plugins.title.font.size = 18 * scale;
    }
    if (chart.options?.plugins?.datalabels?.font) {
      chart.options.plugins.datalabels.font.size = 12 * scale;
    }
    if (chart.options?.scales?.y?.ticks?.font) {
      chart.options.scales.y.ticks.font.size = 12 * scale;
    }
    if (chart.options?.scales?.x?.ticks?.font) {
      chart.options.scales.x.ticks.font.size = 12 * scale;
    }
  chart.update();
}


//雑に追加

//空欄をnullにするやつ
function toNumberOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

//マップ右側のグラフに使うデータの整形
function getMunicipalityChartValues(data) {
  if (!data) {
    return { values: [0, 0], label: 'データ不明' };
  }

  switch (currentValueMode) {
    case 'total':
      return {
        values: [data.goods ?? 0, data.services ?? 0],
        label: '金額（円）'
      };

    case 'perCapita':
      if (!data.population || data.population <= 0) {
        return { values: [0, 0], label: '人口不明' };
      }
      return {
        values: [
          (data.goods ?? 0) / data.population,
          (data.services ?? 0) / data.population
        ],
        label: '人口当たり（円/人）'
      };

    case 'normalized':
      const total = (data.goods ?? 0) + (data.services ?? 0);
      if (total <= 0) {
        return { values: [0, 0], label: '構成比' };
      }
      return {
        values: [
          (data.goods ?? 0) / total,
          (data.services ?? 0) / total
        ],
        label: '構成比'
      };

    default:
      return { values: [0, 0], label: 'データ不明' };
  }
}


//データの有無の判定
function hasMunicipalityData(data) {
  if (!data) return false;

  switch (currentValueMode) {
    case 'total':
      return data.total != null && !Number.isNaN(data.total)

    case 'perCapita':
      return (
        data.total != null &&
        !Number.isNaN(data.total) &&
        data.population != null &&
        !Number.isNaN(data.population) &&
        data.population > 0
      );

    case 'normalized':
      return data.total != null && !isNaN(data.total);

    default:
      return false;
  }
}



function resetMapStyle() {

  document.querySelectorAll('.box').forEach(rect => {
    rect.style.fill = '';
    rect.style.opacity = '';
    rect.style.pointerEvents = '';
  });
}

function updateMapView() {
  resetMapStyle();

  if (currentMapMode === 'heatmap') {
    applyHeatmap();
  }
}



//表示用数値の処理関数
function getMunicipalityValue(data) {
  if (!data) return null;

  switch (currentValueMode) {
    case 'total':
      return data.total;

    case 'perCapita':
      if (data.total == null || data.population == null || data.population <= 0) {
        return null;
      }
      return data.total / data.population;

    case 'normalized':
      return data.total;

    default:
      return null;
  }
}



//データ不明の市町村をグレーアウトさせたりする
//グレーアウト時にクリックイベントを無効化する必要はないかもしれない
function applyHeatmap() {
  if (!municipalityData || Object.keys(municipalityData).length === 0) return;
  
  currentMapMode = 'heatmap';

  const values = Object.values(municipalityData)
    .map(data => getMunicipalityValue(data))
    .filter(v => v != null && typeof v === 'number');


  if (values.length === 0) {
    console.warn('Heatmap: 有効な値がありません');
    resetMapStyle();
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  document.querySelectorAll('.box').forEach(rect => {
    const name = rect.id;
    const data = municipalityData[name];
    const value = getMunicipalityValue(data);

    if (value == null) {
      rect.style.fill = '#ccc';
      rect.style.opacity = '0.6';
      return;
    }

    rect.style.fill = getHeatColor(value, min, max);
    rect.style.opacity = '1';
    rect.style.pointerEvents = '';
  });
}



//ランキング生成
function buildRankingData() {
  const mapOrder = Array.from(
    document.querySelectorAll('.box')
  ).map(e => e.id);

  return mapOrder
    .filter(name => municipalityData[name])
    .map(name => {
      const data = municipalityData[name];
      const value = getMunicipalityValue(data); // number | null

      return {
        name,
        value
      };
    });
}



function updateRankingChart() {
  if (!rankingChart) return;
  const rankingData = buildRankingData();

  rankingChart.data.labels = rankingData.map(d => d.name);
  rankingChart.data.datasets[0].data =
    rankingData.map(d => d.value); 



  const rowHeight = 30;
  const minHeight = 400;

  const height = Math.max(
    rankingData.length * rowHeight ,
    minHeight
  );

  const canvas = document.getElementById('rankingChart');
  canvas.height = height;

  //リサイズをかけておかないと全部の区域を表示する際に各項目の文字がつぶれる。おそらくサイズを自動計算しているために生じているものだが、ちゃんと調査をしていない
  rankingChart.resize();  
  rankingChart.update();
}

function getHeatColor(value, min, max) {
  if (max === min) return '#bbdefb'; // 全部同じ値のとき
  const ratio = (value - min) / (max - min);

  // 青系グラデーション
  const start = { r: 253, g: 231, b: 227 }; // #e3f2fd
  const end   = { r: 226,  g: 51, b: 50 }; // #1e88e5

  const r = Math.round(start.r + ratio * (end.r - start.r));
  const g = Math.round(start.g + ratio * (end.g - start.g));
  const b = Math.round(start.b + ratio * (end.b - start.b));

  return `rgb(${r},${g},${b})`;
}

function getTotalsForHeatmap() {
  return Object.values(municipalityData)
    .filter(data => hasMunicipalityData(data))
    .map(data => data.total)
}

document
  .querySelectorAll('input[name="value-mode"]')
  .forEach(radio => {
    radio.addEventListener('change', e => {
      if (!e.target.checked) return;

      currentValueMode = e.target.value;

      if (currentMapMode === 'heatmap') {
        applyHeatmap();
      }

      updateRankingChart();
      hoverRect.style.display = 'none';
    });
});

document
  .querySelectorAll('input[name="map-mode"]')
  .forEach(radio => {
    radio.addEventListener('change', e => {
      if (!e.target.checked) return;

      currentMapMode = e.target.value;

      updateMapView();
      updateRankingChart();
      hoverRect.style.display = 'none';
    });
});

