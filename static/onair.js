const cv=document.getElementById("cv"),ctx=cv.getContext("2d");ctx.lineCap='round';
const room=new URLSearchParams(location.search).get("room")||"quiz";
const sock=io();sock.emit("join",{role:"onair",room});
sock.on("stroke_start", d=>{
  ctx.lineWidth = d.width;            // OBS はフルサイズなのでそのまま
  ctx.strokeStyle = "#000";
  ctx.beginPath(); ctx.moveTo(d.x,d.y);
});
sock.on("stroke_move", d=>{d.xs.forEach((x,i)=>ctx.lineTo(x,d.ys[i]));ctx.stroke();});
sock.on("reset", ()=>ctx.clearRect(0,0,cv.width,cv.height));
sock.on("clear_canvas", ()=>ctx.clearRect(0,0,cv.width,cv.height));
