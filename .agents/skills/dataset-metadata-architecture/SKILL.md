---
name: dataset-metadata-architecture
description: Architecture and design patterns for building scalable dataset catalogs with separated object storage, relational metadata, licensing & access rules, search indexing, and flexible JSON custom attributes.
---

# 📊 Dataset Metadata Architecture & Catalog Design

This skill provides architectural guidelines, database schemas, and best practices for building scalable systems that store, catalog, and query thousands of diverse datasets.

---

## 1. Core Architectural Strategy: Separation of Concerns

* **Raw Data in Object Storage:** Store heavy binary files (CSV, Parquet, images, audio, dumps) in Object Storage (e.g. AWS S3, Google Cloud Storage, Supabase Storage, Azure Blob Storage).
* **Metadata in Relational DB:** Keep metadata, pointers, URIs, and structural attributes in a relational database (PostgreSQL, Supabase, MySQL).
* **Search Indexing:** Index names, descriptions, domains, and tags in a fast search index (Elasticsearch, OpenSearch, or PostgreSQL `tsvector`/`pg_trgm`) to enable sub-second filtering across thousands of entries.

---

## 2. Unified Metadata Catalog Schema

A core `datasets` table provides discovery, categorization, and tracking for all format types.

### Primary Fields Checklist
- `id`: Unique identifier (UUID or CUID)
- `name`: Human-readable dataset name
- `slug`: URL-friendly identifier
- `description`: Detailed markdown or text description
- `fileType`: Format extension (`csv`, `parquet`, `json`, `mp4`, `tar.gz`)
- `sizeBytes`: Exact size in bytes
- `storageUri`: Pointer to object storage (`s3://bucket/path/to/file` or `https://...`)
- `domain`: Category or sector (`finance`, `healthcare`, `nlp`, `vision`)
- `source`: Origin provider or creator
- `tags`: Array of string keywords for categorization
- `licenseId`: Foreign key to structured license table
- `accessRules`: Authorization requirements (`public`, `internal`, `restricted`)
- `customAttributes`: `JSONB` for format-specific or domain-specific metadata
- `createdAt` & `updatedAt`: Audit timestamps

---

## 3. First-Class Licensing & Usage Rules

Do not scatter license rules across freeform strings. Use a dedicated `licenses` table.

### License Attributes
- `isProprietary`: Boolean flag (`true` = proprietary, `false` = open source)
- `geoRestrictions`: Array of country/region ISO codes where usage is permitted/blocked
- `userAccessScope`: Scope limitation (`all`, `internal_only`, `verified_auditors`, `subscribers`)
- `timeBound`: Expiration timestamp or retention period
- `pricingTier`: Monetary cost or subscription model (`free`, `tier_1`, `enterprise`)

---

## 4. Reference Schema (Prisma ORM & PostgreSQL)

```prisma
model Dataset {
  id               String       @id @default(uuid())
  name             String
  slug             String       @unique
  description      String       @db.Text
  fileType         String
  sizeBytes        BigInt
  storageUri       String
  domain           String
  source           String
  tags             String[]
  accessRules      String       // 'PUBLIC' | 'RESTRICTED' | 'INTERNAL'
  
  // Custom schema-light extension
  customAttributes Json?        @default("{}")

  // Relationships
  licenseId        String
  license          License      @relation(fields: [licenseId], references: [id])
  
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([domain])
  @@index([fileType])
  @@index([licenseId])
}

model License {
  id               String       @id @default(uuid())
  name             String       // e.g. "MIT", "CC-BY-4.0", "Commercial Restricted"
  code             String       @unique
  isProprietary    Boolean      @default(false)
  geoRestrictions  String[]     @default([])
  userAccessScope  String       @default("ALL")
  pricingTier      String       @default("FREE")
  termsUrl         String?
  
  datasets         Dataset[]
  createdAt        DateTime     @default(now())
}
```

---

## 5. Schema-Light Flexibility via JSON Columns

To accommodate format-specific details (e.g. image resolution, audio sampling rate, model weights framework) without continuous DB migrations:
* Use a `JSONB` column (`customAttributes`).
* Query JSON attributes using native PostgreSQL operations:
  ```sql
  SELECT * FROM "Dataset" 
  WHERE "customAttributes"->>'samplingRate' = '44100Hz';
  ```

---

## 6. Supported User Workflows

Design query APIs and interfaces around these primary user flows:

1. **Discovery & Browsing:** Filter by domain, file type, tag, or keyword with fast search indexing.
2. **License Compliance Check:** Verify `userAccessScope` and `geoRestrictions` against the user's session before returning download URIs.
3. **Metadata Inspection:** Serve full dataset profile (size, sample rows, custom attributes) prior to generating pre-signed storage download links.
4. **Pre-signed Download Generation:** Issue short-lived S3/Supabase Storage pre-signed URLs rather than proxying heavy files through API servers.
