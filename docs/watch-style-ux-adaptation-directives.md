# Scentify UX/Flow Adaptation Directives (Watch-App Style)

Bu belge, saat appindeki deneyim kalitesini Scentify'a kod ve veritabanı düzeyinde taşımak için Codex'e verilecek görevleri içerir.

## 1) Hedef Mimari (Bu repoya göre)

- Launch gate korunacak: `Splash -> Auth -> Onboarding -> Main Tabs`.
- Mevcut tab düzeni korunacak: `For You`, `Discover`, `Collection`, `Profile`.
- Journal ekranı tabdan gizli kalacak (`href: null`) ve context-based açılacak.
- Secondary akışlar sheet-first yaklaşımıyla ilerleyecek (ayarlar, hızlı ekleme, filtre).

Mevcut referans dosyaları:
- `/Users/mucahit/Desktop/Scentify/app/index.tsx`
- `/Users/mucahit/Desktop/Scentify/app/(main)/_layout.tsx`
- `/Users/mucahit/Desktop/Scentify/stores/useUserStore.ts`
- `/Users/mucahit/Desktop/Scentify/stores/useOnboardingStore.ts`

## 2) Codex'e Verilecek Uygulama Sırası

Her adımı ayrı görev olarak ver. Her görev sonunda `npm run lint` ve mümkünse typecheck çalıştırılsın.

### Görev 1: Create Intercept Tab Davranışı

Amaç:
- Saat appindeki gibi ortada "create/ekle" davranışı: tab değişmeden compose açılması.

Direktif:
- `app/(main)/_layout.tsx` içinde ortadaki bir tab öğesini gerçek route yerine intercept davranışına çevir.
- Tab seçildiğinde aktif tab `index` veya son tabda kalmalı.
- Compose için ayrı route aç: örn `/journal/new` veya sheet route.
- Geri davranışı: compose kapanınca kullanıcı önceki contextte kalmalı.

Kabul Kriterleri:
- Alt menüde create ikonu görünüyor.
- Create'e basınca sayfa push yerine modal/sheet açılıyor.
- Kapanınca tab state bozulmuyor.

### Görev 2: Sheet-First Secondary Flows

Amaç:
- Settings, quick add, filter refine ve benzeri ikincil akışların push yerine sheet ile açılması.

Direktif:
- `profile`, `collection`, `discover` içindeki ikincil route'ları gözden geçir.
- Kritik olmayan detayları sheet'e taşı.
- Destructive işlemlerde `Alert`/onay adımı zorunlu olsun.

Kabul Kriterleri:
- En az 3 ikincil akış sheet'e taşınmış.
- Her destructive aksiyonda onay var.

### Görev 3: Empty/Loading/Error State Standardizasyonu

Amaç:
- Saat appindeki gibi her ana ekran için ayrı empty/loading/error halleri.

Direktif:
- `app/(main)/index.tsx`, `discover.tsx`, `collection.tsx`, `profile.tsx` için state matrisi çıkar.
- Her state için tutarlı component kullan (`Card`, `Button`, kısa açıklama, net CTA).
- Network hata mesajlarını tek helper üstünden standartlaştır.

Kabul Kriterleri:
- 4 ana ekranda empty/loading/error state belirgin ve tutarlı.
- Retry CTA'sı olan en az 2 hata senaryosu var.

### Görev 4: Motion + Haptic Katmanı

Amaç:
- Mikro-etkileşimleri premium ama sakin bir seviyede standardize etmek.

Direktif:
- `useMotionProfile` ve `useMotionStore` kurallarını tüm kritik CTA'lara uygula.
- Haptic seviyeleri ayır: selection (chip/tab), impact (primary CTA), success (save/complete).
- Reduced motion aktifken animasyonları sadeleştir.

Kabul Kriterleri:
- En az 5 noktada haptic bilinçli uygulanmış.
- Reduced motion’da layout kırılmadan animasyon azalıyor.

### Görev 5: Onboarding Sorularını Saat Kurgusuna Eşdeğer Derinliğe Getir

Amaç:
- Saat appindeki intent/style/usage derinliğini parfüm domaininde netleştirmek.

Direktif:
- Mevcut adımlar: `gender, love, dislike, owned, styles, context, budget, weather`.
- Bunları kullanıcı açısından 3 gruba ayır: Profil, Koku Zevki, Kullanım Senaryosu.
- Her adımda tek karar odağı kuralını koru.
- Son adım sonrası net preview + paywall geçişi bırak.

Kabul Kriterleri:
- Onboarding adım sırası mantıksal 3 faza ayrılmış.
- Kullanıcı her adımda tek ana karar veriyor.

## 3) Veritabanı Adaptasyon Direktifleri (Supabase)

Mevcut şema güçlü. Saat appine yakın sosyal/akış davranışı için aşağıdaki genişletmeler önerilir.

### A) Koleksiyon Durumlarını Zenginleştir

Mevcut:
- `collections.status`: `owned`, `wishlist`, `want_to_try`, `sampled`.

Önerilen genişletme:
- `decant`, `finished_bottle`, `sold`, `backup_bottle`.

Codex Direktifi:
- Yeni migration dosyası oluştur.
- `collections.status` check constraint'ini genişlet.
- Eski verileri bozmadan reversible migration yaz.

### B) Satın Alma ve Batch Takibi

Amaç:
- Service record karşılığı parfümde batch, reformulation, source tracking.

Önerilen alanlar (`collections`):
- `batch_code text`
- `purchase_source text`
- `price_paid numeric(10,2)`
- `is_reformulated boolean default false`
- `opened_at date`
- `finished_at date`

Codex Direktifi:
- Migration + typed client tarafı + form alanlarını bağla.

### C) Sosyal İnceleme Güçlendirmesi

Mevcut:
- `ratings.review_text`, `impression_tags`, `score`.

Önerilen alanlar (`ratings`):
- `longevity_score numeric(2,1)` (0.5-5)
- `sillage_score numeric(2,1)` (0.5-5)
- `seasonal_fit jsonb default '[]'`
- `context_fit jsonb default '[]'`

Codex Direktifi:
- Migration yaz.
- `app/review/[id].tsx` ve ilgili servislerde yeni alanları read/write et.

### D) Notification ve Activity Altyapısı

Amaç:
- Bildirim/akış davranışını saat appi seviyesine çekmek.

Yeni tablolar:
- `notifications` (user_id, type, title, body, entity_type, entity_id, is_read, created_at)
- `user_activity` (user_id, action_type, entity_type, entity_id, metadata, created_at)

Codex Direktifi:
- RLS ekle (own row).
- Basit list/read-all-read endpoint query'lerini servis katmanına ekle.

## 4) Uyum Kuralları (Non-Negotiable)

- Domain dili tamamen parfüm odaklı olacak; saat terimi kalmayacak.
- Dark-luxury tema korunacak ama erişilebilirlik kontrastı düşmeyecek.
- Modal derinliği en fazla 2 katman olacak.
- Boş state'ler daima bir sonraki eylemi önerecek.
- Her kritik kaydetme aksiyonunda görsel + haptic geri bildirim olacak.

## 5) Hızlı SQL Başlangıç Şablonu

```sql
-- Example: extend collections status domain
alter table public.collections
  drop constraint if exists collections_status_check;

alter table public.collections
  add constraint collections_status_check
  check (
    status in (
      'owned',
      'wishlist',
      'want_to_try',
      'sampled',
      'decant',
      'finished_bottle',
      'sold',
      'backup_bottle'
    )
  );
```

## 6) Bu Belgeyi Kullanım Şekli

- Codex'e her seferinde tek görev ver (Yukarıdaki "Görev 1..5").
- DB genişletmelerini tek migration içinde değil, mantıksal olarak ayrı migration dosyalarında yaptır.
- Her görev sonunda değişen dosya listesi + test çıktısı iste.
