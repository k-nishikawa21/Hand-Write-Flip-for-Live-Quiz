/**********************************************************************
 *  player.js  –  参加者用キャンバス
 *  ペン幅：6 / 12 (default) / 18 px
 *********************************************************************/
window.initPlayer = (sock, canvas, room, name, clearBtn, tools) => {
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  /* --- ペン幅状態 --- */
  let penWidth = 12;                                 // デフォルト
  const setPen = w => {
    penWidth = w; ctx.lineWidth = w;
    [...tools.children].forEach(b => b.classList.toggle("sel", +b.dataset.w === w));
  };
  setPen(penWidth);
  tools.onclick = e => { if (e.target.dataset.w) setPen(+e.target.dataset.w); };

  /* --- 送信用バッファ --- */
  const buf = [];
  let timer = null;
  const flush = () => {
    if (!buf.length) return;
    const xs = buf.map(p => p[0]), ys = buf.map(p => p[1]); buf.length = 0;
    sock.emit("stroke_move", { room, player: name, xs, ys, width: penWidth });
  };

  /* --- pointer イベント --- */
  let drawing = false;
  const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  canvas.addEventListener("pointerdown", e => {
    e.preventDefault();
    const { x, y } = pos(e);
    drawing = true; ctx.beginPath(); ctx.moveTo(x, y);
    sock.emit("stroke_start", { room, player: name, x, y, color: "#000", width: penWidth });
  });

  canvas.addEventListener("pointermove", e => {
    if (drawing) e.preventDefault();
    if (!drawing) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y); ctx.stroke(); buf.push([x, y]);
    if (!timer) timer = setTimeout(() => { flush(); timer = null; }, 20);
  });

  const finish = () => {
    if (!drawing) return;
    drawing = false; flush();
    sock.emit("stroke_end", { room, player: name });
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointerleave", finish);
  canvas.addEventListener("pointercancel", finish);

  /* --- 消すボタン --- */
  clearBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sock.emit("clear_canvas", { room, player: name });
  };

  /* --- リセット受信 --- */
  sock.on("reset", () => ctx.clearRect(0, 0, canvas.width, canvas.height));

  /* --- 結果表示 / リセット --- */
  sock.on("result_display", res => {
    const ok = res.correct.includes(name);
    canvas.classList.add("invert");
    canvas.parentElement.classList.toggle("correct", ok);
    canvas.parentElement.classList.toggle("wrong", !ok);
  });
  sock.on("result_reset", () => {
    canvas.classList.remove("invert");
    canvas.parentElement.classList.remove("correct", "wrong");
  });
};
