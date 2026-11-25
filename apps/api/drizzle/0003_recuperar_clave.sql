CREATE TABLE "restablecimientos_clave" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expira_en" timestamp with time zone NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restablecimientos_clave_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "restablecimientos_clave" ADD CONSTRAINT "restablecimientos_clave_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "restablecimientos_clave_usuario_idx" ON "restablecimientos_clave" USING btree ("usuario_id");