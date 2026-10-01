#!/bin/bash
# Usage: ./shoot.sh <name> [<name> ...]   (name = file in screens/ without .html)
# Writes shots/<name>-desktop.png (1440 wide, full page), shots/<name>-mobile.png (393x852 first screen)
# and shots/<name>-mobile-full.png (393 wide, full page). Uses Playwright driving the installed Chrome.
cd "$(dirname "$0")"
for n in "$@"; do
  url="file://$PWD/screens/$n.html"
  playwright screenshot --channel chrome --viewport-size=1440,900 --full-page --wait-for-timeout=1200 "$url" "shots/$n-desktop.png" >/dev/null 2>&1
  playwright screenshot --channel chrome --viewport-size=393,852 --wait-for-timeout=1200 "$url" "shots/$n-mobile.png" >/dev/null 2>&1
  playwright screenshot --channel chrome --viewport-size=393,852 --full-page --wait-for-timeout=1200 "$url" "shots/$n-mobile-full.png" >/dev/null 2>&1
  echo "shot $n: $(ls shots/$n-*.png | wc -l | tr -d ' ') files"
done
