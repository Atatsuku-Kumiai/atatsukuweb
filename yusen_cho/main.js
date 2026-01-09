let rankingChart;   // ★ファイル先頭のほう（Papa.parseより上でも下でもOK）
let municipalityData = {};
let rankingMode = 'map';  // 'map' または 'ranking'
let selectedMunicipality = null;  // ← 地図で最後に選択した市町村

Papa.parse('data/nara_purchases.csv', {
  download: true,
  header: true,
  dynamicTyping: true,
  complete: function(results){
    console.log(results.meta.fields);
    results.data.forEach(row => {
     if (!row.municipality) return;  // ★これを最初に追加

    municipalityData[row.municipality] = {
    goods: row.goods_amount != null
      ? Number(String(row.goods_amount).replace(/,/g, ''))
      : null,

    services: row.services_amount != null
      ? Number(String(row.services_amount).replace(/,/g, ''))
      : null,

    total: row.total_amount != null
      ? Number(String(row.total_amount).replace(/,/g, ''))
      : null,

    population: row.population != null
  ? Number(String(row.population).replace(/,/g, ''))
  : null,
      
    url: row.url
    };
    });


    results.data.forEach(row => {
    console.log(row.municipality, row.goods_amount, row.services_amount, row.total_amount);
    });

    // ▼▼▼ データ読込完了後にランキングチャート生成 ▼▼▼
    
    // マップ表示順（将来拡張用）
        const mapOrder = Array.from(document.querySelectorAll('.box')).map(e => e.id);

    // municipalityData をマップ順で並べた配列へ変換
        const rankingData = buildRankingData('map');      
    // ▲▲▲ ここまで ▲▲▲


    const labels = rankingData.map(d => d.name);
    const totals = rankingData.map(d => d.value);

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

        formatter:(v, ctx)=>{
          // ラベル（市町村名）取得
          const label = ctx.chart.data.labels[ctx.dataIndex];
          const goods = municipalityData[label]?.goods;
          const services = municipalityData[label]?.services;

          // goodsとservicesが両方無ければ「不明」
          //const isUnknown = (goods == null || goods === "") && (services == null || services === "");

          const total = municipalityData[label]?.total;

          // total が無ければ不明
          const isUnknown = (total == null || total === "" || Number.isNaN(total));

          // v が null/undefined/NaN のときは 0 として扱う（例外防止）
          let displayValue;
          if (v == null || v === '' || Number.isNaN(v)) {
            displayValue = 0;
          } else {
            displayValue = v;
          }

          if (isUnknown) return 'データ不明';  // ← 追加・置き換えポイント
          // ★ 表示モードで単位切替
          if (rankingMode === 'perCapita') {
            return Math.round(v).toLocaleString() + '円/人';
          } else {

          return displayValue.toLocaleString() + '円';

          }
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
//Papa.parse ここまで

// 見やすいステップ値を取得する関数
function getNiceStep(value) {
  if (value <= 1000) return 100;
  if (value <= 5000) return 500;
  if (value <= 10000) return 1000;
  if (value <= 50000) return 5000;
  if (value <= 100000) return 10000;
  if (value <= 500000) return 50000;
  return 100000;
}

//並び替え用の共通関数
function buildRankingData(mode) {
  let names = [];

  if (mode === 'map') {
    names = Array.from(document.querySelectorAll('.box')).map(e => e.id);
  } else {
    names = Object.keys(municipalityData);
  }

  let data = names
    .filter(name =>
      name &&                       // ← null / "" を除外
      municipalityData[name] &&     // ← データ存在
      municipalityData[name].total != null // ← total がある市町村のみ
    )

    .map(name => {
      const d = municipalityData[name];

      let value = null;
      if (mode === 'total') {
        value = d.total;
      } else if (mode === 'perCapita') {
        value =
          d.total != null && d.population
            ? d.total / d.population
            : null;
      } else { // map
        value = d.total;
      }

      return { name, value };
    });

  // ★ map 以外は並び替え
  if (mode !== 'map') {
    data.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  }

  return data;
}

//ランキングチャート更新関数
function updateRankingChart(mode) {
  if (!rankingChart) return; // ← 追加 安全チェック
  
  // ▼▼▼ 追加：ボタンの active 切り替え ▼▼▼
    document.querySelectorAll('.rank-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    if (mode === 'map') {
      document.getElementById('btn-map').classList.add('active');
    } else if (mode === 'total') {
      document.getElementById('btn-total').classList.add('active');
    } else if (mode === 'perCapita') {
      document.getElementById('btn-percapita').classList.add('active');
    }
    // ▲▲▲ 追加ここまで ▲▲▲

  rankingMode = mode;

  const rankingData = buildRankingData(mode);

  rankingChart.data.labels = rankingData.map(d => d.name);
  rankingChart.data.datasets[0].data = rankingData.map(d => d.value ?? 0);

  if (mode === 'perCapita') {
    rankingChart.data.datasets[0].label = '1人あたり（円/人）';

    const values = rankingData
      .map(d => d.value)
      .filter(v => v != null && !Number.isNaN(v));

    if (values.length === 0) {
      rankingChart.options.scales.x.max = 1;
      rankingChart.options.scales.x.ticks.stepSize = 1;
      rankingChart.options.scales.x.ticks.callback = () => '';
      rankingChart.update();
      return;
    }

    const maxValue = Math.max(...values);

    // ★ きりのいい step を先に決める
    const step = getNiceStep(maxValue);

    // ★ step を基準に max を切り上げ
    const autoMax = Math.ceil(maxValue / step) * step;

    rankingChart.options.scales.x.max = autoMax;
    rankingChart.options.scales.x.ticks.stepSize = step;

    rankingChart.options.scales.x.ticks.callback =
      v => v.toLocaleString() + '円/人';
  


  } else {
    rankingChart.data.datasets[0].label = '合計額（円）';

    // 合計額は従来どおり固定
    rankingChart.options.scales.x.max = 50000000;
    rankingChart.options.scales.x.ticks.stepSize = 5000000;
    rankingChart.options.scales.x.ticks.callback =
      v => v.toLocaleString() + '円';
  }

  // ▼▼▼ 選択市町村があれば赤表示を復元 ▼▼▼
  if (selectedMunicipality && rankingChart) {

    // 棒の色
    rankingChart.data.datasets[0].backgroundColor =
      rankingChart.data.labels.map(label =>
        label === selectedMunicipality
          ? 'rgba(255,0,0,0.9)'
          : 'rgba(54,162,235,0.6)'
      );

    // Y軸ラベル文字色
    rankingChart.options.scales.y.ticks.color = (ctx) =>
      ctx.tick.label === selectedMunicipality ? 'red' : '#555';

    // 棒の数値（datalabels）の色
    rankingChart.options.plugins.datalabels.color = (ctx) => {
      const label = rankingChart.data.labels[ctx.dataIndex];
      return label === selectedMunicipality ? 'red' : '#555';
    };
  }

  rankingChart.update();
}


// =========================
// ボタン操作
// =========================
document.getElementById('btn-map')?.addEventListener('click', () => {
  updateRankingChart('map');
});

document.getElementById('btn-total')?.addEventListener('click', () => {
  updateRankingChart('total');
});

document.getElementById('btn-percapita')?.addEventListener('click', () => {
  updateRankingChart('perCapita');
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
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (value, ctx) => {
          const name = ctx.chart.options.plugins.title.text;
          const d = municipalityData[name];

          // goods / services 両方 null の市町村
          if (d && d.goods == null && d.services == null) {
            return '不明';
          }

          return value.toLocaleString() + '円';
        },
        font: { weight: 'bold' }
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
    selectedMunicipality = name;   // ★ 選択状態を記憶
    if(!data) return;

    // ▼ ▼ ここでリンク作成（URLは例。自由に変更OK） ▼ ▼
    const url = data.url || `pages/${name}.html`;  // URLが無い場合は詳細ページにも飛ばせる
    const titleEl = document.getElementById('chart-title');
      titleEl.textContent = '';
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.textContent = name;
      titleEl.appendChild(a);


    // グラフ更新
    if (data.goods == null && data.services == null) {
      // 両方不明 → 数値は出さず、ラベルはそのまま
      chart.data.datasets[0].data = [0, 0];
      chart.data.labels = ['物品', '役務'];
    } else {
      chart.data.datasets[0].data = [
        data.goods ?? 0,
        data.services ?? 0
      ];
      chart.data.labels = ['物品', '役務'];
    }

    chart.options.plugins.title.text = name;
    chart.update();


    // ▼ ここに差し替え（他は変更不要）
    let total;

    // total_amount が無ければ不明扱い
    const isUnknown =
    data.total == null || data.total === "" || isNaN(data.total);

    if(isUnknown){
    total = 0;
    document.getElementById('total-label').innerText = '合計: 0円（不明）';
    }else{
    total = data.total;
    document.getElementById('total-label').innerText =
    '合計: ' + total.toLocaleString() + '円（' + toJapaneseAmount(total) + '）';
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
    rankingChart.options.scales.y.ticks.color = (ctx) =>
    ctx.tick.label === name ? 'red' : '#555';

    // 棒グラフ横の数字（datalabels）の色変更
    rankingChart.options.plugins.datalabels.color = (ctx) => {
    const label = rankingChart.data.labels[ctx.dataIndex];
    return label === name ? 'red' : '#555';   // 選択市は赤、それ以外はグレー
    };

    rankingChart.update();
    }
    // ▲▲▲ 追記ここまで ▲▲▲

// グラフ更新 の直後あたりに if追加（※任意）
if(data.total == null || isNaN(data.total)){
  document.getElementById('total-label').innerText = 'データ不明';
}

  }); // ← ★ これを追加（addEventListener）
});   // ← ★ これを追加（forEach）

function handleResize() {
  if (!chart) return; // ← 安全チェック（重要）

  const scale = Math.min(Math.max(window.innerWidth / 1400, 0.8), 1.3);  // ★ 



  /* resizeMap(); // マップのリサイズ */

  // グラフのリサイズ
  if (rankingChart) {
  rankingChart.resize();
}

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

