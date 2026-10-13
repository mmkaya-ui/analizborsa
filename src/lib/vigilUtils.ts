import { Stock } from './api';
import { SocialSignal } from './socialMediaService';

export interface VigilReport {
    score: number;
    decision: 'BUY' | 'SELL' | 'NEUTRAL';
    messages: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    socialSentiment?: {
        score: number;
        summary: string;
    };
    whaleAlerts: WhaleAlert[];
    strategy: string;
}

export interface WhaleAlert {
    symbol: string;
    type: 'ICEBERG' | 'DARK_ROOM' | 'UNUSUAL_VOLUME' | 'SPOOFING';
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: string;
}

export const VigilUtils = {
    analyzeGlobalMarkets: (stocks: Stock[], socialSignals: SocialSignal[] = []): VigilReport => {
        let score = 0;
        const messages: string[] = [];
        const whaleAlerts: WhaleAlert[] = [];
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';

        // Helper to find stock
        const getStock = (symbol: string) => stocks.find(s => s.symbol === symbol);

        const tur = getStock('TUR');
        const spy = getStock('SPY');
        const uup = getStock('UUP'); // Dollar Index Proxy
        const vix = getStock('VIX'); // VIX 
        const nvda = getStock('NVDA');
        const gld = getStock('GLD');

        // --- 1. GLOBAL EYE (KÜRESEL GÖZ) ANALYSIS ---
        // Logic from "Double-Headed Eagle" Strategy

        // A. TUR (Turkey ETF) - Critical Indicator
        if (tur) {
            if (tur.changePercent < -1.5) {
                score -= 3;
                messages.push(`⚠️ $TUR KRİTİK DÜŞÜŞ: %${tur.changePercent.toFixed(2)}. Yabancı çıkışı var. Sabah satıcılı açılış bekleniyor.`);
            } else if (tur.changePercent > 1.5) {
                score += 3;
                messages.push(`🚀 $TUR RALLİSİ: %${tur.changePercent.toFixed(2)}. Yabancı girişi var. Sabah GAP'li yükseliş bekleniyor.`);
            } else {
                messages.push(`ℹ️ $TUR Nötr (%${tur.changePercent.toFixed(2)}). Temkinli iyimserlik.`);
                score += 0.5;
            }
        }

        // B. UUP (Dollar Strength)
        if (uup) {
            if (uup.changePercent > 0.5) {
                score -= 2;
                messages.push(`💵 Dolar Güçleniyor ($UUP). Gelişmekte olan piyasalardan (BIST) para çıkışı riski.`);
            } else if (uup.changePercent < -0.3) {
                score += 2;
                messages.push(`📉 Dolar Zayıflıyor ($UUP). BIST için pozitif rüzgar.`);
            }
        }

        // C. VIX (Fear Index)
        if (vix && vix.price > 20) {
            score -= 2;
            riskLevel = 'HIGH';
            messages.push(`😨 VIX ALARMI: Korku endeksi ${vix.price.toFixed(1)}! Global risk iştahı kapalı. Defansif moda geç.`);
        }

        // D. NVDA (Risk Appetite)
        if (nvda) {
            if (nvda.changePercent > 1.5) {
                score += 1;
                messages.push(`🤖 Risk İştahı Yüksek (NVDA). Teknoloji hisselerine para akıyor.`);
            } else if (nvda.changePercent < -2) {
                score -= 1;
                messages.push(`⚠️ Teknoloji Çöküşü (NVDA). Global satış dalgası tetiklenebilir.`);
            }
        }

        // --- 2. SOCIAL SENTIMENT ---
        let socialScore = 0;
        let socialSummary = "Veri Yok";
        if (socialSignals.length > 0) {
            const totalScore = socialSignals.reduce((acc, curr) => acc + curr.sentimentScore, 0);
            const avgScore = totalScore / socialSignals.length;
            socialScore = avgScore;

            const topSignal = socialSignals.sort((a, b) => b.volume - a.volume)[0];
            socialSummary = topSignal.summary;

            if (avgScore < -0.3) messages.push(`🗣️ Sosyal Medya: Negatif (${topSignal.trendingTopics[0] || 'Satış'}).`);
            else if (avgScore > 0.3) messages.push(`🗣️ Sosyal Medya: Pozitif (${topSignal.trendingTopics[0] || 'Alım'}).`);
        }
        score += socialScore;

        // --- 3. WHALE HUNTING (BALİNA AVI) SIMULATION ---
        // Simulate detection of anomalies on random stocks
        // In real app, this would scan all Tick Data

        const whaleTargets = stocks.filter(s => !['TUR', 'SPY', 'UUP', 'VIX', 'NVDA', 'GLD'].includes(s.symbol)).slice(0, 5); // Pick some BIST stocks

        whaleTargets.forEach(stock => {
            // Simulation Logic
            const rand = Math.random();

            // Iceberg Order
            if (rand > 0.85 && stock.volume > 1000000) {
                whaleAlerts.push({
                    symbol: stock.symbol,
                    type: 'ICEBERG',
                    description: `Gizli Alım Tespit Edildi: Tahtada görünmeyen 1.2M lotluk alım emri bloklandı.`,
                    severity: 'HIGH',
                    timestamp: new Date().toLocaleTimeString()
                });
                score += 0.5; // Whale buying is bullish
            }

            // Dark Room
            if (rand < 0.1) {
                whaleAlerts.push({
                    symbol: stock.symbol,
                    type: 'DARK_ROOM',
                    description: `Karanlık Oda Operasyonu: Kapanışta %2 marj değişimi hesaplandı.`,
                    severity: 'MEDIUM',
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        });


        // --- 4. FINAL DECISION & STRATEGY ---
        let decision: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
        let strategy = "Piyasayı İzle";

        if (score >= 3) {
            decision = 'BUY';
            riskLevel = 'LOW';
            strategy = "⚔️ SALDIRI MODU (ATTACK): Rüzgar arkamızda. Düşüşler alım fırsatıdır. $TUR ve Global veriler pozitif. BofA robotunun önüne geç ve malı topla.";
        } else if (score <= -3) {
            decision = 'SELL';
            riskLevel = 'EXTREME';
            strategy = "🛡️ DEFANS MODU (SHIELD): Fırtına geliyor. Nakite geç. $TUR sert düşüşte. Düşen bıçağı tutma, dibi bekle.";
        } else {
            decision = 'NEUTRAL';
            strategy = "👀 PUSU MODU (AMBUSH): Piyasada yön belirsiz. Balinaların hata yapmasını bekle. Iceberg emirleri takip et.";
        }

        return {
            score,
            decision,
            messages,
            riskLevel,
            socialSentiment: {
                score: socialScore,
                summary: socialSummary
            },
            whaleAlerts,
            strategy
        };
    }
};
