-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" VARCHAR(100),
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "oauth_connections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(100),
    "avatar" VARCHAR(500),
    "raw" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "oauth_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oauth_connections_user_id_idx" ON "oauth_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_connections_provider_provider_id_key" ON "oauth_connections"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_connections_user_id_provider_key" ON "oauth_connections"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
