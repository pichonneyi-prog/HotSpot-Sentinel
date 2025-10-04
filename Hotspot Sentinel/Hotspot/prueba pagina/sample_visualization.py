#!/usr/bin/env python3
"""
sample_visualization.py

Script de ejemplo para visualizar un GeoTIFF SAR (una banda) con matplotlib.

Uso: python sample_visualization.py input.tif output.png
Requisitos: rasterio, matplotlib, numpy
"""
import argparse
import rasterio
import numpy as np
import matplotlib.pyplot as plt


def to_db(arr):
    arr = arr.astype('float32')
    arr[arr <= 0] = np.nan
    return 10.0 * np.log10(arr)


def main():
    p = argparse.ArgumentParser(description='Visualizar GeoTIFF SAR (una banda)')
    p.add_argument('input', help='GeoTIFF de entrada')
    p.add_argument('output', help='Archivo PNG de salida')
    args = p.parse_args()

    with rasterio.open(args.input) as src:
        arr = src.read(1)
        db = to_db(arr)

    plt.figure(figsize=(9,6))
    plt.imshow(db, cmap='viridis', vmin=np.nanpercentile(db,5), vmax=np.nanpercentile(db,95))
    plt.colorbar(label='dB')
    plt.title('Visualización SAR (dB)')
    plt.axis('off')
    plt.tight_layout()
    plt.savefig(args.output, dpi=200)
    print(f'Imagen guardada: {args.output}')


if __name__ == '__main__':
    main()
