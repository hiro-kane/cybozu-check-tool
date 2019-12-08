const puppeteer = require('puppeteer');
const http = require('https');

// 設定
const CYBOZU_URL = process.env.CYBOZU_URL
const IS_BASIC = process.env.IS_BASIC
const BASIC_ID = process.env.BASIC_ID
const BASIC_PW = process.env.BASIC_PW
const LOGIN_ID = process.env.LOGIN_ID
const LOGIN_PW = process.env.LOGIN_PW
const SLACK_CHANNEL = process.env.SLACK_CHANNEL
const SLACK_ENTRY_POINT = process.env.SLACK_ENTRY_POINT
const LOOP_TIME = process.env.LOOP_TIME // ミリ秒

// チェック済申請番号格納
var appNumberList = [];

async function checkWorkflow() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Basic認証
  if (IS_BASIC === '1')
    await page.authenticate({ username: BASIC_ID, password: BASIC_PW });

  // サイボウズアクセス
  await page.goto(CYBOZU_URL, {
    waitUntil: 'domcontentloaded'
  });

  // ログイン設定
  await page.select('select[name="_ID"]', LOGIN_ID);
  await page.type('input[name="Password"]', LOGIN_PW);

  //　ログイン
  await page.evaluate(() => {
    document.querySelector('input[name="Submit"]').click();
  });

  // ログイン後画面が読み込まれるまで待機
  await page.waitForNavigation({
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  });

  // ワークフロー画面へ
  await page.goto(CYBOZU_URL + 'page=WorkFlowRecept');

  // 受信一覧取得
  const list = await page.$$('table.dataList > tbody  > tr');

  // 申請があるか判定判定
  if (list.length <= 1) {
    await browser.close();
    console.log("nothing ")
    return;
  }

  // 最新の申請取得
  const td = await list[1].$('td')
  // 申請番号取得
  const newAppNumber = (await (await td.getProperty('textContent')).jsonValue()).replace(/\r?\n/g, '');

  // ブラウザ終了
  await browser.close();

  // チェック済みの番号か判定
  if (appNumberList.indexOf(newAppNumber) >= 0) {
    console.log("checked number : " + newAppNumber);
    return;
  } else {
    appNumberList.push(newAppNumber);
    console.log("new number : " + newAppNumber);
  }

  // SlackへのPOST用データ作成
  let postData = {
    channel: SLACK_CHANNEL,
    username: 'work-flow-checker',
    text: '新規申請があります！',
    icon_emoji: ':ghost:'
  };
  let postDataStr = JSON.stringify(postData);

  // POST設定
  let options = {
    host: 'hooks.slack.com',
    // port: 80,
    path: SLACK_ENTRY_POINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postDataStr)
    }
  };

  // POST
  let req = http.request(options, res => {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', chunk => {
      console.log('BODY: ' + chunk);
    });
  });
  req.on('error', e => {
    console.log('problem with request: ' + e.message);
  });
  req.write(postDataStr);
  req.end();
};

setInterval(function () {
  checkWorkflow();
}, LOOP_TIME);