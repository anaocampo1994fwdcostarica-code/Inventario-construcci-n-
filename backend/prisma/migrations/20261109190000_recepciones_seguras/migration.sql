-- CreateTable
CREATE TABLE `RecepcionCompra` (
    `id` VARCHAR(191) NOT NULL,
    `ordenCompraId` VARCHAR(191) NOT NULL,
    `claveIdempotencia` VARCHAR(191) NOT NULL,
    `solicitudHash` CHAR(64) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `ubicacionId` VARCHAR(191) NOT NULL,
    `referencia` VARCHAR(191) NULL,
    `observaciones` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RecepcionCompra_claveIdempotencia_key`(`claveIdempotencia`),
    INDEX `RecepcionCompra_ordenCompraId_fecha_idx`(`ordenCompraId`, `fecha`),
    INDEX `RecepcionCompra_usuarioId_fecha_idx`(`usuarioId`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleRecepcion` (
    `id` VARCHAR(191) NOT NULL,
    `recepcionId` VARCHAR(191) NOT NULL,
    `detalleOrdenCompraId` VARCHAR(191) NOT NULL,
    `cantidad` DECIMAL(14, 3) NOT NULL,

    INDEX `DetalleRecepcion_detalleOrdenCompraId_idx`(`detalleOrdenCompraId`),
    UNIQUE INDEX `DetalleRecepcion_recepcionId_detalleOrdenCompraId_key`(`recepcionId`, `detalleOrdenCompraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `movimientoinventario` ADD COLUMN `detalleRecepcionId` VARCHAR(191) NULL,
    ADD COLUMN `recepcionCompraId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `MovimientoInventario_detalleRecepcionId_key` ON `movimientoinventario`(`detalleRecepcionId`);

-- AddForeignKey
ALTER TABLE `RecepcionCompra` ADD CONSTRAINT `RecepcionCompra_ordenCompraId_fkey` FOREIGN KEY (`ordenCompraId`) REFERENCES `OrdenCompra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RecepcionCompra` ADD CONSTRAINT `RecepcionCompra_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RecepcionCompra` ADD CONSTRAINT `RecepcionCompra_ubicacionId_fkey` FOREIGN KEY (`ubicacionId`) REFERENCES `Ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DetalleRecepcion` ADD CONSTRAINT `DetalleRecepcion_recepcionId_fkey` FOREIGN KEY (`recepcionId`) REFERENCES `RecepcionCompra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DetalleRecepcion` ADD CONSTRAINT `DetalleRecepcion_detalleOrdenCompraId_fkey` FOREIGN KEY (`detalleOrdenCompraId`) REFERENCES `DetalleOrdenCompra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `movimientoinventario` ADD CONSTRAINT `MovimientoInventario_detalleRecepcionId_fkey` FOREIGN KEY (`detalleRecepcionId`) REFERENCES `DetalleRecepcion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `movimientoinventario` ADD CONSTRAINT `MovimientoInventario_recepcionCompraId_fkey` FOREIGN KEY (`recepcionCompraId`) REFERENCES `RecepcionCompra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
