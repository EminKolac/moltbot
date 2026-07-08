# Yerel kurulum kiti — scriptleri TradingView hesabına OTOMATİK kurmak

Bu, `tradesdontlie/tradingview-mcp` aracını **kendi bilgisayarında** çalıştırıp bu paketteki 4 Pine
script'ini hesabına otomatik kurdurman içindir. (Bu araç yalnızca yerelde, senin TradingView Desktop
uygulamanı Chrome DevTools ile sürerek çalışır — bulut oturumundan yapılamaz.)

## Gereksinimler
- **TradingView Desktop** uygulaması (geçerli, ücretli abonelik) — kurulu ve giriş yapılmış
- **Node.js 18+**
- **Claude Code** (kendi makinende, `claude` komutu)

## 1) Aracı kur
```bash
git clone https://github.com/tradesdontlie/tradingview-mcp.git
cd tradingview-mcp && npm install
```

## 2) TradingView'i debug portuyla başlat (kapalıyken 9222 açılır)
```bash
# macOS:
./scripts/launch_tv_debug_mac.sh
# Windows:  scripts\launch_tv_debug.bat
# Linux:    ./scripts/launch_tv_debug_linux.sh
# veya elle:  /path/to/TradingView --remote-debugging-port=9222
```

## 3) Claude Code'a MCP olarak ekle
`~/.claude/.mcp.json` (yoksa oluştur):
```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/tradingview-mcp/src/server.js"]
    }
  }
}
```

## 4) Bağlantıyı doğrula
Yerel Claude'a:
> `tv_health_check` ile TradingView bağlantısını doğrula.

Hata alırsan: TradingView Desktop açık mı ve 2. adımı debug portuyla mı başlattın, kontrol et.

## 5) Scriptleri otomatik kurdur (yerel Claude'a yapıştır)
Bu paketteki `.pine` dosyalarını yanına al, sonra şunu de:

> Aşağıdaki 4 script'i tek tek TradingView'e kur. Her biri için: `pine_new` ile uygun türde
> (strategy/indicator) yeni script aç, dosya içeriğini `pine_set_source` ile yapıştır,
> `pine_smart_compile` ile derle, hata olursa `pine_get_errors` çıktısını bana göster, hata yoksa
> `pine_save` ile "Qulla ..." adıyla kaydet:
> 1. `qullamaggie-breakout.pine` (strategy)
> 2. `qullamaggie-episodic-pivot.pine` (strategy)
> 3. `qullamaggie-parabolic-short.pine` (strategy)
> 4. `qullamaggie-screener.pine` (indicator)

Yerel Claude, MCP araçlarıyla bunları senin hesabına derleyip kaydeder.

## Derleme hatası olursa
`pine_get_errors` çıktısını (veya Pine Editor'deki kırmızı hatayı) bana yapıştır — script'i birebir
düzeltip geri veririm. Script'lerin tümü bu paketin `pine/` klasöründe.
