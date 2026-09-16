const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  await page.setContent('<html><body><div id="editor" contenteditable="true"></div><textarea id="box"></textarea></body></html>');
  
  const res = await page.evaluate(async () => {
    const text = '🧾【安安心灵便利店 · 情绪消费结账单】\n我的情绪鉴定结果出来了：我是「自我PUA带师」！\nhttps://test.mutong-xhs.top/emo?share=rum_low_bnd&cost=24150';
    const fakeImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
    const html = `<div><p>${text.replace(/\n/g, '<br>')}</p><p><img src="${fakeImg}" alt="小票图片" /></p></div>`;

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })
    ]);

    const items = await navigator.clipboard.read();
    const types = items[0].types;
    
    // 模拟粘贴到富文本框
    const editor = document.getElementById('editor');
    editor.focus();
    document.execCommand('paste');
    const pastedHtml = editor.innerHTML;

    // 模拟粘贴到纯文本框
    const box = document.getElementById('box');
    box.focus();
    document.execCommand('paste');
    const pastedText = box.value;

    return { types, pastedHtml, pastedText };
  });

  console.log('Types in clipboard:', res.types);
  console.log('Pasted into rich editor:', res.pastedHtml.slice(0, 100));
  console.log('Pasted into plain text:', res.pastedText.slice(0, 100));

  await browser.close();
})();
