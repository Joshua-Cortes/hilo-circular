CREATE TYPE "public"."condicion_prenda" AS ENUM('nueva_con_etiqueta', 'como_nueva', 'buen_estado', 'con_detalles');--> statement-breakpoint
CREATE TYPE "public"."estado_publicacion" AS ENUM('disponible', 'reservada', 'vendida');--> statement-breakpoint
CREATE TABLE "conversaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publicacion_id" uuid NOT NULL,
	"comprador_id" uuid NOT NULL,
	"vendedor_id" uuid NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_mensaje_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fotos_publicacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publicacion_id" uuid NOT NULL,
	"orden" integer NOT NULL,
	"mime" text NOT NULL,
	"datos" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensajes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversacion_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"leido_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publicaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendedor_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"prenda" "tipo_prenda" NOT NULL,
	"talla" text NOT NULL,
	"condicion" "condicion_prenda" NOT NULL,
	"precio" integer NOT NULL,
	"comuna" text NOT NULL,
	"whatsapp" text,
	"estado" "estado_publicacion" DEFAULT 'disponible' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_publicacion_id_publicaciones_id_fk" FOREIGN KEY ("publicacion_id") REFERENCES "public"."publicaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_comprador_id_usuarios_id_fk" FOREIGN KEY ("comprador_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_vendedor_id_usuarios_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotos_publicacion" ADD CONSTRAINT "fotos_publicacion_publicacion_id_publicaciones_id_fk" FOREIGN KEY ("publicacion_id") REFERENCES "public"."publicaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacion_id_conversaciones_id_fk" FOREIGN KEY ("conversacion_id") REFERENCES "public"."conversaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_vendedor_id_usuarios_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversaciones_publicacion_comprador_idx" ON "conversaciones" USING btree ("publicacion_id","comprador_id");--> statement-breakpoint
CREATE INDEX "conversaciones_comprador_idx" ON "conversaciones" USING btree ("comprador_id");--> statement-breakpoint
CREATE INDEX "conversaciones_vendedor_idx" ON "conversaciones" USING btree ("vendedor_id");--> statement-breakpoint
CREATE INDEX "fotos_publicacion_idx" ON "fotos_publicacion" USING btree ("publicacion_id");--> statement-breakpoint
CREATE INDEX "mensajes_conversacion_idx" ON "mensajes" USING btree ("conversacion_id","creado_en");--> statement-breakpoint
CREATE INDEX "publicaciones_vendedor_idx" ON "publicaciones" USING btree ("vendedor_id");--> statement-breakpoint
CREATE INDEX "publicaciones_estado_idx" ON "publicaciones" USING btree ("estado");