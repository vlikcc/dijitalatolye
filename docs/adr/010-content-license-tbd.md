# ADR-010: İçerik Telif Modeli (Açık)

- **Durum:** Proposed (bekleniyor)
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci + (MEB / hukuk danışmanı)

## Bağlam

PRD §11 Açık Soru #2: İçerik telifi öğretmende mi kalacak, platformda mı? Lisans modeli (CC-BY-SA?) kullanılacak mı?

## Karar (önerilen, henüz alınmadı)

**Öneri:** İçerik telifi **öğretmende** kalır. Platform, içeriği barındırma, gösterme ve dağıtma için **dünya çapında, telifsiz, sınırsız süreli, münhasır olmayan lisans** alır. İçerik aynı zamanda **CC BY-SA 4.0** ile lisanslanır (öğretmen tercihen başka lisans seçebilir: CC BY 4.0, CC BY-NC 4.0).

Bu karar Faz 4 (KVKK / hukuki) öncesi netleşmeli.

## Açık Sorular

1. MEB iş birliği varsa MEB de lisans almak ister mi?
2. Öğretmen içeriğini silebilir mi (yayın sonrası)?
3. Platform içerik üzerinde değişiklik yapma hakkı talep ediyor mu (örn: erişilebilirlik düzeltmeleri)?
4. Telif ihlali durumunda DMCA-benzeri süreç nasıl?

## Etki

Bu karar şu modüllerin tasarımını etkiler:
- Content Service: lisans alanı, lisans seçimi UI'ı
- Frontend: içerik detay sayfasında lisans gösterimi
- KVKK / Kullanım Şartları metni
- Veri silme akışı
