#!/usr/bin/env python3
"""
process_sar.py

Ejemplo mínimo de procesamiento SAR: lectura de dos bandas (por ejemplo VV y VH),
conversión a dB, cálculo de diferencia/ratio y guardado de GeoTIFF resultante.

Requisitos: rasterio, numpy
Uso: python process_sar.py --vv path_to_vv.tif --vh path_to_vh.tif --out output_ratio.tif
"""
import argparse
import numpy as np
import rasterio

EPS = 1e-9


def to_db(arr):
    arr = arr.astype('float32')
    arr[arr < EPS] = EPS
    return 10.0 * np.log10(arr)


def main():
    p = argparse.ArgumentParser(description='Procesamiento SAR mínimo: VV/VH en dB')
    p.add_argument('--vv', required=True, help='GeoTIFF VV (linear)')
    p.add_argument('--vh', required=True, help='GeoTIFF VH (linear)')
    p.add_argument('--out', required=True, help='GeoTIFF de salida (diferencia VV-VH en dB)')
    args = p.parse_args()

    with rasterio.open(args.vv) as src_vv, rasterio.open(args.vh) as src_vh:
        vv = src_vv.read(1).astype('float32')
        vh = src_vh.read(1).astype('float32')

        # Convertir a dB
        vv_db = to_db(vv)
        vh_db = to_db(vh)

        # Calcular diferencia en dB (VV - VH) útil para resaltar estructura vertical
        diff_db = vv_db - vh_db

        profile = src_vv.profile.copy()
        profile.update(dtype=rasterio.float32, count=1, compress='lzw')

        with rasterio.open(args.out, 'w', **profile) as dst:
            dst.write(diff_db.astype(rasterio.float32), 1)

    print(f'Archivo de salida escrito: {args.out}')


if __name__ == '__main__':
    main()
