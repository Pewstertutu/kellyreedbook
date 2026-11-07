CREATE TABLE "usage_counts" (
	"day" date,
	"event" text,
	"symptom" text,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "usage_counts_pkey" PRIMARY KEY("day","event","symptom"),
	CONSTRAINT "usage_count_positive" CHECK ("count" > 0)
);
