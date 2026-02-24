window.initAdmin = (sock, room) => {
  const ORG_W = 800, ORG_H = 450;
  const grid  = document.getElementById("grid");
  const plist = document.getElementById("plistBody");

  /* player -> {wrap,cv,ctx,paths:[]} */
  const tiles  = new Map();
  const checks = new Map();

  /* ---------- タイル生成 ---------- */
  function makeTile(player){
    const wrap=document.createElement("div");
    wrap.className="tile";
    wrap.innerHTML = `
    <canvas></canvas>
    <span style="
        position:absolute;
        bottom:2px;             /* タイル下端から 2px */
        left:50%;               /* 横中央に配置 */
        transform:translateX(-50%);
        font-size:28px;         /* ← 約 2 倍サイズ */
        font-weight:bold;
        background:#fff8;       /* 薄い白で可読性確保 */
        pointer-events:none;">
      ${player}
    </span>`;
    grid.appendChild(wrap);

    const cv  = wrap.querySelector("canvas");
    const ctx = cv.getContext("2d");
    const paths=[];
    tiles.set(player,{wrap,cv,ctx,paths});
    resizeCanvas(tiles.get(player));

    const row=document.createElement("label");
    row.innerHTML=`<input type="checkbox"> ${player}`;
    plist.appendChild(row);
    checks.set(player,row.querySelector("input"));
  }

  /* ---------- wrapper サイズに合わせて再構築 ---------- */
  function resizeCanvas(t){
    const {wrap,cv,ctx,paths}=t;
    const dpr = devicePixelRatio;
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;

    cv.width  = cssW * dpr;
    cv.height = cssH * dpr;

    const scale = cssW / ORG_W;                // vis
    ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);
    ctx.lineCap='round'; ctx.lineJoin='round';

    ctx.clearRect(0,0,ORG_W,ORG_H);
    paths.forEach(p=>{
      ctx.beginPath();
      ctx.lineWidth = p.width;                 // 元幅 → 見た目は width*scale
      ctx.moveTo(...p.points[0]);
      for(let i=1;i<p.points.length;i++) ctx.lineTo(...p.points[i]);
      ctx.stroke();
    });
  }
  new ResizeObserver(()=>tiles.forEach(resizeCanvas)).observe(grid);

  /* ---------- 参加者リスト ---------- */
  sock.on("participants",d=>d.members.forEach(p=>tiles.has(p)||makeTile(p)));

  /* ---------- 描画イベント ---------- */
  sock.on("stroke_start",d=>{
    if(!tiles.has(d.player)) makeTile(d.player);
    const t=tiles.get(d.player);
    t.paths.push({width:d.width,points:[[d.x,d.y]]});
    t.ctx.beginPath();
    t.ctx.lineWidth = d.width;
    t.ctx.moveTo(d.x,d.y);
  });
  sock.on("stroke_move",d=>{
    const t=tiles.get(d.player);
    const path=t.paths[t.paths.length-1];
    d.xs.forEach((x,i)=>{
      const y=d.ys[i];
      path.points.push([x,y]);
      t.ctx.lineTo(x,y);
    });
    t.ctx.stroke();
  });

  /* ---------- クリア ---------- */
  const clearTile=t=>{t.paths.length=0;t.ctx.clearRect(0,0,ORG_W,ORG_H);};
  sock.on("clear_canvas",d=>tiles.get(d.player)&&clearTile(tiles.get(d.player)));
  sock.on("reset",      ()=>tiles.forEach(clearTile));

  /* ---------- 結果表示 / リセット ---------- */
  document.getElementById("showRes").onclick=()=>{
    const res={room,correct:[]}; checks.forEach((c,p)=>{if(c.checked)res.correct.push(p);});
    sock.emit("result_display",res); applyRes(res);
  };
  document.getElementById("resetRes").onclick=()=>{
    sock.emit("result_reset",{room}); resetRes();
  };
  function applyRes(res){
    tiles.forEach((t,pl)=>{
      const ok=res.correct.includes(pl);
      t.wrap.classList.toggle("correct", ok);
      t.wrap.classList.toggle("wrong",   !ok);
      t.ctx.canvas.classList.add("invert");
    });
  }
  function resetRes(){
    tiles.forEach(t=>{
      t.wrap.classList.remove("correct","wrong");
      t.ctx.canvas.classList.remove("invert");
    });
  }
  sock.on("result_display",applyRes);
  sock.on("result_reset", resetRes);
};
