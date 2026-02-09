// This worker provides a steady heartbeat for the game loop when the main thread is throttled
let intervalId: any = null;

self.onmessage = (e: MessageEvent) => {
    if (e.data.type === 'start') {
        const interval = e.data.interval || 1000 / 60;
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            self.postMessage({ type: 'tick', timestamp: performance.now() });
        }, interval);
    } else if (e.data.type === 'stop') {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
};
