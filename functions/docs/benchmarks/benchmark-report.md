# VIKSHANA API Performance Benchmark Report

**Date Executed**: 2026-09-01T17:55:21.484Z
**Environment**: Localhost Prototype / Node.js 20.x Express Serverless Core
**Total Requests Executed**: 120
**Execution Time**: 29.05s
**Throughput**: 4.1 requests/sec

### Endpoint Latency Breakdown

| Endpoint | Total Requests | Success Rate | Avg Latency (ms) | P50 (ms) | P95 (ms) | P99 (ms) |
|---|---|---|---|---|---|---|
| `GET /health` | 20 | 100.0% | 1398.8 | 1305 | 2099 | 2099 |
| `GET /dashboard` | 20 | 100.0% | 28.3 | 7 | 163 | 163 |
| `GET /cases` | 20 | 100.0% | 11.6 | 2 | 89 | 89 |
| `GET /forensics/evidence/case/100070382202100001` | 20 | 100.0% | 0.55 | 1 | 1 | 1 |
| `GET /audit` | 20 | 100.0% | 6.25 | 1 | 95 | 95 |
| `GET /intelligence/forecast/overview` | 20 | 100.0% | 6.1 | 1 | 91 | 91 |

*Note: Measured empirically on local development environment with Node 20.x and 50,005 KSP dataset records loaded into memory.*