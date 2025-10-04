#!/usr/bin/env python3
"""
process_fire.py

Process MOD14A2 fire mask TIFFs to extract burned areas as GeoJSON polygons.

Usage: python process_fire.py
Outputs: burned_areas.geojson
"""
import rasterio
from rasterio.features import shapes
import json
from shapely.geometry import shape, mapping
import os

def main():
    # Paths to fire mask TIFFs
    fire_masks = [
        'Datasets Areas quemadas/MOD14A2.061_FireMask_doy2025265000000_aid0001.tif',
        'Datasets Areas quemadas/MYD14A2.061_FireMask_doy2025265000000_aid0001.tif'
    ]

    features = []
    date = '2025-09-22'  # doy 265 is Sep 22, 2025

    for tif_path in fire_masks:
        if not os.path.exists(tif_path):
            print(f"File not found: {tif_path}")
            continue

        with rasterio.open(tif_path) as src:
            mask = src.read(1)
            # Assume burned if > 0
            burned = (mask > 0).astype('uint8')

            # Polygonize
            results = shapes(burned, mask=burned, transform=src.transform)

            for geom, val in results:
                if val == 1:  # burned
                    # Convert to shapely for potential simplification, but keep as is
                    poly = shape(geom)
                    # Add properties
                    feature = {
                        "type": "Feature",
                        "geometry": mapping(poly),
                        "properties": {
                            "date": date,
                            "source": os.path.basename(tif_path)
                        }
                    }
                    features.append(feature)

    # Create GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open('burned_areas.geojson', 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"GeoJSON created with {len(features)} features.")

if __name__ == '__main__':
    main()
