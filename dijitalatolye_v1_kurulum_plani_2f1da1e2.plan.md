---
name: DijitalAtolye V1 Kurulum Plani
overview: DijitalAtölye platformunun V1 sürümünü 22 haftada (5 faz) self-hosted K3s altyapısı üzerinde, DeepSeek LLM ile gerçek AI moderasyon entegrasyonlu olarak kuracak; Faz 1 sonunda uçtan uca 'tek içerik yayınlandı' vertical slice demosu sağlayacak yol haritası.
todos: []
isProject: false
---

# DijitalAtölye V1 Kurulum Planı

## Bağlam

[`01-PRD-DijitalAtolye.md`](01-PRD-DijitalAtolye.md), [`02-Sistem-Mimarisi.md`](02-Sistem-Mimarisi.md), [`03-Todo-List.md`](03-Todo-List.md) dokümanları temel alınarak V1 sürümü için 22 haftalık (5 faz) bir uygulama planı tasarlandı. Workspace şu an boş — tüm kurulum sıfırdan yapılacak.

## Sapma Niteliğinde Kararlar (Mimari Dokümandan Farklı)

Aşağıdaki seçimler `02-Sistem-Mimarisi.md`'deki önerilerden saptığı için ADR'larda netleştirilmesi kritik:

- **Cloud:** GCP/Cloud Run yerine **self-hosted K3s + VPS** (Hetzner/DigitalOcean önerilir, Faz 0 ADR-008'de netleşecek)
- **LLM:** Gemini öncelikli yerine **DeepSeek primary** (maliyet odaklı), soyutlama ile Gemini/Claude fallback
- **AI Moderation:** Mock-first yerine **Faz 1'den itibaren gerçek LLM** (erken validasyon, ama Faz 1 token bütçesi gerekli)
- **Geliştirici Kaynağı:** Faz 1 tek geliştirici (Veli), **Faz 2+ ekip büyütme** (vertical slice ile başla, paralelleştirilebilir parçalara böl)

## Genel Yol Haritası (22 Hafta)

```mermaid
gantt
    title DijitalAtolye V1 Yol Haritasi (22 Hafta)
    dateFormat YYYY-MM-DD
    axisFormat %W

    section Faz 0 Foundation
    Repo + ADR + Mimari   :f0a, 2026-04-27, 7d
    Dev Env + CI + K3s    :f0b, after f0a, 7d

    section Faz 1 Cekirdek + Vertical Slice
    Building Blocks       :f1a, after f0b, 5d
    Identity + User       :f1b, after f1a, 7d
    Catalog + Storage     :f1c, after f1b, 7d
    Content + AI Moderation Service :f1d, after f1c, 10d
    Review + Notification :f1e, after f1d, 5d
    API Gateway + Frontend Iskelet :f1f, after f1e, 8d
    E2E Vertical Slice Demo :milestone, after f1f, 0d

    section Faz 2 Olgunlasma
    AI Prompt + Editor Olgunlasma :f2a, after f1f, 14d
    Frontend Ogretmen + Editor Panel :f2b, after f2a, 14d
    Notification + Analytics :f2c, after f2b, 14d

    section Faz 3 Yayin Kesif
    Search Service        :f3a, after f2c, 10d
    Frontend Kesif + SEO  :f3b, after f3a, 10d
    Etkilesim + Paylasim  :f3c, after f3b, 8d

    section Faz 4 Yonetim + Beta
    Admin + Audit         :f4a, after f3c, 7d
    Guvenlik + KVKK + Test :f4b, after f4a, 7d
    Beta Lansman          :f4c, after f4b, 14d
```

## Mimari Genel Bakış (10 Servis + Frontend)

```mermaid
flowchart TB
    Web[React Web SPA<br/>Ogretmen / Ogrenci / Editor / Admin]
    CDN[CDN + WAF]
    GW[API Gateway YARP]

    Web --> CDN --> GW

    subgraph Cekirdek
        ID[Identity Service]
        US[User Service]
        CT[Content Service]
        CL[Catalog Service]
        ST[Storage Service]
    end

    subgraph Moderasyon
        AI[AI Moderation Service<br/>DeepSeek primary]
        RV[Review Service]
    end

    subgraph YayinKesif
        SR[Search Service<br/>Elasticsearch]
        AN[Analytics Service]
    end

    subgraph Destek
        NT[Notification Service]
    end

    GW --> ID & US & CT & CL & RV & SR & AN
    CT -.-> ST
    CT -.events.-> AI
    AI -.events.-> RV
    RV -.events.-> CT
    CT -.events.-> SR & NT

    MQ[(RabbitMQ + MassTransit)]
    RD[(Redis Cache)]
    PG[(PostgreSQL per Service)]
    MG[(MongoDB - AI raporu)]
    ES[(Elasticsearch)]
    MN[(MinIO Object Storage)]

    Cekirdek -.-> PG
    AI -.-> MG
    SR -.-> ES
    ST -.-> MN
    Cekirdek & Moderasyon & YayinKesif & Destek -.-> MQ
    CL & ID -.-> RD
```

## Vertical Slice Stratejisi (Faz 1 Kritik)

`03-Todo-List.md`'nin sonundaki "Tek başına geliştirme stratejisi" notuna uygun olarak Faz 1 sonunda **uçtan uca tek bir içerik yayını** çalışmalı. Bu, V1'in geri kalanı için en