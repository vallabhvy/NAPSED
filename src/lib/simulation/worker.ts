/// <reference lib="webworker" />
import type { TelemetryData } from '../../types';

let isRunning = false;
let tickCount = 0;
let seed = 0;

function seededRandom() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === 'START') {
    isRunning = true;
    tickCount = 0;
    seed = parseInt(e.data.seed.replace('SEED_', ''), 16) || 12345;
    runSimulationLoop(e.data.code);
  } else if (e.data.type === 'STOP') {
    isRunning = false;
  }
};

function runSimulationLoop(userCode: string) {
  // Setup Virtual Environment
  const virtualDB = {
     queryTime: 50,
     locks: 0
  };
  
  // Try evaluating user code to see if it improves metrics
  let codeEffectiveness = 0;
  try {
     const userFn = new Function('db', 'req', userCode);
     // test run to see if it throws
     userFn(virtualDB, {});
     codeEffectiveness = userCode.includes('cache') || userCode.includes('buffer') || userCode.includes('actor') ? 0.95 : 0.2;
  } catch(err) {
     codeEffectiveness = -0.5; // Code broken
  }

  function tick() {
    if (!isRunning) return;
    
    tickCount++;
    
    // Simulate traffic spike around tick 100
    const trafficMultiplier = tickCount > 100 && tickCount < 300 ? 5 : 1;
    const baseRps = 1000 * trafficMultiplier;
    
    // Calculate telemetry based on effectiveness
    const latencyBase = 50 + (seededRandom() * 20);
    let codePenalty = 0;
    if (codeEffectiveness < 0.5) {
       // if not optimized, traffic spike causes lock contention / high latency
       codePenalty = (1 - codeEffectiveness) * (trafficMultiplier * 300);
    }
    
    const currentP50 = Math.max(10, latencyBase + codePenalty * 0.5);
    const currentP95 = Math.max(15, currentP50 * 1.5);
    const currentP99 = Math.max(20, currentP50 * 2.5 + (seededRandom() * codePenalty));
    
    const errorRate = codeEffectiveness < 0 ? 0.8 : (currentP99 > 800 ? 0.15 : 0.0);
    
    const telemetry: TelemetryData = {
      tick: tickCount,
      p50Ms: Math.round(currentP50),
      p95Ms: Math.round(currentP95),
      p99Ms: Math.round(currentP99),
      errorRate: errorRate,
      memoryMb: 256 + Math.round(seededRandom() * 50) + (codeEffectiveness < 0 ? 500 : 0),
      throughputRps: Math.round(baseRps * (1 - errorRate))
    };

    self.postMessage({ type: 'TELEMETRY', data: telemetry });

    // End simulation at 400 ticks
    if (tickCount < 400) {
      setTimeout(tick, 50); // 50ms per tick (total 20s real time for a full simulation)
    } else {
      self.postMessage({ type: 'COMPLETE' });
      isRunning = false;
    }
  }

  tick();
}
