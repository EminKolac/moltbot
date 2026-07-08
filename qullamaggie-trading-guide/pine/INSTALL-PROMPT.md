# Yerel Claude'a yapıştırılacak HAZIR KOMUT (scriptleri otomatik kurar)

Bu komutu, **kendi bilgisayarındaki** Claude Code'a (tradingview MCP bağlı olan) yapıştır. Yerel
Claude, senin TradingView Desktop uygulamanı sürerek 4 script'i hesabına kurar. Ben (buluttaki oturum)
yerel uygulamana erişemediğim için işi senin makinendeki Claude yapar; komutu ben hazırladım.

---

## ÖNCE ŞUNLAR HAZIR OLSUN (bir kez)
1. **TradingView Desktop** açık ve şu şekilde başlatılmış:  `--remote-debugging-port=9222`
   (veya `pine/LOCAL-INSTALL-KIT.md`'deki launch script'i ile).
2. Yerel Claude Code'da **tradingview MCP** bağlı (`~/.claude/.mcp.json`).
3. Bu paketi (zip) masaüstüne açtın; Claude Code'u **bu klasörün içinde** çalıştırıyorsun
   (`.pine` dosyaları `pine/` altında).

---

## AŞAĞIDAKİ METNİ OLDUĞU GİBİ YEREL CLAUDE'A YAPIŞTIR

```text
tradingview MCP'sini kullanarak Pine script kurulumu yap. Gerçek emir/işlem verme; sadece script
oluştur/derle/kaydet.

ADIM 0 — Bağlantı: Önce tv_health_check çağır. Bağlanmıyorsa DUR ve bana söyle: "TradingView Desktop
açık mı ve --remote-debugging-port=9222 ile mi başlatıldı?" kontrol etmemi iste.

ADIM 1 — Kurulum: Bu projenin pine/ klasöründeki şu 4 dosyayı tek tek kur. Her dosya için sırayla:
  a) pine_new ile parantezdeki türde yeni script aç.
  b) Dosyanın TAM içeriğini oku ve pine_set_source ile editöre koy.
  c) pine_smart_compile ile derle.
  d) Hata varsa: pine_get_errors çıktısını bana AYNEN göster, o script'i "hatalı" işaretle, sonrakine
     geç (durma, diğerlerini yine de dene).
  e) Hata yoksa: pine_save ile parantezdeki isimle kaydet.

Dosyalar ve ayarlar:
  1) pine/qullamaggie-breakout.pine        -> tür: strategy   -> isim: "Qulla Breakout"
  2) pine/qullamaggie-episodic-pivot.pine  -> tür: strategy   -> isim: "Qulla Episodic Pivot"
  3) pine/qullamaggie-parabolic-short.pine -> tür: strategy   -> isim: "Qulla Parabolic Short"
  4) pine/qullamaggie-screener.pine        -> tür: indicator  -> isim: "Qulla Leader Screener"

Dosyaları bulamazsan bana söyle, içeriklerini sana yapıştırayım.

ADIM 2 — Rapor: Sonunda tablo ver: | script | kaydedildi? | derleme hatası (varsa metin) |.
Hatalı olanların pine_get_errors çıktısını da ekle ki düzeltmesi için buluttaki Claude'a ileteyim.
```

---

## Derleme hatası çıkarsa
Yerel Claude'un verdiği `pine_get_errors` çıktısını (script adı + hata metni + satır) buraya, bana
yapıştır — script'i birebir düzeltip yeni sürümü veririm. Tüm kaynaklar bu paketin `pine/` klasöründe.
