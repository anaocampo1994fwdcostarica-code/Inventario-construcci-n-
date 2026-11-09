-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `identificacion` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'ENCARGADO_BODEGA', 'SUPERVISOR_OBRA', 'CONSULTA') NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_identificacion_key`(`identificacion`),
    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `unidadMedida` VARCHAR(191) NOT NULL,
    `stockMinimo` DECIMAL(14, 3) NOT NULL,
    `stockMaximo` DECIMAL(14, 3) NOT NULL,
    `demandaDiariaPromedio` DECIMAL(14, 3) NOT NULL,
    `demandaDiariaMaxima` DECIMAL(14, 3) NOT NULL,
    `tiempoEntregaDias` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Material_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ubicacion` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` ENUM('BODEGA', 'OBRA') NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ubicacion_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proveedor` (
    `id` VARCHAR(191) NOT NULL,
    `identificacion` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Proveedor_identificacion_key`(`identificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenCompra` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `proveedorId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('BORRADOR', 'SOLICITADA', 'APROBADA', 'PARCIALMENTE_RECIBIDA', 'RECIBIDA', 'CANCELADA') NOT NULL DEFAULT 'BORRADOR',
    `responsableId` VARCHAR(191) NOT NULL,
    `total` DECIMAL(14, 2) NOT NULL,
    `observaciones` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OrdenCompra_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleOrdenCompra` (
    `id` VARCHAR(191) NOT NULL,
    `ordenCompraId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `cantidad` DECIMAL(14, 3) NOT NULL,
    `precioUnitario` DECIMAL(14, 2) NOT NULL,
    `subtotal` DECIMAL(14, 2) NOT NULL,
    `cantidadRecibida` DECIMAL(14, 3) NOT NULL DEFAULT 0,

    INDEX `DetalleOrdenCompra_materialId_idx`(`materialId`),
    UNIQUE INDEX `DetalleOrdenCompra_ordenCompraId_materialId_key`(`ordenCompraId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovimientoInventario` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE') NOT NULL,
    `sentidoAjuste` ENUM('INCREMENTO', 'DECREMENTO') NULL,
    `cantidad` DECIMAL(14, 3) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` VARCHAR(191) NOT NULL,
    `ubicacionOrigenId` VARCHAR(191) NULL,
    `ubicacionDestinoId` VARCHAR(191) NULL,
    `documentoOrigen` VARCHAR(191) NULL,
    `ordenCompraId` VARCHAR(191) NULL,
    `detalleOrdenCompraId` VARCHAR(191) NULL,
    `observaciones` VARCHAR(191) NULL,

    INDEX `MovimientoInventario_materialId_fecha_idx`(`materialId`, `fecha`),
    INDEX `MovimientoInventario_ubicacionOrigenId_fecha_idx`(`ubicacionOrigenId`, `fecha`),
    INDEX `MovimientoInventario_ubicacionDestinoId_fecha_idx`(`ubicacionDestinoId`, `fecha`),
    INDEX `MovimientoInventario_ordenCompraId_idx`(`ordenCompraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlertaInventario` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `ubicacionId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PUNTO_REORDEN', 'STOCK_MAXIMO', 'STOCK_NEGATIVO', 'COMPRA_DUPLICADA') NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('ACTIVA', 'ATENDIDA', 'DESCARTADA') NOT NULL DEFAULT 'ACTIVA',
    `descripcion` VARCHAR(191) NOT NULL,
    `atendidaPorId` VARCHAR(191) NULL,
    `atendidaAt` DATETIME(3) NULL,

    INDEX `AlertaInventario_materialId_ubicacionId_estado_idx`(`materialId`, `ubicacionId`, `estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auditoria` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `entidad` VARCHAR(191) NOT NULL,
    `entidadId` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `detalles` JSON NULL,

    INDEX `Auditoria_entidad_entidadId_idx`(`entidad`, `entidadId`),
    INDEX `Auditoria_usuarioId_fecha_idx`(`usuarioId`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrdenCompra` ADD CONSTRAINT `OrdenCompra_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenCompra` ADD CONSTRAINT `OrdenCompra_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleOrdenCompra` ADD CONSTRAINT `DetalleOrdenCompra_ordenCompraId_fkey` FOREIGN KEY (`ordenCompraId`) REFERENCES `OrdenCompra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleOrdenCompra` ADD CONSTRAINT `DetalleOrdenCompra_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_ubicacionOrigenId_fkey` FOREIGN KEY (`ubicacionOrigenId`) REFERENCES `Ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_ubicacionDestinoId_fkey` FOREIGN KEY (`ubicacionDestinoId`) REFERENCES `Ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_ordenCompraId_fkey` FOREIGN KEY (`ordenCompraId`) REFERENCES `OrdenCompra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_detalleOrdenCompraId_fkey` FOREIGN KEY (`detalleOrdenCompraId`) REFERENCES `DetalleOrdenCompra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlertaInventario` ADD CONSTRAINT `AlertaInventario_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlertaInventario` ADD CONSTRAINT `AlertaInventario_ubicacionId_fkey` FOREIGN KEY (`ubicacionId`) REFERENCES `Ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlertaInventario` ADD CONSTRAINT `AlertaInventario_atendidaPorId_fkey` FOREIGN KEY (`atendidaPorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Auditoria` ADD CONSTRAINT `Auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
