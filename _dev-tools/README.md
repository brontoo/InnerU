# Verification harnesses

These are the headless harnesses used while building the site. Each one serves this
project read-only on a local port, loads the real pages inside same-origin iframes,
drives the DOM (clicks, sliders, typed answers) and prints a PASS/FAIL report.

    python _dev-tools/verify-stage6.py
    # then read the printed URL with any headless Chrome, e.g.
    #   chrome --headless=new --virtual-time-budget=240000 --dump-dom http://127.0.0.1:8817/_verify.html

They are development tools: excluded from the deployment by `.vercelignore`, and they
never write to the project. Adjust the `ROOT` constant if the project is not at
`C:\InnerU`.


Note: these servers are **threaded**. A single-threaded server serialises the 25+
script requests each page needs, and under Chrome's virtual-time budget a frame can then
be asserted before its scripts have run (which shows up as a mysteriously empty page).

| File | What it covers |
| erify-mission-art.py | the mission illustrations: presence, shared style, no overlap, and reduced motion |

|---|---|
| `verify-stage1.py` | answer-position mixing, withheld feedback, weak-concept tracking, the central System Key counter |
| `verify-stage2.py` | the capstone mission, the labs of the time, the certificate, the accessibility layer |
| `verify-stage3.py` | teacher tools (progress codes, class list, reset/undo), offline plumbing, lazy three.js |
| `verify-stage4.py` | the six excretory labs, and that the extracted skeletal content still drives its pages |
| `verify-stage5.py` | the breathing simulator and the spaced-practice review system |
| `verify-stage6.py` | the habit layer (streak, plan, banner) and the force-vs-load simulator |
| `verify-stage7.py` | the tap-to-define glossary and the read-aloud control |

Each harness pins its own port, so they can be run one at a time.
