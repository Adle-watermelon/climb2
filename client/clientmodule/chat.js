// client/chat.js
export function initChat(socket) {
  const MAX_MESSAGES = 100;

  // root コンテナ
  const chatRoot = document.createElement('div');
  chatRoot.id = 'game-chat-root';
  document.body.appendChild(chatRoot);

  // スタイル追加
  const style = document.createElement('style');
  style.textContent = `
  #game-chat-root {
    position: fixed;
    left: 12px;
    top: 12px;
    width: 380px;
    max-height: 45vh;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: "P2", sans-serif;
    z-index: 9999;
    pointer-events: auto;
  }
  #game-chat-box {
    background: rgba(0,0,0,0.6);
    border-radius: 8px;
    padding: 8px;
    color: white;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  #game-chat-messages {
    overflow-y: hidden;
    max-height: calc(45vh - 72px);
    padding-right: 6px;
    scrollbar-width: thin;
  }
  #game-chat-messages li {
    list-style: none;
    margin: 4px 0;
    line-height: 1.2;
    word-break: break-word;
    opacity: 0.95;
    font-size: 14px;
  }
  #game-chat-input-area {
    display:flex;
    gap:6px;
    margin-top:6px;
  }
  #game-chat-input {
    flex: 1;
    padding: 6px 8px;
    border-radius: 6px;
    border: none;
    outline: none;
    font-family: "P2", sans-serif;
    font-size: 14px;
    background: rgba(255,255,255,0.06);
    color: white;
  }
  #game-chat-send {
    padding: 6px 10px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    background: rgba(255,255,255,0.08);
    color: white;
    font-family: "P2", sans-serif;
  }
  #game-chat-toggle {
    cursor: pointer;
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 6px 8px;
    border-radius: 6px;
    font-family: "P2", sans-serif;
    font-size: 13px;
    border: none;
  }
  @media (max-width: 600px) {
    #game-chat-root { width: 70vw; left: 8px; top: 8px; }
  }
  `;
  document.head.appendChild(style);

  // トグルボタン
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'game-chat-toggle';
  toggleBtn.textContent = 'Chat';
  chatRoot.appendChild(toggleBtn);

  // チャット本体
  const box = document.createElement('div');
  box.id = 'game-chat-box';
  box.style.display = 'none';
  chatRoot.appendChild(box);

  // メッセージ一覧
  const ul = document.createElement('ul');
  ul.id = 'game-chat-messages';
  box.appendChild(ul);

  // 入力エリア
  const inputArea = document.createElement('div');
  inputArea.id = 'game-chat-input-area';
  box.appendChild(inputArea);

  const input = document.createElement('input');
  input.id = 'game-chat-input';
  input.type = 'text';
  input.placeholder = 'メッセージを入力して Enter';
  input.autocomplete = 'off';
  inputArea.appendChild(input);

  const sendBtn = document.createElement('button');
  sendBtn.id = 'game-chat-send';
  sendBtn.type = 'button';
  sendBtn.textContent = '送信';
  inputArea.appendChild(sendBtn);

  // 開閉
  toggleBtn.addEventListener('click', () => {
    box.style.display = (box.style.display === 'none') ? 'flex' : 'none';
    if (box.style.display === 'flex') input.focus();
  });

  // メッセージ追加
  function pushMessage(text, id = null) {
    const li = document.createElement('li');
    li.textContent = id ? `${id.slice(0,6)}: ${text}` : text;
    ul.appendChild(li);
    while (ul.children.length > MAX_MESSAGES) ul.removeChild(ul.firstChild);
    ul.scrollTop = ul.scrollHeight;
  }

  // 送信
  function doSend() {
    const v = input.value.trim();
    if (!v) return;
    socket.emit('chatMessage', v);
    input.value = '';
    input.focus();
  }

  sendBtn.addEventListener('click', doSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doSend(); }
    else if (e.key === 'Escape') input.blur();
  });

  // 受信
  socket.on('chatMessage', (data) => {
    pushMessage(data.msg);
  });

  socket.on('connect', () => pushMessage('サーバーに接続しました'));
  socket.on('disconnect', () => pushMessage('サーバーから切断されました'));

  // 外から呼べるように返す
  return { pushMessage, open: () => box.style.display = 'flex', close: () => box.style.display = 'none' };
}
