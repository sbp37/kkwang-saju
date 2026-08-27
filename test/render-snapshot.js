/* 화면에 실제로 그려지는 글을 통째로 떠서 파일로 남긴다.
   코드를 정리하기 전후로 두 번 떠서 diff하면, 보이는 내용이 바뀌지 않았는지 확인할 수 있다.
   engine.test.js와 달리 브라우저가 필요하다 (npx playwright install chromium).

     node test/render-snapshot.js before.txt
     ... 코드 수정 ...
     node test/render-snapshot.js after.txt
     diff before.txt after.txt

   CHROME 환경변수로 크로미움 실행 파일을 직접 지정할 수도 있다. */

const path = require('path');
const fs = require('fs');

const out = process.argv[2];
if (!out) { console.error('사용법: node test/render-snapshot.js <저장할 파일>'); process.exit(2); }

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { console.error('playwright가 필요하다: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const APP = 'file://' + path.join(__dirname, '..', 'index.html');
const 말투 = ['몽글몽글', '솔직하게 콕', '돌직구 크앙'];
// 신강·신약, 시간 모름, 서머타임, 옛 표준시가 골고루 섞이도록 고른 사례
const CASES = [
  [1989, 3, 7, 7, 'F'], [1993, 7, 15, 14, 'F'], [1975, 11, 22, 3, 'M'],
  [2001, 5, 9, 21, 'F'], [1962, 1, 30, 12, 'M'], [1987, 7, 15, 14, 'M']
];

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(APP);
  await page.waitForTimeout(400);

  const dump = [];
  for (const [y, m, d, h, g] of CASES) {
    for (const lv of 말투) {
      await page.evaluate(() => show('scrInput'));
      await page.click(`#genToggle button[data-v="${g}"]`);
      await page.selectOption('#inY', String(y));
      await page.selectOption('#inM', String(m));
      await page.selectOption('#inD', String(d));
      await page.selectOption('#inH', String(h));
      await page.click('#btnCalc');
      await page.waitForTimeout(350);
      dump.push(`### 족보 ${y}.${m}.${d} ${h}시 ${g}\n` + await page.innerText('#scrChart'));
      await page.click(`#scrChart .level-btn[data-level="${lv}"]`);
      await page.waitForTimeout(1400);
      dump.push(`### 결과 ${y}.${m}.${d} ${h}시 ${g} / ${lv}\n` + await page.evaluate(() => {
        document.querySelectorAll('#sections .speech').forEach(el => el.classList.add('open'));
        return document.getElementById('scrResult').innerText;
      }));
    }
  }

  await page.evaluate(() => show('scrMatch'));
  await page.waitForTimeout(200);
  for (const [y, m, d, h, g] of CASES.slice(0, 3)) {
    await page.click(`#mGenToggle button[data-v="${g}"]`);
    await page.selectOption('#mY', String(y));
    await page.selectOption('#mM', String(m));
    await page.selectOption('#mD', String(d));
    await page.selectOption('#mH', String(h));
    await page.click('#btnMatch');
    await page.waitForTimeout(500);
    dump.push(`### 궁합 ${y}.${m}.${d}\n` + await page.innerText('#matchResult'));
  }

  // 오늘·마이는 날짜에 따라 내용이 바뀌므로 같은 날 안에서만 비교된다
  await page.evaluate(() => show('scrToday'));
  await page.waitForTimeout(400);
  dump.push('### 오늘\n' + await page.innerText('#scrToday'));
  await page.evaluate(() => show('scrMy'));
  await page.waitForTimeout(300);
  dump.push('### 마이\n' + await page.innerText('#scrMy'));

  fs.writeFileSync(out, dump.join('\n\n') + '\n\n=== 자바스크립트 오류 ===\n' + (errors.join('\n') || '없음') + '\n');
  console.log(`${out} 저장 · 블록 ${dump.length}개 · 오류 ${errors.length ? errors.length + '건' : '없음'}`);
  await browser.close();
})();
