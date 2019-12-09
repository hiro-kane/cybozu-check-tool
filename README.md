## 使い方

```
git clone https://github.com/hiro-kane/cybozu-check-tool.git
cd cybozu-check-tool
```

docker-compose.ymlを以下の環境一覧を参考に参照先のサイボウズ、Slackを設定してください。

**環境変数一覧**

|環境変数|内容|
|---|---|
|CYBOZU_URL|サイボウズのURL|
|IS_BASIC|Basic認証有無(0:なし、1:あり)|
|BASIC_ID|Basic認証 ID|
|BASIC_PW|Basic認証 Password|
|LOGIN_ID|サイボウズログインID|
|LOGIN_PW|サイボウズログインPW|
|SLACK_CHANNEL|検知時送信先 Slackチャンネル|
|SLACK_ENTRY_POINT|検知時送信先 Slack送信先URL(パス)|
|LOOP_TIME|監視間隔|

設定後、clone先のディレクトリで以下を実行してください。

```
docker-compose up
```

サイボウズのワークフローに新規申請が上がるたびにSlackに通知がいきます。  
終了する際は以下で終了してください。

```
docker-compose down
```
