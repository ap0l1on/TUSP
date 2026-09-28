# EDITING.md — TUSP içerik düzenleme kılavuzu

Bu site veritabanı kullanmaz. Her şey `public/data/` klasöründeki JSON dosyalarındadır.
GitHub web editöründen düzenlersin, kaydedince site ~1 dakikada güncellenir.

> **Önemli:** Bu repo herkese açık. Öğrenci adı, not, telefon gibi kişisel bilgi ASLA yazma.
> Öğretmen adını sadece okul onaylarsa yaz, yoksa `teacher` alanını boş bırak.

Tüm dosyalarda `"version": 1` kalmalı. Yanlış düzenleme build'i durdurur, yayındaki site eski sağlam sürümde kalır.

## Oda değişikliği ekle (`changes.json`)

```json
{ "date": "2026-10-14", "class": "9A", "p": 2, "type": "room", "room": "Lab-2" }
```

- `type`: `cancelled` (iptal), `substitute` (yerine öğretmen → `teacher` yaz), `room` (yeni oda → `room` yaz), `moved` (yer değişti → `note` yaz, örn. "Spor salonunda"), `extra` (ek ders).
- `class`: `9A` gibi sınıf ya da herkes için `all`.
- 30 günden eski kayıtlar otomatik temizlenir.

## Yarınki duyuruyu ekle (`announcements.json`)

```json
{
  "id": "a-2026-10-14-1",
  "title": "Cuma spor günü: eşofmanla gel",
  "body": "Cuma günü **eşofmanla** geliyoruz.",
  "priority": "urgent",
  "audience": ["all"],
  "publish": "2026-10-13T07:00:00+03:00",
  "expires": "2026-10-15T00:00:00+03:00",
  "pinned": false
}
```

- `priority`: `urgent` (koyu kırmızı), `normal` (mavi), `info` (gri).
- `audience`: `["all"]`, `["grade:9"]` ya da `["9A","9B"]`.
- `publish` gelecekteyse o saate kadar gizli kalır — ama **gizli bilgi yazma**, repo açık.
- Markdown: kalın, italik, liste, link. Ham HTML çalışmaz.

## Haftaya yemek CSV yükle

1. Excel'de `data-src/templates/menu.csv` örneğine göre doldur, CSV olarak kaydet.
2. Repo'ya `data-src/menu.csv` olarak yükle.
3. Action otomatik `public/data/menu.json` üretir ve doğrular.

```csv
date,soup,main,side,veg,dessert,salad,kcal,allergens,note
2026-10-19,Mercimek çorbası,Fırın tavuk,Pirinç pilavı,Kuru fasulye,Kek,true,850,gluten|milk,
```

- `allergens`: `|` ile ayır, örn. `gluten|milk`. Yoksa boş bırak.
- Hafta sonu/tatil günlerini yazma; site otomatik gösterir.

## Ders programı CSV yükle

`data-src/templates/timetable.csv` örneğine göre:

```csv
class,weekday,p,subject,teacher,room
9A,1,1,Matematik,,B-204
```

- `weekday`: 1=Pazartesi … 5=Cuma.
- Kaydedince Action JSON'a çevirir.

## Zil saatleri (`bells.json`)

`TODO(verify)`: Pazartesi–Perşembe 13:10'da bitiyor, sadece Cuma 15:30'a kadar — okul onaylayacak. Tek dosya, 1 dakikalık düzeltme.
