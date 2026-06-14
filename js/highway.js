/* גרף משחק — עיצוב בוזוקי אמיתי · 8 מיתרים · אזור תפיסה */
const Highway = (() => {
  const STRING_HE = ['דו', 'פה', 'לה', 'רה'];
  const STRING_EN = ['C', 'F', 'A', 'D'];
  const NUM_FRETS = 5;
  const PAIRS = 4;
  let lastGeom = null;
  let lastViewStart = 0;

  const WOOD = {
    base: '#6b4428',
    light: '#a0724a',
    dark: '#3d2514',
    grain: 'rgba(0,0,0,0.06)',
  };

  function calcViewStart(markers) {
    const frets = markers
      .filter(m => m.fret !== 'x' && typeof m.fret === 'number' && m.fret > 0)
      .map(m => m.fret);
    if (!frets.length) return 0;
    if (Math.max(...frets) <= NUM_FRETS) return 0;
    return Math.max(0, Math.min(...frets) - 1);
  }

  function geom(w, h) {
    const padT = Math.min(38, h * 0.11);
    const padB = Math.min(54, h * 0.15);
    const padL = Math.min(42, w * 0.11);
    const gridTop = padT + 10;
    const catchZoneH = Math.min(46, h * 0.11);
    const gridBot = h - padB - catchZoneH;
    const gridH = gridBot - gridTop;
    const frH = gridH / NUM_FRETS;
    const courseW = (w - padL - 14) / PAIRS;
    const pairGap = Math.min(9, courseW * 0.2);
    const nutY = gridTop;
    const catchY = gridBot + catchZoneH * 0.5;
    const catchTop = gridBot + 3;
    const catchBot = gridBot + catchZoneH;
    const boardW = courseW * PAIRS;

    function courseCenterX(course) {
      return padL + course * courseW + courseW / 2;
    }

    function stringX(course, side) {
      const cx = courseCenterX(course);
      return cx - pairGap / 2 + side * pairGap;
    }

    function rowY(fret, viewStart) {
      if (fret === 0) return nutY + frH * 0.06;
      return nutY + (fret - viewStart - 0.5) * frH;
    }

    function fretLineY(fi) { return nutY + fi * frH; }

    return {
      w, h, padT, padB, padL, gridTop, gridBot, gridH, frH, courseW, pairGap,
      boardW, nutY, catchY, catchTop, catchBot, catchZoneH,
      courseCenterX, stringX, rowY, fretLineY,
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
    const bg = cctx.createLinearGradient(0, 0, 0, g.h);
    bg.addColorStop(0, '#141820');
    bg.addColorStop(0.5, '#0e1218');
    bg.addColorStop(1, '#0a0e14');
    cctx.fillStyle = bg;
    cctx.fillRect(0, 0, g.w, g.h);
  }

  function drawWoodNeck(cctx, g) {
    const x = g.padL - 10;
    const y = g.nutY - 8;
    const w = g.boardW + 20;
    const h = g.gridH + g.catchZoneH + 14;

    const wood = cctx.createLinearGradient(x, y, x + w, y + h);
    wood.addColorStop(0, WOOD.dark);
    wood.addColorStop(0.25, WOOD.base);
    wood.addColorStop(0.55, WOOD.light);
    wood.addColorStop(0.8, WOOD.base);
    wood.addColorStop(1, WOOD.dark);
    roundRect(cctx, x, y, w, h, 5);
    cctx.fillStyle = wood;
    cctx.fill();

    cctx.save();
    cctx.clip();
    for (let i = 0; i < 28; i++) {
      const gy = y + (h * i) / 28;
      cctx.strokeStyle = WOOD.grain;
      cctx.lineWidth = 1;
      cctx.beginPath();
      cctx.moveTo(x, gy);
      cctx.lineTo(x + w, gy + 1.5 + (i % 3));
      cctx.stroke();
    }
    cctx.restore();

    cctx.strokeStyle = 'rgba(20,12,8,0.55)';
    cctx.lineWidth = 3;
    roundRect(cctx, x, y, w, h, 5);
    cctx.stroke();

    cctx.strokeStyle = 'rgba(180,150,100,0.2)';
    cctx.lineWidth = 1;
    roundRect(cctx, x + 2, y + 2, w - 4, h - 4, 4);
    cctx.stroke();
  }

  function drawNut(cctx, g, viewStart) {
    const x1 = g.padL - 6;
    const x2 = g.padL + g.boardW + 6;
    const y = g.nutY;

    cctx.fillStyle = 'rgba(245,235,210,0.95)';
    cctx.fillRect(x1, y - 3, x2 - x1, 6);
    cctx.strokeStyle = 'rgba(180,160,130,0.8)';
    cctx.lineWidth = 1;
    cctx.strokeRect(x1, y - 3, x2 - x1, 6);

    if (viewStart > 0) {
      cctx.fillStyle = '#c8d4e0';
      cctx.fillRect(x1, y - 2, x2 - x1, 4);
      cctx.fillStyle = '#1a1408';
      cctx.font = '900 11px Heebo, sans-serif';
      cctx.textAlign = 'right';
      cctx.textBaseline = 'middle';
      cctx.fillText(String(viewStart), g.padL - 12, y);
    }
  }

  function drawFretWire(cctx, g, y) {
    const x1 = g.padL;
    const x2 = g.padL + g.boardW;
    const grd = cctx.createLinearGradient(x1, y - 2, x1, y + 2);
    grd.addColorStop(0, '#707880');
    grd.addColorStop(0.35, '#e8ecf0');
    grd.addColorStop(0.65, '#f5f7fa');
    grd.addColorStop(1, '#606870');
    cctx.strokeStyle = grd;
    cctx.lineWidth = 2.8;
    cctx.beginPath();
    cctx.moveTo(x1, y);
    cctx.lineTo(x2, y);
    cctx.stroke();
    cctx.strokeStyle = 'rgba(255,255,255,0.35)';
    cctx.lineWidth = 0.8;
    cctx.beginPath();
    cctx.moveTo(x1, y - 0.8);
    cctx.lineTo(x2, y - 0.8);
    cctx.stroke();
  }

  function drawFretMarkers(cctx, g, viewStart) {
    for (let f = 1; f <= NUM_FRETS; f++) {
      const label = viewStart + f;
      const cy = g.nutY + (f - 0.5) * g.frH;
      cctx.fillStyle = '#9aabb8';
      cctx.font = '700 10px Heebo, sans-serif';
      cctx.textAlign = 'right';
      cctx.textBaseline = 'middle';
      cctx.fillText(String(label), g.padL - 10, cy);
      if ([3, 5, 7, 12].includes(label)) {
        cctx.fillStyle = 'rgba(30,20,12,0.55)';
        cctx.beginPath();
        cctx.arc(g.padL + g.boardW / 2, cy, 3.5, 0, Math.PI * 2);
        cctx.fill();
      }
    }
  }

  function drawCourseDividers(cctx, g) {
    for (let c = 1; c < PAIRS; c++) {
      const x = g.padL + c * g.courseW;
      cctx.strokeStyle = 'rgba(0,0,0,0.12)';
      cctx.lineWidth = 1;
      cctx.setLineDash([2, 4]);
      cctx.beginPath();
      cctx.moveTo(x, g.nutY);
      cctx.lineTo(x, g.gridBot);
      cctx.stroke();
      cctx.setLineDash([]);
    }
  }

  function drawString(cctx, x, y1, y2, lw, bright) {
    const grd = cctx.createLinearGradient(x - lw, 0, x + lw, 0);
    grd.addColorStop(0, 'rgba(100,110,120,0.5)');
    grd.addColorStop(0.45, bright ? '#f0f4f8' : 'rgba(160,170,180,0.55)');
    grd.addColorStop(0.55, bright ? '#ffffff' : 'rgba(180,190,200,0.6)');
    grd.addColorStop(1, 'rgba(80,90,100,0.45)');
    cctx.strokeStyle = grd;
    cctx.lineWidth = lw;
    cctx.beginPath();
    cctx.moveTo(x, y1);
    cctx.lineTo(x, y2);
    cctx.stroke();
  }

  function drawStrings(cctx, g, activeCourses) {
    const active = activeCourses ? new Set(activeCourses) : null;
    for (let c = 0; c < PAIRS; c++) {
      const on = !active || active.has(c);
      const lw = 0.9 + c * 0.45;
      const bright = on && (c === 3 || active.size === 1);
      for (let side = 0; side < 2; side++) {
        drawString(cctx, g.stringX(c, side), g.nutY, g.catchBot, lw, bright && on);
      }
    }
  }

  function drawCatchZone(cctx, g) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220);
    const x = g.padL - 8;
    const w = g.boardW + 16;

    const strip = cctx.createLinearGradient(0, g.catchTop, 0, g.catchBot);
    strip.addColorStop(0, 'rgba(40,28,18,0.9)');
    strip.addColorStop(0.5, 'rgba(55,38,24,0.95)');
    strip.addColorStop(1, 'rgba(35,24,14,0.9)');
    roundRect(cctx, x, g.catchTop, w, g.catchBot - g.catchTop, 4);
    cctx.fillStyle = strip;
    cctx.fill();

    cctx.strokeStyle = `rgba(200,160,80,${0.35 + pulse * 0.25})`;
    cctx.lineWidth = 2;
    cctx.beginPath();
    cctx.moveTo(x + 4, g.catchY);
    cctx.lineTo(x + w - 4, g.catchY);
    cctx.stroke();

    for (let c = 0; c < PAIRS; c++) {
      const cx = g.courseCenterX(c);
      cctx.beginPath();
      cctx.ellipse(cx, g.catchY, g.pairGap + 5, 13, 0, 0, Math.PI * 2);
      cctx.strokeStyle = `rgba(200,160,80,${0.2 + pulse * 0.15})`;
      cctx.lineWidth = 1.2;
      cctx.stroke();
    }

    cctx.fillStyle = 'rgba(200,170,110,0.75)';
    cctx.font = '700 9px Heebo, sans-serif';
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillText('נקודת נגינה', g.padL + g.boardW / 2, g.catchTop + 9);
  }

  function drawStringLabels(cctx, g, activeCourses) {
    const active = activeCourses ? new Set(activeCourses) : null;
    for (let c = 0; c < PAIRS; c++) {
      const cx = g.courseCenterX(c);
      const on = !active || active.has(c);
      cctx.textAlign = 'center';
      cctx.fillStyle = on ? 'rgba(200,170,110,0.9)' : 'rgba(100,120,140,0.6)';
      cctx.font = `700 ${g.w < 320 ? 9 : 10}px Heebo, sans-serif`;
      cctx.fillText(STRING_EN[c], cx, g.h - g.padB + 12);
      cctx.fillStyle = on ? '#e8c878' : '#6a8098';
      cctx.font = `800 ${g.w < 320 ? 11 : 13}px Heebo, sans-serif`;
      cctx.fillText(STRING_HE[c], cx, g.h - g.padB + 28);
      cctx.fillStyle = 'rgba(120,140,160,0.7)';
      cctx.font = '600 8px Heebo, sans-serif';
      cctx.fillText(`מ${c + 1} · זוג`, cx, g.h - g.padB + 42);
    }
  }

  function drawFingerDot(cctx, cx, cy, rx, ry, text, ghost) {
    cctx.save();
    if (ghost) cctx.globalAlpha = 0.75;
    cctx.shadowColor = 'rgba(0,0,0,0.45)';
    cctx.shadowBlur = ghost ? 4 : 7;
    cctx.shadowOffsetY = 2;
    const dot = cctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 1, cx, cy, ry);
    dot.addColorStop(0, '#fff8e8');
    dot.addColorStop(0.35, '#e8c868');
    dot.addColorStop(1, '#a07828');
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    cctx.fillStyle = dot;
    cctx.fill();
    cctx.strokeStyle = 'rgba(255,255,255,0.65)';
    cctx.lineWidth = 1.5;
    cctx.stroke();
    if (text) {
      cctx.shadowBlur = 0;
      cctx.fillStyle = '#2a1808';
      cctx.font = `900 ${ry > 9 ? 11 : 9}px Heebo, sans-serif`;
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';
      cctx.fillText(text, cx, cy + 0.5);
    }
    cctx.restore();
  }

  function drawStaticMarker(cctx, g, m, viewStart) {
    if (m.fret === 'x') {
      const cx = g.courseCenterX(m.courseIdx);
      cctx.fillStyle = '#c03030';
      cctx.font = '900 16px Heebo, sans-serif';
      cctx.textAlign = 'center';
      cctx.textBaseline = 'bottom';
      cctx.fillText('×', cx, g.nutY - 4);
      return;
    }
    const cx = g.courseCenterX(m.courseIdx);
    if (m.fret === 0) {
      cctx.strokeStyle = '#5fc88f';
      cctx.lineWidth = 2.5;
      cctx.beginPath();
      cctx.arc(cx, g.nutY + 5, 6, 0, Math.PI * 2);
      cctx.stroke();
      return;
    }
    const cy = g.rowY(m.fret, viewStart);
    if (cy < g.nutY + 4 || cy > g.gridBot - 4) return;
    drawFingerDot(cctx, cx, cy, g.pairGap + 3, 10, String(m.fret), true);
  }

  function drawApproachMarker(cctx, g, m, timeToHit, pxPerSec, status) {
    const cx = g.courseCenterX(m.courseIdx);
    if (m.fret === 'x') return;
    const y = g.catchY - timeToHit * pxPerSec;
    const lbl = m.fret === 0 ? '○' : (m.label && m.label.length <= 2 ? m.label : String(m.fret));
    cctx.save();
    if (status === 'perfect' || status === 'good') cctx.globalAlpha = 0.3;
    if (status === 'wrong' || status === 'miss') {
      drawFingerDot(cctx, cx, y, g.pairGap + 2, 10, '!', false);
    } else {
      drawFingerDot(cctx, cx, y, g.pairGap + 2, 10, lbl, false);
    }
    cctx.fillStyle = '#e8c878';
    cctx.font = '700 8px Heebo, sans-serif';
    cctx.textAlign = 'center';
    cctx.fillText(`מ${m.courseIdx + 1}·ס${m.fret}`, cx, y - 16);
    cctx.restore();
  }

  function noteMarkers(note) {
    return [{ courseIdx: 3, fret: note.fret, label: note.label || note.solfege || '' }];
  }

  function chordMarkers(chordId) {
    const ch = getChord(chordId);
    if (!ch) return [];
    return ch.shape.map((f, courseIdx) => ({ courseIdx, fret: f, label: '' }));
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
    cctx.fillStyle = 'rgba(0,0,0,0.5)';
    cctx.fillRect(0, 0, g.w, g.padT + 6);
    cctx.fillStyle = '#e8c878';
    cctx.font = `700 ${g.w < 300 ? 11 : 13}px Heebo, sans-serif`;
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillText(text, g.w / 2, g.padT * 0.48);
  }

  function drawFrame(cctx, opts) {
    const { w, h, pxPerSec, viewStart, gameType, targets, upcoming, countIn, clickHint, tNow } = opts;
    const g = geom(w, h);
    lastGeom = g;
    lastViewStart = viewStart;

    drawBackground(cctx, g);
    if (upcoming) drawCaption(cctx, g, upcomingCaption(upcoming, gameType));
    else drawCaption(cctx, g, 'בוזוקי — דיאגרמת סריגים · 8 מיתרים');

    drawWoodNeck(cctx, g);
    for (let f = 1; f <= NUM_FRETS; f++) drawFretWire(cctx, g, g.fretLineY(f));
    drawNut(cctx, g, viewStart);
    drawFretMarkers(cctx, g, viewStart);
    drawCourseDividers(cctx, g);

    const active = upcoming ? [...activeCoursesForTarget(upcoming, gameType)] : null;
    drawStrings(cctx, g, active);

    if (upcoming) {
      const shape = gameType === 'note' ? noteMarkers(upcoming.note) : chordMarkers(upcoming.chordId);
      shape.forEach(m => drawStaticMarker(cctx, g, m, viewStart));
    }

    drawCatchZone(cctx, g);
    drawStringLabels(cctx, g, active);

    if (clickHint) {
      const cx = g.courseCenterX(clickHint.course);
      const cy = clickHint.atCatch ? g.catchY : g.rowY(clickHint.fret, viewStart);
      cctx.strokeStyle = '#e8c878';
      cctx.lineWidth = 2;
      cctx.beginPath();
      cctx.arc(cx, cy, 16, 0, Math.PI * 2);
      cctx.stroke();
    }

    if (countIn > 0) {
      cctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(cctx, w * 0.34, h * 0.3, w * 0.32, 68, 8);
      cctx.fill();
      cctx.fillStyle = '#e8c878';
      cctx.font = '900 46px Heebo, sans-serif';
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';
      cctx.fillText(String(countIn), w / 2, h * 0.36);
    }

    for (const tg of targets) {
      const timeToHit = tg.t - tNow;
      if (timeToHit < -0.4) continue;
      if (timeToHit * pxPerSec > g.catchY - g.nutY + 80) continue;
      const markers = gameType === 'note' ? noteMarkers(tg.note) : chordMarkers(tg.chordId);
      markers.forEach(m => drawApproachMarker(cctx, g, m, timeToHit, pxPerSec, tg.status));
    }

    return g;
  }

  function hitTest(x, y, w, h) {
    const g = lastGeom || geom(w, h);
    const viewStart = lastViewStart;
    if (x < g.padL || x > g.padL + g.boardW) return null;
    let course = Math.max(0, Math.min(PAIRS - 1, Math.floor((x - g.padL) / g.courseW)));

    if (y >= g.catchTop && y <= g.catchBot) {
      return {
        course, fret: null, atCatch: true, stringNum: course + 1,
        name: STRING_HE[course],
        text: `נקודת נגינה · מיתר ${course + 1} (${STRING_HE[course]})`,
      };
    }
    if (y < g.nutY - g.frH || y > g.gridBot) return null;
    let fret = 0;
    if (y >= g.nutY) {
      fret = Math.round(viewStart + (y - g.nutY) / g.frH + 0.5);
      if (fret < 1) fret = 1;
    }
    return {
      course, fret, atCatch: false, stringNum: course + 1,
      name: STRING_HE[course], text: Fretboard.pressText(course, fret),
    };
  }

  function catchPoint(course) {
    const g = lastGeom;
    return g ? { x: g.courseCenterX(course), y: g.catchY } : null;
  }

  return {
    geom, drawFrame, hitTest, catchPoint, activeCoursesForTarget, upcomingCaption,
    calcViewStart, targetViewStart, noteMarkers, chordMarkers,
    STRING_HE, NUM_FRETS, PAIRS,
  };
})();
