/**
 * rough-table.js
 * 依存: rough.js (グローバルの `rough` オブジェクトが必要)
 *
 * 使い方 A: table に直接クラスをつける
 *   <table class="rough-table" data-mode="solid">
 *
 * 使い方 B: 外側の要素にクラスをつける（MDパーサー対応）
 *   <div class="rough-table-outer" data-mode="solid">
 *     <!-- MDパーサーが生成した <table> がここに入る -->
 *   </div>
 *
 * data属性オプション（A はtable自身、B は外側要素に書く）:
 *   data-roughness   : 線のガタつき具合 (default: 1.5)
 *   data-stroke      : 線の色          (default: "#444")
 *   data-stroke-width: 線の太さ        (default: 2)
 *   data-bowing      : 線の湾曲        (default: 1)
 *   data-mode        : "cell"(default) | "solid"
 *   data-border      : "full"(default) | "outer" | "inner" | "rows"
 */
(function (global) {
  'use strict';

  const TRIGGER_CLASS   = 'rough-table';
  const OUTER_CLASS     = 'rough-table-outer';
  const CONTAINER_CLASS = 'rough-table-container';
  const SVG_ATTR        = '_roughTableSvg';

  const DEFAULTS = {
    roughness: 1.5,
    stroke: '#444',
    strokeWidth: 2,
    bowing: 1,
    mode: 'solid',
    border: 'full',
  };

  // ---- オプション取得（読み取り元はtableかouterか） ----
  function parseOptions(el) {
    const d = el.dataset;
    return {
      roughness:   parseFloat(d.roughness   ?? DEFAULTS.roughness),
      stroke:               d.stroke        ?? DEFAULTS.stroke,
      strokeWidth: parseFloat(d.strokeWidth ?? DEFAULTS.strokeWidth),
      bowing:      parseFloat(d.bowing      ?? DEFAULTS.bowing),
      mode:                 d.mode          ?? DEFAULTS.mode,
      border:               d.border        ?? DEFAULTS.border,
    };
  }

  // ---- テーブル1つ分を描画（optionsEl: オプションの読み取り元） ----
  function draw(table, optionsEl) {
    if (typeof rough === 'undefined') {
      console.warn('[rough-table] rough.js が読み込まれていません。');
      return;
    }

    optionsEl = optionsEl || table;

    // 前回のSVGを削除
    if (table[SVG_ATTR]) {
      table[SVG_ATTR].remove();
      table[SVG_ATTR] = null;
    }

    // コンテナでラップ（まだなら）
    let container = table.parentElement;
    if (!container.classList.contains(CONTAINER_CLASS)) {
      container = document.createElement('div');
      container.className = CONTAINER_CLASS;
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    }

    Object.assign(container.style, { position: 'relative', display: 'inline-block' });
    Object.assign(table.style, {
      borderCollapse: 'collapse',
      position: 'relative',
      zIndex: '1',
      background: 'transparent',
    });
    table.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = 'none';
    });

    // SVG作成
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.assign(svg.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      zIndex: '0',
    });
    svg.setAttribute('width', table.offsetWidth);
    svg.setAttribute('height', table.offsetHeight);
    container.insertBefore(svg, table);
    table[SVG_ATTR] = svg;

    const rc = rough.svg(svg);
    const opts = parseOptions(optionsEl);
    const lineOpts = {
      stroke: opts.stroke,
      strokeWidth: opts.strokeWidth,
      roughness: opts.roughness,
      bowing: opts.bowing,
    };

    const tableRect = table.getBoundingClientRect();
    const rows = Array.from(table.rows);

    if (opts.mode === 'solid') {
      drawSolid(rows, tableRect, svg, rc, lineOpts, opts.border);
    } else {
      drawCell(rows, tableRect, svg, rc, lineOpts, opts.border);
    }
  }

  // ---- cellモード ----
  function drawCell(rows, tableRect, svg, rc, lineOpts, border) {
    const totalRows = rows.length;
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.cells);
      cells.forEach((cell, colIndex) => {
        const r = cell.getBoundingClientRect();
        const x = r.left - tableRect.left;
        const y = r.top  - tableRect.top;
        const w = r.width;
        const h = r.height;

        const isFirstRow = rowIndex === 0;
        const isLastRow  = rowIndex === totalRows - 1;
        const isFirstCol = colIndex === 0;
        const isLastCol  = colIndex === cells.length - 1;
        const isHeader   = cell.tagName === 'TH';

        let top, bottom, left, right;
        switch (border) {
          case 'outer':
            top = isFirstRow; bottom = isLastRow; left = isFirstCol; right = isLastCol;
            break;
          case 'inner':
            top = false; bottom = !isLastRow; left = !isFirstCol; right = false;
            break;
          case 'rows':
            top = isFirstRow; bottom = true; left = false; right = false;
            break;
          default: // 'full'
            top = isFirstRow || isHeader; bottom = true; left = true; right = isLastCol;
        }

        if (top)    svg.appendChild(rc.line(x,     y,     x + w, y,     lineOpts));
        if (bottom) svg.appendChild(rc.line(x,     y + h, x + w, y + h, lineOpts));
        if (left)   svg.appendChild(rc.line(x,     y,     x,     y + h, lineOpts));
        if (right)  svg.appendChild(rc.line(x + w, y,     x + w, y + h, lineOpts));
      });
    });
  }

  // ---- solidモード ----
  function drawSolid(rows, tableRect, svg, rc, lineOpts, border) {
    const W = tableRect.width;
    const H = tableRect.height;

    const drawHLines = () => {
      rows.slice(0, -1).forEach(row => {
        const y = row.getBoundingClientRect().bottom - tableRect.top;
        svg.appendChild(rc.line(0, y, W, y, lineOpts));
      });
    };

    const drawVLines = () => {
      const xSet = new Set();
      rows.forEach(row => {
        Array.from(row.cells).slice(0, -1).forEach(cell => {
          const x = Math.round(cell.getBoundingClientRect().right - tableRect.left);
          xSet.add(x);
        });
      });
      xSet.forEach(x => svg.appendChild(rc.line(x, 0, x, H, lineOpts)));
    };

    switch (border) {
      case 'outer':
        svg.appendChild(rc.rectangle(0, 0, W, H, lineOpts));
        break;
      case 'inner':
        drawHLines(); drawVLines();
        break;
      case 'rows':
        svg.appendChild(rc.line(0, 0, W, 0, lineOpts));
        svg.appendChild(rc.line(0, H, W, H, lineOpts));
        drawHLines();
        break;
      default: // 'full'
        svg.appendChild(rc.rectangle(0, 0, W, H, lineOpts));
        drawHLines(); drawVLines();
    }
  }

  // ---- ResizeObserverで自動再描画 ----
  function observe(table, optionsEl) {
    if (!window.ResizeObserver) return;
    const observer = new ResizeObserver(() => draw(table, optionsEl));
    observer.observe(table);
  }

  // ---- 初期化 ----
  function init(selector) {
    // A: <table class="rough-table">
    document.querySelectorAll(selector || '.' + TRIGGER_CLASS).forEach(table => {
      draw(table);
      observe(table);
    });

    // B: <div class="rough-table-outer"> ... <table> ... </div>
    // selector指定時はouterクラスの自動探索はスキップ
    if (selector) return;
    document.querySelectorAll('.' + OUTER_CLASS).forEach(outer => {
      const table = outer.querySelector('table');
      if (!table) return;
      draw(table, outer);
      observe(table, outer);
    });
  }

  // ---- DOMContentLoaded で自動実行 ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  // ---- パブリックAPI ----
  global.RoughTable = { init, draw };

})(window);
