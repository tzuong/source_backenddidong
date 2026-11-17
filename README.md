# SMART OFFICE – Backend Node.js + MQTT Broker + Virtual ESP32

Backend tham khao cho app **SmartOffice Mobile React Native (Lab 3)** da tao. Khong can ESP32 that de demo.

> Theo phieu cham: Lab 2 la **MQTT Broker**, khong bat buoc phai co REST Backend rieng. Node.js REST API o day la phan bo sung. App da viet se ket noi truc tiep MQTT Broker va khong can goi REST API.

## 1. Kien truc

```text
React Native (Expo Go) <----MQTT/WebSocket:9001----> Mosquitto Broker
                                                     ^  ^
                                                     |  |
                                MQTT/TCP:1883 -------+  +------ MQTT/TCP:1883
                                                     |          |
                                           Node.js REST API  Virtual ESP32
                                          (localhost:3000)  (simulator.js)
```

- **Broker:** Docker Mosquitto, username/password, ACL, 2 ports 1883 (TCP) & 9001 (WebSocket).
- **Backend:** Express GET status/data/log; POST API command through MQTT.
- **Simulator:** sends telemetry every 5s; receives cmd; publishes state & online/offline.
- **App:** already uses same MQTT topics; default demo mode must be changed to **MQTT that**.

## 2. Chuan bi tren Windows

Required: Node.js >=20, Docker Desktop running, VS Code + Android Expo Go.

Gia su ban giai nen vao `D:\SmartOffice_Backend_NodeJS`.

**Step 1:** In PowerShell:

```powershell
cd D:\SmartOffice_Backend_NodeJS\broker
.\scripts\setup-passwords.ps1
```

The command asks 3 passwords: `backend`, `simulator`, `mobile`. You choose and remember them. If PowerShell blocks local scripts, run the same script with `powershell -ExecutionPolicy Bypass -File .\scripts\setup-passwords.ps1` after inspecting its content.

**Step 2:** Start MQTT Broker:

```powershell
docker compose up -d
docker compose logs -f
```

Use `Ctrl+C` to stop following logs (the Broker remains running).

**Step 3:** Open a NEW Terminal, create `.env`:

```powershell
cd D:\SmartOffice_Backend_NodeJS
Copy-Item .env.example .env
notepad .env
npm install
```

Set `.env` values to match passwords chosen earlier:

```env
HTTP_HOST=127.0.0.1
PORT=3000
API_KEY=your_long_private_api_key_here
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=backend
MQTT_PASSWORD=the_backend_password
SIMULATOR_USERNAME=simulator
SIMULATOR_PASSWORD=the_simulator_password
```

**Step 4:** Start backend REST API:

```powershell
npm start
```

Expected: `[API] http://127.0.0.1:3000 ...` and `[MQTT] Connected ...`.

**Step 5:** Open a second NEW Terminal for Virtual ESP32:

```powershell
cd D:\SmartOffice_Backend_NodeJS
npm run simulate
```

Expected: `[SIM] Virtual ESP32 connected ...` and new sensor data every 5 seconds.

## 3. Ket noi app React Native hien tai

1. Make sure Android phone and Windows PC are connected to the same Wi-Fi.
2. Find **Windows LAN IPv4**: `ipconfig` -> Wi-Fi `IPv4 Address` (example `192.168.1.20`, NOT fixed value).
3. Open Smart Office app -> **Cai dat** -> **MQTT that**.
4. URL: `ws://192.168.1.20:9001` (replace with your actual Windows IPv4).
5. Username `mobile`, password = mobile password from step 1.
6. Press **Ket noi MQTT Broker**.
7. Dashboard should update from Node simulator every 5 seconds; turn light/fan ON/OFF and check state acknowledgement.

If connection fails, allow incoming TCP port **9001** on Windows Defender Firewall for Private networks and check phone uses the same LAN. On Android emulator, `ws://10.0.2.2:9001` may work instead of LAN IP. **Never enter `localhost` on the physical phone.** If you are using an older Broker already listening on 1883/9001, stop it or change ports to avoid conflicts.

Note: `ws://` is unencrypted; use only for trusted LAN coursework. For Internet, use `wss://` with TLS, strict ACL and secrets management.

## 4. Test REST API (optional)

Backend REST API is an additional tool: the mobile app does not use these HTTP endpoints.

PowerShell:

```powershell
$headers = @{ 'x-api-key' = 'your_long_private_api_key_here' }
Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -Headers $headers
Invoke-RestMethod 'http://127.0.0.1:3000/api/office' -Headers $headers
Invoke-RestMethod 'http://127.0.0.1:3000/api/events' -Headers $headers
Invoke-RestMethod 'http://127.0.0.1:3000/api/devices/light' -Method POST -ContentType 'application/json' -Headers $headers -Body '{"on":true}'
```

`202 Accepted` means the command was accepted by Broker, **not necessarily executed**; ESP32/Simulator publishes state later. Unknown device -> `404`; invalid JSON or invalid `on` -> `400`; disconnected Broker -> `503`. No database is used: HTTP API keeps recent state and last 100 event logs **in RAM** and resets on restart.

## 5. MQTT topics – compatible with existing app

| Topic | Producer | Example |
| --- | --- | --- |
| `smartoffice/room1/telemetry` | Simulator | `{"temperature":27.1,"humidity":63,"motion":true}` |
| `smartoffice/room1/cmd/light` | App/API | `{"on":true}` |
| `smartoffice/room1/cmd/fan` | App/API | `{"on":false}` |
| `smartoffice/room1/state/light` | Simulator | `{"on":true}` |
| `smartoffice/room1/state/fan` | Simulator | `{"on":false}` |
| `smartoffice/room1/status` | Simulator | `online` / `offline` |

## 6. Verify and demo

```powershell
npm test
```

- MQTT `backend` and `simulator` connect with retry and logs.
- Start app MQTT mode and watch temperature/humidity change every 5 seconds.
- Toggle light/fan on the app -> simulator terminal prints new state -> app receives state acknowledgement.
- Stop simulator -> status topic should turn offline (Last Will); start again -> online.
- Stop Broker and start again -> MQTT clients retry automatically.

This package was syntax-checked and unit-tested. An end-to-end Docker/Broker/Android test requires the student's Windows environment and has **not** been performed here.
