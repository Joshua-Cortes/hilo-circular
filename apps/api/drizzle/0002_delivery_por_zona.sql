CREATE TABLE "contactos_reparto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repartidor_id" uuid NOT NULL,
	"usuario_id" uuid,
	"comuna" text NOT NULL,
	"canal" "canal_contacto" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repartidores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre_publico" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"comunas" text[] DEFAULT '{}' NOT NULL,
	"whatsapp" text,
	"telefono" text,
	"verificado" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repartidores_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
ALTER TABLE "contactos_reparto" ADD CONSTRAINT "contactos_reparto_repartidor_id_repartidores_id_fk" FOREIGN KEY ("repartidor_id") REFERENCES "public"."repartidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos_reparto" ADD CONSTRAINT "contactos_reparto_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repartidores" ADD CONSTRAINT "repartidores_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contactos_reparto_repartidor_idx" ON "contactos_reparto" USING btree ("repartidor_id");--> statement-breakpoint
CREATE INDEX "repartidores_comunas_idx" ON "repartidores" USING gin ("comunas");--> statement-breakpoint
CREATE INDEX "repartidores_activo_idx" ON "repartidores" USING btree ("activo");