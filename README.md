# Hand‑Write Flip for Live Quiz

オンライン配信で「手書きフリップ」をリアルタイム共有するウェブアプリ  
参加者はブラウザだけ、配信者はOBSブラウザソースで取り込み

## Features
- 🖍️ 6 / 12 / 18 px のペンで自由に記入
- 🔴🔵 正解・不正解を一括カラー反映
- 🌐 LAN でも ngrok でも動作


## Quick Start (LAN)
ngrokが必要です
アカウント登録，ngrokコマンドのインストールなどを行ってください
ngrok：ローカルPC上で動作しているネットワークサービスを外部公開できるサービス
wifiルータのポート開放などせずに使用可能になります


```bash
pip install -r requirements.txt
python server.py
ngrok http 5000 --region ap
```
