/* גרף בוזוקי — לרוחב · 8 מיתרים · סריגים אנכיים · עיצוב מקצועי */
const Highway = (() => {
  const STRING_HE = ['דו', 'פה', 'לה', 'רה'];
  const STRING_EN = ['C', 'F', 'A', 'D'];
  const NUM_FRETS = 6;
  const PAIRS = 4;
  let lastGeom = null;
  let lastViewStart = 0;

  const WOOD = { dark: '#3d2514', base: '#6b4428', light: '#a0724a' };

  function calcViewStart(markers) {
    const frets = markers
      .filter(m => m.fret !== 'x' && typeof m.fret === 'number' && m.fret > 0)
      .map(m => m.fret);
    if (!frets.length) return 0;
    if (Math.max(...frets) <= NUM_FRETS) return 0;
    return Math.max(0, Math.min(...frets) - 1);
  }

  function geom(w, h) {
    const padT = Math.min(34, h * 0.14);
    const padB = Math.min(14, h * 0.06);
    const labelColW = Math.min(34, w * 0.09);
    const catchW = Math.min(40, w * 0.1);
    const padL = labelColW + 6;
    const nutX = padL + 4;
    const catchX = w - catchW * 0.55;
    const gridRight = catchX - catchW * 0.35;
    const gridW = gridRight - nutX;
    const frW = gridW / NUM_FRETS;
    const maxGridH = Math.min(h - padT - padB - 4, w * 0.52);
    const gridH = Math.max(80, maxGridH);
    const gridTop = padT + 6;
    const gridBot = gridTop + gridH;
    const courseStep = gridH / 3.15;
    const pairGap = Math.min(7, courseStep * 0.22);
    const catchLeft = catchX - catchW * 0.42;
    const catchRight = w - 4;

    function stringCenterY(course) {
      return gridTop + course * courseStep + courseStep * 0.42;
    }

    function stringY(course, side) {
      const cy = stringCenterY(course);
      return cy - pairGap / 2 + side * pairGap;
    }

    function columnX(fret, viewStart) {
      if (fret === 0) return nutX - frW * 0.12;
      return nutX + (fret - viewStart - 0.5) * frW;
    }

    function fretWireX(fi) { return nutX + fi * frW; }

    return {
      w, h, padT, padB, padL, labelColW, catchW, nutX, catchX, catchLeft, catchRight,
      gridTop, gridBot, gridH, gridW, gridRight, frW, courseStep, pairGap,
      stringCenterY, stringY, columnX, fretWireX,
    };
  }

  function roundRect(cctx, x, y, rw, rh, r) {
    cctx.beginPath();
    cctx.moveTo(x + r, y);
    cctx.lineTo(x + rw - r, y);
    cctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
    cctx.lineTo(x + rw, y + rh - r);
    cctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
    cctx.lineTo(x + r, y + rh);
    cctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
    cctx.lineTo(x, y + r);
    cctx.quadraticCurveTo(x, y, x + r, y);
    cctx.closePath();
  }

  function drawBackground(cctx, g) {
    const bg = cctx.createLinearGradient(0, 0, g.w, 0);
    bg.addColorStop(0, '#101820');
    bg.addColorStop(1, '#0a0e14');
    cctx.fillStyle = bg;
    cctx.fillRect(0, 0, g.w, g.h);
  }

  function drawWood(cctx, g) {
    const x = g.nutX - 6;
    const y = g.gridTop - 5;
    const w = g.catchRight - x + 2;
    const h = g.gridH + 10;
    const wood = cctx.createLinearGradient(x, y, x, y + h);
    wood.addColorStop(0, WOOD.light);
    wood.addColorStop(0.45, WOOD.base);
    wood.addColorStop(1, WOOD.dark);
    roundRect(cctx, x, y, w, h, 4);
    cctx.fillStyle = wood;
    cctx.fill();
    cctx.strokeStyle = 'rgba(20,12,8,0.5)';
    cctx.lineWidth = 2;
    cctx.stroke();
    for (let i = 0; i < 16; i++) {
      const gy = y + (h * i) / 16;
      cctx.strokeStyle = 'rgba(0,0,0,0.05)';
      cctx.beginPath();
      cctx.moveTo(x, gy);
      cctx.lineTo(x + w, gy + 1);
      cctx.stroke();
    }
  }

  function drawNut(cctx, g, viewStart) {
    cctx.fillStyle = viewStart > 0 ? '#c8d4e0' : '#f5ead8';
    cctx.fillRect(g.nutX - 2, g.gridTop - 2, 4, g.gridH + 4);
    if (viewStart > 0) {
      cctx.fillStyle = '#1a1408';
      cctx.font = '900 10px Heebo, sans-serif';
      cctx.textAlign = 'center';
      cctx.textBaseline = 'bottom';
      cctx.fillText(String(viewStart), g.nutX, g.gridTop - 4);
    }
  }

  function drawFretWire(cctx, g, x) {
    const grd = cctx.createLinearGradient(x - 1, 0, x + 1, 0);
    grd.addColorStop(0, '#606870');
    grd.addColorStop(0.5, '#eef1f5');
    grd.addColorStop(1, '#606870');
    cctx.strokeStyle = grd;
    cctx.lineWidth = 2.5;
    cctx.beginPath();
    cctx.moveTo(x, g.gridTop);
    cctx.lineTo(x, g.gridBot);
    cctx.stroke();
  }

  function drawFretLabels(cctx, g, viewStart) {
    for (let f = 1; f <= NUM_FRETS; f++) {
      const x = g.fretWireX(f);
      const label = viewStart + f;
      cctx.fillStyle = '#9aabb8';
      cctx.font = '700 9px Heebo, sans-serif';
      cctx.textAlign = 'center';
      cctx.textBaseline = 'bottom';
      cctx.fillText(String(label), x - g.frW * 0.5, g.gridTop - 2);
      if ([3, 5, 7, 12].includes(label)) {
        const cy = (g.gridTop + g.gridBot) / 2;
        cctx.fillStyle = 'rgba(20,12,8,0.45)';
        cctx.beginPath();
        cctx.arc(x - g.frW * 0.5, cy, 3, 0, Math.PI * 2);
        cctx.fill();
      }
    }
  }

  function drawStringLine(cctx, x1, x2, y, lw, bright) {
    const grd = cctx.createLinearGradient(x1, y - 1, x1, y + 1);
    grd.addColorStop(0, 'rgba(90,100,110,0.4)');
    grd.addColorStop(0.5, bright ? '#f5f7fa' : 'rgba(170,180,190,0.55)');
    grd.addColorStop(1, 'rgba(70,80,90,0.4)');
    cctx.strokeStyle = grd;
    cctx.lineWidth = lw;
    cctx.beginPath();
    cctx.moveTo(x1, y);
    cctx.lineTo(x2, y);
    cctx.stroke();
  }

  function drawStrings(cctx, g, activeCourses) {
    const active = activeCourses ? new Set(activeCourses) : null;
    const x2 = g.catchRight - 2;
    for (let c = 0; c < PAIRS; c++) {
      const on = !active || active.has(c);
      const lw = 0.9 + c * 0.4;
      for (let s = 0; s < 2; s++) {
        drawStringLine(cctx, g.nutX, x2, g.stringY(c, s), lw, on && c >= 2);
      }
    }
  }

  function drawStringLabels(cctx, g, activeCourses) {
    const active = activeCourses ? new Set(activeCourses) : null;
    for (let c = 0; c < PAIRS; c++) {
      const cy = g.stringCenterY(c);
      const on = !active || active.has(c);
      cctx.textAlign = 'right';
      cctx.textBaseline = 'middle';
      cctx.fillStyle = on ? '#e8c878' : '#6a8098';
      cctx.font = '800 11px Heebo, sans-serif';
      cctx.fillText(STRING_HE[c], g.padL - 2, cy - 5);
      cctx.fillStyle = on ? '#ffd86b' : '#5a7088';
      cctx.font = '700 9px Heebo, sans-serif';
      cctx.fillText(`מ${c + 1}`, g.padL - 2, cy + 7);
    }
  }

  function drawCatchZone(cctx, g) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200);
    const x = g.catchLeft;
    const w = g.catchRight - x;
    const grd = cctx.createLinearGradient(x, 0, x + w, 0);
    grd.addColorStop(0, 'rgba(35,24,14,0.85)');
    grd.addColorStop(1, 'rgba(50,34,20,0.9)');
    cctx.fillStyle = grd;
    cctx.fillRect(x, g.gridTop - 4, w, g.gridH + 8);

    cctx.strokeStyle = `rgba(220,180,90,${0.5 + pulse * 0.35})`;
    cctx.lineWidth = 2.5;
    cctx.beginPath();
    cctx.moveTo(g.catchX, g.gridTop - 4);
    cctx.lineTo(g.catchX, g.gridBot + 4);
    cctx.stroke();

    for (let c = 0; c < PAIRS; c++) {
      const cy = g.stringCenterY(c);
      cctx.beginPath();
      cctx.ellipse(g.catchX, cy, 12, g.pairGap + 4, 0, 0, Math.PI * 2);
      cctx.strokeStyle = `rgba(220,180,90,${0.2 + pulse * 0.15})`;
      cctx.lineWidth = 1.2;
      cctx.stroke();
    }

    cctx.save();
    cctx.translate(g.catchX + 10, (g.gridTop + g.gridBot) / 2);
    cctx.rotate(-Math.PI / 2);
    cctx.fillStyle = 'rgba(220,190,120,0.8)';
    cctx.font = '700 9px Heebo, sans-serif';
    cctx.textAlign = 'center';
    cctx.fillText('נגינה', 0, 0);
    cctx.restore();
  }

  function drawPearlDot(cctx, cx, cy, rx, ry, text, ghost) {
    cctx.save();
    if (ghost) cctx.globalAlpha = 0.8;
    cctx.shadowColor = 'rgba(0,0,0,0.4)';
    cctx.shadowBlur = ghost ? 3 : 6;
    cctx.shadowOffsetX = 1;
    const dot = cctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, ry);
    dot.addColorStop(0, '#fff8e8');
    dot.addColorStop(0.4, '#e8c868');
    dot.addColorStop(1, '#9a6828');
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    cctx.fillStyle = dot;
    cctx.fill();
    cctx.strokeStyle = 'rgba(255,255,255,0.6)';
    cctx.lineWidth = 1.5;
    cctx.stroke();
    if (text) {
      cctx.shadowBlur = 0;
      cctx.fillStyle = '#1a0c04';
      cctx.font = `900 ${ry > 9 ? 12 : 10}px Heebo, sans-serif`;
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';
      cctx.fillText(text, cx, cy);
    }
    cctx.restore();
  }

  function drawLabelPill(cctx, cx, cy, lines, side) {
    const fs = [12, 9];
    let maxW = 0;
    lines.forEach((t, i) => {
      cctx.font = `${i === 0 ? 900 : 700} ${fs[i]}px Heebo, sans-serif`;
      maxW = Math.max(maxW, cctx.measureText(t).width);
    });
    const pw = maxW + 14;
    const ph = lines.length === 1 ? 18 : 30;
    const px = side === 'left' ? cx - pw - 10 : cx + 10;
    const py = cy - ph / 2;
    cctx.fillStyle = 'rgba(0,0,0,0.85)';
    roundRect(cctx, px, py, pw, ph, 4);
    cctx.fill();
    cctx.strokeStyle = 'rgba(240,204,116,0.7)';
    cctx.lineWidth = 1.2;
    cctx.stroke();
    cctx.textAlign = 'center';
    lines.forEach((t, i) => {
      cctx.fillStyle = i === 0 ? '#ffd86b' : '#e8dcc8';
      cctx.font = `${i === 0 ? 900 : 700} ${fs[i]}px Heebo, sans-serif`;
      cctx.fillText(t, px + pw / 2, py + 11 + i * 13);
    });
  }

  function drawStaticMarker(cctx, g, m, viewStart) {
    if (m.fret === 'x') {
      cctx.fillStyle = '#c03030';
      cctx.font = '900 14px Heebo, sans-serif';
      cctx.textAlign = 'right';
      cctx.textBaseline = 'middle';
      cctx.fillText('×', g.nutX - 6, g.stringCenterY(m.courseIdx));
      return;
    }
    const cy = g.stringCenterY(m.courseIdx);
    const cx = g.columnX(m.fret, viewStart);
    if (cx < g.nutX - 5 || cx > g.gridRight) return;
    if (m.fret === 0) {
      cctx.strokeStyle = '#5fc88f';
      cctx.lineWidth = 2;
      cctx.beginPath();
      cctx.arc(g.nutX - 4, cy, 5, 0, Math.PI * 2);
      cctx.stroke();
      return;
    }
    drawPearlDot(cctx, cx, cy, g.pairGap + 2, 9, String(m.fret), true);
  }

  function approachLabels(m) {
    const str = `מיתר ${m.courseIdx + 1} · ${STRING_HE[m.courseIdx]}`;
    if (m.fret === 0) return ['פתוח ○', str];
    const fretLine = `סריג ${m.fret}`;
    if (m.label && m.label.length <= 3) return [fretLine, `${str} · ${m.label}`];
    return [fretLine, str];
  }

  function drawApproachMarker(cctx, g, m, timeToHit, pxPerSec, status) {
    if (m.fret === 'x') return;
    const cy = g.stringCenterY(m.courseIdx);
    const cx = g.catchX - timeToHit * pxPerSec;
    const main = m.fret === 0 ? '○' : String(m.fret);
    cctx.save();
    if (status === 'perfect' || status === 'good') cctx.globalAlpha = 0.35;
    if (status === 'wrong' || status === 'miss') {
      drawPearlDot(cctx, cx, cy, g.pairGap + 2, 10, '!', false);
    } else {
      drawPearlDot(cctx, cx, cy, g.pairGap + 2, 10, main, false);
      if (status !== 'perfect' && status !== 'good') {
        drawLabelPill(cctx, cx, cy, approachLabels(m), cx > g.w * 0.55 ? 'left' : 'right');
      }
    }
    cctx.restore();
  }

  function noteMarkers(note) {
    return [{ courseIdx: 3, fret: note.fret, label: note.label || note.solfege || '' }];
  }

  function chordMarkers(chordId) {
    const ch = getChord(chordId);
    if (!ch) return [];
    return ch.shape.map((f, i) => ({ courseIdx: i, fret: f, label: '' }));
  }

  function activeCoursesForTarget(tg, gameType) {
    const set = new Set();
    if (gameType === 'note') set.add(3);
    else getChord(tg.chordId)?.shape.forEach((f, i) => { if (f !== 'x') set.add(i); });
    return set;
  }

  function upcomingCaption(tg, gameType) {
    if (!tg) return '';
    if (gameType === 'note') {
      const n = tg.note;
      if (n.fret === 0) return `${n.label || n.solfege} · מיתר 4 (רה) · פתוח ○`;
      return `${n.label || n.solfege} · סריג ${n.fret} · מיתר 4 (רה)`;
    }
    return `${tg.chordId} — ${LearnGraph.shapeHint(tg.chordId)}`;
  }

  function targetViewStart(targets, tNow, gameType) {
    let best = null, bestDt = Infinity;
    targets.forEach(tg => {
      if (tg.status) return;
      const dt = tg.t - tNow;
      if (dt >= -0.2 && dt < bestDt) { bestDt = dt; best = tg; }
    });
    if (!best) return 0;
    const markers = gameType === 'note' ? noteMarkers(best.note) : chordMarkers(best.chordId);
    return calcViewStart(markers);
  }

  function drawCaption(cctx, g, text) {
    cctx.fillStyle = 'rgba(0,0,0,0.45)';
    cctx.fillRect(0, 0, g.w, g.padT + 2);
    cctx.fillStyle = '#e8c878';
    cctx.font = `700 ${g.w < 300 ? 10 : 12}px Heebo, sans-serif`;
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillText(text, g.w / 2, g.padT * 0.42);
  }

  function drawFrame(cctx, opts) {
    const { w, h, pxPerSec, viewStart, gameType, targets, upcoming, countIn, clickHint, tNow } = opts;
    const g = geom(w, h);
    lastGeom = g;
    lastViewStart = viewStart;

    drawBackground(cctx, g);
    if (upcoming) drawCaption(cctx, g, upcomingCaption(upcoming, gameType));
    else drawCaption(cctx, g, 'בוזוקי · גרף לרוחב · 8 מיתרים (4 זוגות)');

    drawWood(cctx, g);
    for (let f = 1; f <= NUM_FRETS; f++) drawFretWire(cctx, g, g.fretWireX(f));
    drawNut(cctx, g, viewStart);
    drawFretLabels(cctx, g, viewStart);

    const active = upcoming ? [...activeCoursesForTarget(upcoming, gameType)] : null;
    drawStrings(cctx, g, active);
    drawStringLabels(cctx, g, active);

    if (upcoming) {
      const shape = gameType === 'note' ? noteMarkers(upcoming.note) : chordMarkers(upcoming.chordId);
      shape.forEach(m => drawStaticMarker(cctx, g, m, viewStart));
    }

    drawCatchZone(cctx, g);

    if (clickHint) {
      const cx = clickHint.atCatch ? g.catchX : g.columnX(clickHint.fret || 0, viewStart);
      const cy = g.stringCenterY(clickHint.course);
      cctx.strokeStyle = '#e8c878';
      cctx.lineWidth = 2;
      cctx.beginPath();
      cctx.arc(cx, cy, 14, 0, Math.PI * 2);
      cctx.stroke();
    }

    if (countIn > 0) {
      cctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(cctx, w * 0.38, h * 0.28, w * 0.24, 56, 6);
      cctx.fill();
      cctx.fillStyle = '#e8c878';
      cctx.font = '900 40px Heebo, sans-serif';
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';
      cctx.fillText(String(countIn), w / 2, h * 0.34);
    }

    for (const tg of targets) {
      const timeToHit = tg.t - tNow;
      if (timeToHit < -0.4) continue;
      if (timeToHit * pxPerSec > g.catchX - g.nutX + 60) continue;
      const markers = gameType === 'note' ? noteMarkers(tg.note) : chordMarkers(tg.chordId);
      markers.forEach(m => drawApproachMarker(cctx, g, m, timeToHit, pxPerSec, tg.status));
    }

    return g;
  }

  function hitTest(x, y, w, h) {
    const g = lastGeom || geom(w, h);
    const viewStart = lastViewStart;
    if (y < g.gridTop - 10 || y > g.gridBot + 10) return null;

    let course = 0, bestDy = Infinity;
    for (let c = 0; c < PAIRS; c++) {
      const dy = Math.abs(y - g.stringCenterY(c));
      if (dy < bestDy) { bestDy = dy; course = c; }
    }
    if (bestDy > g.courseStep * 0.45) return null;

    if (x >= g.catchLeft) {
      return {
        course, fret: null, atCatch: true, stringNum: course + 1,
        name: STRING_HE[course],
        text: `נקודת נגינה · מיתר ${course + 1} (${STRING_HE[course]})`,
      };
    }
    if (x < g.nutX - 8 || x > g.gridRight + 10) return null;

    let fret = 0;
    if (x >= g.nutX) {
      fret = Math.round(viewStart + (x - g.nutX) / g.frW + 0.5);
      if (fret < 1) fret = 1;
    }
    return {
      course, fret, atCatch: false, stringNum: course + 1,
      name: STRING_HE[course], text: Fretboard.pressText(course, fret),
    };
  }

  function catchPoint(course) {
    const g = lastGeom;
    return g ? { x: g.catchX, y: g.stringCenterY(course) } : null;
  }

  return {
    geom, drawFrame, hitTest, catchPoint, activeCoursesForTarget, upcomingCaption,
    calcViewStart, targetViewStart, noteMarkers, chordMarkers,
    STRING_HE, NUM_FRETS, PAIRS,
  };
})();
