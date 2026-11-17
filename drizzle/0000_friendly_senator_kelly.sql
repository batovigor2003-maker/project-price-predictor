CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"origin_code" text NOT NULL,
	"destination_code" text NOT NULL,
	"departure_date" date NOT NULL,
	"return_date" date,
	"adults" integer NOT NULL,
	"children" integer NOT NULL,
	"infants" integer NOT NULL,
	"cabin_class" text NOT NULL,
	"current_price_rub" integer NOT NULL,
	"predicted_price_rub" integer NOT NULL,
	"change_percent" integer NOT NULL,
	"direction" text NOT NULL,
	"advice" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
