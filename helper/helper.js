/**
 * 브릿지 로컬 도우미
 * -----------------------------------------
 * 브라우저의 "호스트" 페이지가 이 프로그램에 ws://localhost:8765 로 접속해서
 * 뷰어가 보낸 마우스/키보드 신호를 그대로 전달합니다.
 * 이 프로그램은 그 신호를 실제 OS 마우스/키보드 입력으로 변환합니다.
 *
 * 실행 전: npm install
 * 실행:   node helper.js
 */

const WebSocket = require('ws');
const robot = require('robotjs');

const PORT = 8765;
const wss = new WebSocket.Server({ port: PORT, host: '127.0.0.1' });

const { width, height } = robot.getScreenSize();

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

console.log('==============================================');
console.log(' 브릿지 로컬 도우미 실행 중');
console.log(` 포트: ${PORT} (localhost 전용, 외부 접속 불가)`);
console.log(` 화면 해상도: ${width} x ${height}`);
console.log(' 브라우저의 호스트 페이지를 열어 연결을 기다립니다...');
console.log(' 종료하려면 Ctrl+C');
console.log('==============================================');

wss.on('connection', (ws) => {
  console.log('✅ 브라우저 호스트 페이지 연결됨. 이제부터 실제 입력이 반영됩니다.');

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    try {
      switch (msg.type) {
        case 'move': {
          const x = clamp(Math.round(parseFloat(msg.x) * width), 0, width - 1);
          const y = clamp(Math.round(parseFloat(msg.y) * height), 0, height - 1);
          robot.moveMouse(x, y);
          break;
        }
        case 'click': {
          const button = msg.button === 2 ? 'right' : msg.button === 1 ? 'middle' : 'left';
          robot.mouseClick(button);
          break;
        }
        case 'key': {
          const key = mapKey(msg.key);
          if (key) robot.keyTap(key);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.log('⚠️ 입력 처리 중 오류:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('⚠️ 브라우저 연결이 종료되었습니다. 입력이 더 이상 반영되지 않습니다.');
  });
});

wss.on('error', (err) => {
  console.log('❌ 도우미 서버 오류:', err.message);
  console.log('   (8765 포트가 이미 사용 중이면 다른 프로그램을 종료하거나 PORT 값을 바꿔주세요)');
});

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mapKey(k) {
  const map = {
    ' ': 'space',
    Enter: 'enter',
    Backspace: 'backspace',
    Tab: 'tab',
    Escape: 'escape',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Delete: 'delete',
    Shift: 'shift',
    Control: 'control',
    Alt: 'alt',
    CapsLock: 'capslock',
    Home: 'home',
    End: 'end',
    PageUp: 'pageup',
    PageDown: 'pagedown',
  };
  if (map[k]) return map[k];
  if (k.length === 1) return k.toLowerCase();
  return null;
}
