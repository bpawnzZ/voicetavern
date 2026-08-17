const WebSocket = require('ws');

const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-test';
const url = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen-audio-3.0-realtime-plus';

const ws = new WebSocket(url, [`bearer`, `${apiKey}`]);

ws.on('open', () => {
  console.log('Connected successfully via subprotocol!');
  ws.close();
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
});

ws.on('unexpected-response', (req, res) => {
  console.log('Unexpected response:', res.statusCode);
});
