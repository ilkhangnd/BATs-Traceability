import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost:4000";
const accessToken = __ENV.ACCESS_TOKEN;
const scenario = __ENV.SCENARIO || "harvest"; // "harvest", "verify", "plots", "mixed"
const targetVus = Number(__ENV.TARGET_VUS || 100);

export const options = {
  scenarios: {
    load_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP_DURATION || "15s", target: targetVus },
        { duration: __ENV.HOLD_DURATION || "30s", target: targetVus },
        { duration: __ENV.RAMP_DOWN_DURATION || "10s", target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"]
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"]
};

export default function () {
  const unique = `${__VU}-${__ITER}-${Date.now()}`;
  let mode = scenario;
  if (scenario === "mixed") {
    const r = Math.random();
    mode = r < 0.4 ? "harvest" : r < 0.8 ? "verify" : "plots";
  }

  if (mode === "harvest") {
    const response = http.post(
      `${baseUrl}/batches/harvest`,
      JSON.stringify({
        farmPlotId: "plot-dlk-0001",
        actorId: "FARMER-0001",
        variety: "Ri6",
        quantityKg: 1,
        eventTime: new Date().toISOString(),
        location: { latitude: 12.6789, longitude: 108.1234 },
        evidenceHashes: [`k6-${unique}`]
      }),
      {
        headers: {
          "content-type": "application/json",
          authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          "x-idempotency-key": `k6-${unique}`
        }
      }
    );
    check(response, {
      "harvest created (201)": (result) => result.status === 201
    });
  } else if (mode === "verify") {
    const response = http.get(
      `${baseUrl}/verify/8930000000019/SR-20260704-000001/0001`
    );
    check(response, {
      "verify status ok (200/404)": (result) => result.status === 200 || result.status === 404
    });
  } else if (mode === "plots") {
    const response = http.get(`${baseUrl}/plots`);
    check(response, {
      "plots status 200": (result) => result.status === 200
    });
  }

  const sleepTime = __ENV.SLEEP_TIME ? Number(__ENV.SLEEP_TIME) : 0.5;
  if (sleepTime > 0) {
    sleep(sleepTime);
  }
}

export function handleSummary(data) {
  const defaultTarget = `research/results/api-load-${scenario}-${targetVus}vu.json`;
  const target = __ENV.SUMMARY_FILE || defaultTarget;
  return {
    stdout: JSON.stringify(data.metrics, null, 2),
    [target]: JSON.stringify(data, null, 2)
  };
}
