let rankingChart;   // ★ファイル先頭のほう（Papa.parseより上でも下でもOK）
let municipalityData = {};
Papa.parse('data/nara_purchases.csv', {
  download: true,
  header: true,
  dynamicTyping: true,
  complete: function(results){
    results.data.forEach(row=>{
      municipalityData[row.municipality] = { goods: row.goods_amount, services: row.services_amount, url: row.url };
    });

    // ▼▼▼ データ読込完了後にランキングチャート生成 ▼▼▼
    
    // ▼▼▼ ここから マップ順に並べ替え ▼▼▼
        const mapOrder = Array.from(document.querySelectorAll('.box')).map(e => e.id);

    // municipalityData をマップ順で並べた配列へ変換
        const rankingData = mapOrder
        .filter(name => municipalityData[name])  // CSVに存在する市町村のみ
        .map(name => ({
            name: name,
            total: (municipalityData[name].goods || 0) + (municipalityData[name].services || 0)
        }));
    // ▲▲▲ ここまで ▲▲▲


    const labels = rankingData.map(d => d.name);
    const totals = rankingData.map(d => d.total);

    const ctxRanking = document.getElementById('rankingChart').getContext('2d');

    // ▼ 市町村数に応じて高さを調整（1行あたり px × 件数）
    const rowHeight = 30;             // 行の高さ調整したければここを変える
    const chartHeight = rankingData.length * rowHeight;
    document.getElementById('rankingChart').height = chartHeight; 
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
          const isUnknown = (goods == null || goods === "") && (services == null || services === "");

          // v が null/undefined/NaN のときは 0 として扱う（例外防止）
          let displayValue;
          if (v == null || v === '' || Number.isNaN(v)) {
            displayValue = 0;
          } else {
            displayValue = v;
          }

          if (isUnknown) return 'データ不明';  // ← 追加・置き換えポイント

          return displayValue.toLocaleString() + '円';


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
function toJapaneseAmount(num) {
  const oku = Math.floor(num / 100000000);
  const man = Math.floor((num % 100000000) / 10000);
  const yen = num % 10000; // 万より下の単位をそのまま

  let result = '';
  if (oku > 0) result += oku + '億';
  if (man > 0) result += man + '万';

  // 万未満（1〜9999円）を4桁ゼロ埋めにして接続（桁揃えで自然になる）
  if (yen > 0 || result === '') result += yen + '円';
  else result += '円';

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
    chart.data.datasets[0].data = [
      data.goods ?? 0,
      data.services ?? 0
    ];

    chart.options.plugins.title.text = name;
    chart.update();

    // ▼ ここに差し替え（他は変更不要）
    let total;

    // goods/servicesが空欄・null・undefinedなら不明扱い
    const isUnknown =
      (data.goods == null || data.goods === "" || isNaN(data.goods)) &&
      (data.services == null || data.services === "" || isNaN(data.services));

    if(isUnknown){
      total = 0;
      document.getElementById('total-label').innerText = '合計: 0円（不明）';
    }else{
      total = (data.goods||0) + (data.services||0);
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

// グラフ更新 の直後あたりに if追加（※任意）
if(data.goods == null && data.services == null){
  document.getElementById('total-label').innerText = 'データ不明';
} else {
  //今のまま
}// グラフ更新 の直後あたりに if追加（※任意）
if(data.goods == null && data.services == null){
  document.getElementById('total-label').innerText = 'データ不明';
} else {
  //今のまま
}

  });
});

function handleResize() {
  if (!chart) return; // ← 安全チェック（重要）

  const scale = window.innerWidth / 1400;  // ★ 

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

