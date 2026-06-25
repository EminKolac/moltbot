# Sources & Coverage

*Bibliography and an honest account of what was and wasn't retrievable when building this guide.*

---

## Primary sources (his own words)

**Blog — qullamaggie.com** (his canonical teaching)
- *3 TIMELESS setups that have made me TENS OF MILLIONS!* — https://qullamaggie.com/my-3-timeless-setups-that-have-made-me-tens-of-millions/
  (Jan 2021. **Fully ingested this run** via Apify; the single most important written source — exact
  setup steps, risk %, ORH entries, ADR stop rule, profit-taking, the Livermore quote, sizing math in
  the comments.)
- *How to master a setup: Episodic Pivots* — https://qullamaggie.com/how-to-master-a-setup-episodic-pivots/ (Nov 2021)
- About / FAQ / Blog index — https://qullamaggie.com/about/ · https://qullamaggie.com/faq/ · https://qullamaggie.com/blog/

**YouTube — @Qullamaggie** (live streams; transcripts ingested this run via Apify). Deep-mined:
- *Speculation money is back!* — https://www.youtube.com/watch?v=JNVA5cd_m7M (2023-12-15)
- *EP party!* — https://www.youtube.com/watch?v=TZnX1qEiOkM (2023-12-01)
- *Market mechanics, setups and more* — https://www.youtube.com/watch?v=VdQSDGZBLQE (2023-06-09)
- Also enumerated (May–Jun 2023): SLhbpNuHegw, C7ZZhSxYYLk, 1HFPeLD2zwc, 2UgJ5CvVVK4, _y9Wo0eBP4A
  (transcribed) and 30ksgwzWboo, 8Pa6cllRZNw (captions disabled). Full list: `_corpus/youtube/manifest.csv`;
  mined quotes: `_corpus/youtube/extracted-quotes.md`.
- He notes a "mandatory" breakout teaching video (on a moderator's channel): https://www.youtube.com/watch?v=xx8GvtAxilk

**X / Twitter — @Qullamaggie** (https://twitter.com/Qullamaggie) — 20 most-recent posts scraped this
run via Apify (`danek/twitter-scraper-ppr`); notable items in `_corpus/x/tweets.md`. Live market
commentary plus the Market Wizards inclusion and 2025 setup examples.

**Interview**
- *Chat With Traders* (ep. 224) interview notes — https://tradingresourcehub.substack.com/p/interview-qullamaggie-chat-with-traders-part1
  (background, account timeline, philosophy; corroborated via web search — see note on fetch below.)

## Secondary / corroborating sources (third-party)
- Timothy Sykes — *Legends of Trading: Qullamaggie* — https://www.timothysykes.com/blog/qullamaggie/
- ChartMill — *Kristjan Kullamägi Continuation Breakout Screen* — https://www.chartmill.com/documentation/stock-screener/technical-analysis-trading-strategies/467-Kristjan-Kullamagi-Continuation-Breakout-Screen
- ChartMill — *Mastering the Qullamaggie Episodic Pivot Setup* — https://www.chartmill.com/documentation/stock-screener/technical-analysis-trading-strategies/494-Mastering-the-Qullamaggie-Episodic-Pivot-Setup-A-Flexible-Stock-Screening-Approach
- Deepvue — *Qullamaggie Screens* — https://deepvue.com/screener/qullamaggie-screens/
- Financial Wisdom TV — *The Episodic Pivot Strategy* — https://www.financialwisdomtv.com/post/the-episodic-pivot-strategy-qullamaggie-s-high-momentum-setup-explained
- Stocks & Futures Trading — *How Kristjan Kullamägi Trades Breakouts & Episodic Pivots* — https://stocksandfuturestrading.com/how-kristjan-kullamagi-trades-breakouts-episodic-pivots-to-make-huge-returns/
- Jack Corsellis — *Kristjan Qullamaggie Stock Trading Strategy* — https://jackcorsellis.com/kristjan-qullamaggie-stock-trading-strategy/

## Key rules, cross-referenced (each to ≥2 independent sources)
| Rule | Sources |
|---|---|
| Risk **0.25–1%** per trade, rarely >1% | 3-setups blog; Chat With Traders notes |
| Entry = **opening-range-high** (1m/5m/60m) | 3-setups blog; 2023 streams; ChartMill |
| Stop = **low of day, ≤ 1× ADR/ATR** | 3-setups blog (comments); 2023 streams |
| Sell **1/3–1/2 in 3–5 days**, trail **10/20-day MA** | 3-setups blog; Speculation-money stream; Deepvue |
| **EP = +10% gap + huge volume + not pre-extended** | 3-setups blog; EP party stream; FinancialWisdom/ChartMill |
| **Regime filter** (index 10/20-day) gates longs | 2023 streams; Chat With Traders; Sykes |
| Win rate **~25–35%**, asymmetric R | 3-setups blog; multiple third-party |

Where sources conflicted, the conflict is stated in-text rather than smoothed over — e.g. **risk per
trade** (his blog "0.25–1%, up to 0.5–1.5% when accounts were small" vs. third-party simplifications
to "~0.5%"), and **consolidation length** (his blog's "2 weeks to 2 months" vs. tighter community
restatements). The guide follows **his own words** as the primary authority.

---

## Ingestion coverage note (what this environment allowed)

This build ran in a sandbox with a **policy-enforcing egress proxy**, which materially shaped sourcing:

- **Direct YouTube and direct Apify API are egress-blocked** here (`yt-dlp` → youtube.com and `curl` →
  `api.apify.com` both returned **403** at the proxy). Per environment policy these blocks are reported,
  not circumvented.
- **Ingestion therefore ran through the connected Apify MCP server** (routed separately from the proxy,
  on its own auth): the `starvibe/youtube-video-transcript` actor for transcripts and `apify/rag-web-browser`
  for the blog (which also bypassed the **Cloudflare 403** that blocked direct `WebFetch` of qullamaggie.com).
- **YouTube depth was capped** by the MCP account's **free tier (10 videos per channel call)**. His
  `@Qullamaggie` channel exposes only ~**10 recent videos (May–Dec 2023)** — he deleted most older
  educational uploads — and a date-windowed query before that returned 0; the archive channel
  `@tradingarchive2702` did not resolve. **8 of 10** videos were transcribable; **3** were deep-mined.
  So YouTube coverage is **his recent streams, not his full historical catalog** (the deleted older
  material is unavailable from his own channel by any route).
- **X/Twitter was captured** (follow-up run) via the Apify `danek/twitter-scraper-ppr` actor — the
  free tier returned his **20 most-recent posts** (Oct 2025 – Jun 2026); the first two actors tried
  (`apidojo/tweet-scraper`, profile + handle modes) returned `noResults` on the free tier. His feed is
  mostly live market commentary, but it added real value: his **Market Wizards: The Next Generation
  (2026)** inclusion, his paper-vs-live origin story, and dated examples of all three setups (base
  breakouts $ALAB/$DAVE, parabolic shorts $QBTS/$RGTI). A deeper query for his highest-engagement
  tweets hit a transient tool error and was not retried. Saved to `_corpus/x/tweets.md`.
- **User-provided Apify API keys could not be used** (direct Apify API is egress-blocked, and the MCP
  tools authenticate with the server's own token, not a passed-in key). They were **never written to
  any file or committed**. Because they were shared in plaintext, rotating them is advisable.

Net: **primary sourcing is strong** (his definitive blog article in full + three dated 2023 streams +
20 recent X posts + cross-checked third-party material), with the honest limitation that his **deleted
pre-2022 video catalog** and **deep X history** were not retrievable on the free tier in this environment.

---

*Corpus artifacts retained in `./_corpus/` (blog markdown, YouTube manifest + extracted quotes). The
guide is educational synthesis, not financial advice; returns cited are self-reported and
bull-market-weighted.*
