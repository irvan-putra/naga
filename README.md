# Edge AI & Multimodal Applications in Python - Live Demos

Companion code for the PythonID Jakarta October Meetup talk
(Universitas Budi Luhur, 31 Oct 2026).

One smartphone, one laptop, one local Wi-Fi network. No cloud, no API keys.
The phone is just a sensor: mic, camera, IMU. All inference runs on the laptop.

## Architecture

```
phone browser ──WebSocket──> hub (FastAPI) ──MQTT──> demo processes
  mic · camera · IMU          localhost:8000         0 voice · 1 vision · 2 dashboard · 3 hardware
```

The phone never installs an app - it opens `http://<laptop-ip>:8000` in its
browser. The hub republishes every stream onto local MQTT topics, which is
itself the point of Demo 3: the transport is the product.

| Topic           | Payload                        | Used by |
| --------------- | ------------------------------ | ------- |
| `phone/audio`   | PCM16 mono frames (base64)     | Demo 0  |
| `phone/frames`  | JPEG camera frames (base64)    | Demo 1  |
| `phone/sensors` | JSON accelerometer/gyro events | Demo 3  |

## The 12-minute demo block (talk run order)

| Time | Demo | Shows | Run |
| ---- | ---- | ----- | --- |
| 0:00-2:00 | Demo 0 - voice slide control | faster-whisper, zero-latency local ASR. Say "Lanjut" / "Kembali" | `python demo0_voice_slides/main.py` |
| 2:00-6:00 | Demo 1 - audience counter (TI) | YOLO pose: counts people, detects raised hands | `python demo1_vision_counter/main.py --show` |
| 6:00-9:00 | Demo 2 - live dashboard (SI) | counts stream into a Streamlit polling/BI dashboard | `streamlit run demo2_dashboard/app.py` |
| 9:00-12:00 | Demo 3 - sensor pipeline (SK) | MQTT topics trigger local hardware loops | `python demo3_sensor_mqtt/main.py` |

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Local MQTT broker (offline-first: no internet needed on show day)
#   Ubuntu/Debian: sudo apt install mosquitto && sudo systemctl start mosquitto
#   macOS:         brew install mosquitto && brew services start mosquitto
#   Windows:       https://mosquitto.org/download  (or use WSL)

# Start the phone hub
python hub/app.py          # prints the URL to open on the phone
```

Both devices must be on the same Wi-Fi. If the venue isolates clients
(very common!), bring a travel router or use the laptop's hotspot - that is
the single most likely failure on show day. Test everything in airplane-mode
conditions: local network up, internet down.

First run downloads models automatically: faster-whisper `base` (~150 MB)
and YOLOv8n-pose (~6 MB). Do this at home, not at the venue.

Each demo folder has its own README with the talk beats it supports.

## Backup plan (appendix slides 20-21)

Record each demo working (`--show` windows + terminal) *before* the talk.
If a demo fails live, play the recording and keep narrating - the audience
came for the ideas.

## Browser editions (`web/`) - the online demo lab

Static re-implementations that run the same ideas in any modern browser -
no Python, no server, hostable on GitHub Pages:

| Page | Stack | Notes |
| ---- | ----- | ----- |
| `web/demo0/` | transformers.js + whisper-tiny (wasm) | Voice-controlled mini deck ("Lanjut"/"Kembali") |
| `web/demo1/` | MediaPipe PoseLandmarker | Webcam people counter + raised hands; feeds Demo 2 via localStorage |
| `web/demo2-stlite/` | stlite (real Streamlit in Pyodide) | Reads Demo 1's counts live; labeled simulation fallback |
| `web/demo3/` | MQTT.js over `wss://broker.emqx.io:8084` | Phone IMU -> public broker -> live feed + shake detection; simulator fallback |
| [Historical simulation lab](https://vanipy.com/naga/demo-lab-simulation/) | Built-in React wrapper | Four portable demonstrations with simulated controls; no actual sensors or camera |

First load needs internet (models/wheels from public CDNs, then cached).
Demo 3 relays through a free public broker by design.

### Publish on GitHub Pages

```bash
git init && git add -A && git commit -m "Edge AI demo lab"
gh repo create naga --public --source=. --push
gh api repos/{owner}/naga/pages -X POST -f "source[branch]=main" -f "source[path]=/"
# live at https://<username>.github.io/naga/ in ~1 minute (this copy: https://vanipy.com/naga/)
```

(The repo root `index.html` redirects into `web/`, so serving from the root works as-is.)


## Historical simulation lab

A separately labeled, portable browser page with simulations of all four demonstrations is published at [vanipy.com/naga/demo-lab-simulation](https://vanipy.com/naga/demo-lab-simulation/). It has no microphone, camera, sensor or network access. The [source and audited historical demo archive](demo-lab-simulation/) are included here. The archive is not the current repository, and its external dependencies and hardware behavior are not claimed to work today.

## Illustrations

![Illustration of a phone showing audience silhouettes linked to microphone, hand, chart and chip icons.](assets/illustrations/naga-phone-sensor-illustration.png)

*Illustrative artwork for the Edge AI demo code. It is not an application screenshot or proof of a working people counter.*

![Illustration of voice, vision and motion inputs feeding a laptop with signal and pose panels.](assets/illustrations/edge-ai-demo-lab-illustration.png)

*Additional concept illustration, not a real application screenshot or evidence of a completed live demo. The examples and demos here should be treated as simulations unless a live run is shown.*

---

Built with AI assistance (Instinct and others). Not everything has been reviewed by Irvan.
