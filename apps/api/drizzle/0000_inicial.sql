CREATE TYPE "public"."canal_contacto" AS ENUM('whatsapp', 'telefono');--> statement-breakpoint
CREATE TYPE "public"."categoria_servicio" AS ENUM('costura', 'zapateria', 'marroquineria', 'tejido', 'tapiceria');--> statement-breakpoint
CREATE TYPE "public"."estado_donacion" AS ENUM('registrada', 'recibida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."precision_ubicacion" AS ENUM('exacta', 'aproximada');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('persona', 'oficio', 'fundacion', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tipo_prenda" AS ENUM('polera_camisa', 'pantalon', 'falda_vestido', 'chaqueta_abrigo', 'sweater', 'ropa_infantil', 'uniforme_escolar', 'ropa_de_cama', 'calzado', 'bolso_cartera');--> statement-breakpoint
CREATE TABLE "contactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"oficio_id" uuid NOT NULL,
	"usuario_id" uuid,
	"canal" "canal_contacto" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fundacion_id" uuid NOT NULL,
	"donante_id" uuid,
	"items" jsonb NOT NULL,
	"total_prendas" integer NOT NULL,
	"kg_estimados" real NOT NULL,
	"estado" "estado_donacion" DEFAULT 'registrada' NOT NULL,
	"recibida_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fundaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"nombre" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"comuna" text NOT NULL,
	"direccion" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"horarios" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prendas_aceptadas" "tipo_prenda"[] DEFAULT '{}' NOT NULL,
	"necesidades_actuales" text DEFAULT '' NOT NULL,
	"acepta_danada" boolean DEFAULT false NOT NULL,
	"telefono" text,
	"email" text,
	"verificado" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oficios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre_publico" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"comuna" text NOT NULL,
	"direccion" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"precision_ubicacion" "precision_ubicacion" DEFAULT 'aproximada' NOT NULL,
	"whatsapp" text,
	"telefono" text,
	"verificado" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oficios_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"oficio_id" uuid NOT NULL,
	"categoria" "categoria_servicio" NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"prendas" "tipo_prenda"[] DEFAULT '{}' NOT NULL,
	"precio_desde" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"nombre" text NOT NULL,
	"rol" "rol" DEFAULT 'persona' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_oficio_id_oficios_id_fk" FOREIGN KEY ("oficio_id") REFERENCES "public"."oficios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_fundacion_id_fundaciones_id_fk" FOREIGN KEY ("fundacion_id") REFERENCES "public"."fundaciones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_donante_id_usuarios_id_fk" FOREIGN KEY ("donante_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fundaciones" ADD CONSTRAINT "fundaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oficios" ADD CONSTRAINT "oficios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_oficio_id_oficios_id_fk" FOREIGN KEY ("oficio_id") REFERENCES "public"."oficios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contactos_oficio_idx" ON "contactos" USING btree ("oficio_id");--> statement-breakpoint
CREATE INDEX "donaciones_fundacion_idx" ON "donaciones" USING btree ("fundacion_id");--> statement-breakpoint
CREATE INDEX "donaciones_donante_idx" ON "donaciones" USING btree ("donante_id");--> statement-breakpoint
CREATE INDEX "servicios_oficio_idx" ON "servicios" USING btree ("oficio_id");--> statement-breakpoint
CREATE INDEX "servicios_prendas_idx" ON "servicios" USING gin ("prendas");