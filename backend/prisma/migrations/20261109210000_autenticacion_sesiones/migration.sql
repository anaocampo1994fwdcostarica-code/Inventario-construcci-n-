-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `bloqueadoHasta` DATETIME(3) NULL,
    ADD COLUMN `intentosFallidos` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL,
    ADD COLUMN `ultimoLoginAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Sesion` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiraAt` DATETIME(3) NOT NULL,
    `revocadaAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Sesion_tokenHash_key`(`tokenHash`),
    INDEX `Sesion_usuarioId_expiraAt_idx`(`usuarioId`, `expiraAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sesion` ADD CONSTRAINT `Sesion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
