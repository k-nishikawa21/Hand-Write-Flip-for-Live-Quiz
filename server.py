from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, join_room, emit
from pathlib import Path

STATIC = Path(__file__).parent / "static"
app = Flask(__name__, static_folder=str(STATIC))
sock = SocketIO(app, cors_allowed_origins="*")  # threading モード自動

@app.route("/")
def index():                           # index.html を常に返す
    return send_from_directory(STATIC, "index.html")

@app.route("/<path:p>")                # onair.html と JS
def static_files(p):
    return send_from_directory(STATIC, p)

# --- 接続管理 -------------------------------------------------
participants = {}                      # room -> set(names)

@sock.on("join")
def on_join(d):
    room, role, name = d["room"], d["role"], d["name"]
    join_room(f"{role}:{room}")
    if role == "player":
        participants.setdefault(room, set()).add(name)
        emit("participants",
             {"room": room, "members": sorted(participants[room])},
             room=f"admin:{room}")

# --- 手書きストローク中継 -------------------------------------
def relay(event, data):
    room, player = data["room"], data["player"]
    # 管理者へはプレイヤー名でルーティング
    emit(event, data, room=f"admin:{room}")
    # OBS へも同じ（全タイルを合成する or 選択式にするのは onair.js で）
    emit(event, data, room=f"onair:{room}")

sock.on("stroke_start")(lambda d: relay("stroke_start", d))
sock.on("stroke_move")(lambda d: relay("stroke_move", d))
sock.on("stroke_end")(lambda d: relay("stroke_end", d))

@sock.on("reset")
def do_reset(d):
    room = d["room"]
    for role in ("player", "admin", "onair"):
        emit("reset", {}, room=f"{role}:{room}")

@sock.on("clear_canvas")
def relay_clear(d):
    room, player = d["room"], d["player"]
    emit("clear_canvas", {"player": player}, room=f"admin:{room}")
    emit("clear_canvas", {"player": player}, room=f"onair:{room}")


# --- 結果表示 / リセット ---------------------------------
@sock.on("result_display")
def result_disp(data):
    room = data["room"]
    emit("result_display", data, room=f"admin:{room}")
    emit("result_display", data, room=f"player:{room}")
    emit("result_display", data, room=f"onair:{room}")

@sock.on("result_reset")
def result_reset(d):
    room = d["room"]
    emit("result_reset", {}, room=f"admin:{room}")
    emit("result_reset", {}, room=f"player:{room}")
    emit("result_reset", {}, room=f"onair:{room}")


if __name__ == "__main__":
    sock.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
