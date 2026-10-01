# Canonical sample data (use these exact values on every page)

Sample data only. Label it "Sample data" wherever a page could be mistaken for real results.

- **User:** Jordan. Household: 3 roommates, student apartment, Huntsville, AL.
- **Provider and plan:** Northstar Fiber 500 (name used in mockups).
- **Plan on the label:** typical download **500 Mbps**, typical upload **20 Mbps**, typical response time **30 ms**, price **$80 a month**. (Fictional plan values for the demo. Provider name shown as "Northstar Fiber 500" in mockups; the real build will use hand-checked label values.)
- **Fair line:** 80% of the label = **400 Mbps**. Rule: flag when the daily median is below the fair line 3 days in a row.
- **Progress:** Day **9 of 14**. **36 tests** so far (4 a day). Next test 9:40 PM. Today is Wednesday, Sep 30.
- **Daily medians, days 3 to 9 (Thu to Wed):** 452, 431, 418, 389, 372, 381, 366 Mbps. Days 1 and 2: 461, 447.
- **Flagged days:** day 6 (Sun, 389), day 7 (Mon, 372), day 8 (Tue, 381). Today, day 9 (Wed, 366), is also low.
- **Headline:** median **389 Mbps = 78% of plan**. Status word: **Below plan**.
- **Other stats:** upload 22 Mbps (on plan), response time 28 ms (good).
- **Money:** $80 bill. 22% of it, about **$18 a month**, pays for speed not received (estimate).
- **AI anomaly detection:** 2 one-off dips ignored (Fri 2:10 PM, 96 Mbps; Sat 8:05 AM, 141 Mbps). 3 sustained low days kept.
- **AI diagnosis:** likely cause **your provider**, confidence **high (86%)**. Evidence: near-router test 392 Mbps vs. far-room test 371 Mbps (small gap, so not Wi-Fi); evening tests (7 to 11 PM) average 352 Mbps vs. daytime 441 Mbps; 9 devices on the network, normal load.
- **Plans nearby (fictional demo values):** Northstar Fiber 500, $80, current. ValleyLink 1 Gig, $70, AI pick, saves $120 a year. Pinecrest Internet 500, $65 for 12 months then $90. Redstone 600, $60.
- **Household use (for the AI pick):** 3 people, online classes, video calls, streaming, some gaming.
- **Bill scan result:** plan price $65.00, equipment rental $10.00, "network enhancement fee" $5.00 (flagged as a junk fee). Total **$80.00**. Promo price ends Jan 2027.
- **Report:** "Wi-Fight speed report", 14 days, to Northstar support and optionally the FCC.

## Added during the design pass (now canonical)

- **Provider names are fictional**: Northstar Fiber (current), ValleyLink (AI pick), Pinecrest, Redstone. Real provider names must not carry made-up prices. The real build will use hand-checked label values.
- **Days 10 to 14 daily medians:** 394, 389, 384, 377, 369 Mbps. With these, the 14-day median stays 389 and 9 of 14 days (days 6 to 14) fall below the fair line.
- **After the check finishes:** day 14 of 14, 56 tests, Sep 22 to Oct 5.
- **Other plans:** ValleyLink 1 Gig: 1,000 down, 1,000 up, $70. Pinecrest Internet 500: 500 down, 20 up, $65 for 12 months then $90. Redstone 600: 600 down, 35 up, $60. Northstar Fiber 300: $55. Northstar Fiber 1 Gig: $110.
- **24-month cost:** Northstar $1,920. ValleyLink $1,680. Pinecrest $1,860. Redstone $1,440.
- **Time of day averages:** morning 448, afternoon 441, evening 352, night 430 Mbps.
- **Wi-Fi vs. provider likelihood:** 14% vs. 86%.
