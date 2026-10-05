"""Publish the shapefile ZIPs in media/geoserver/shp_zip to GeoServer and style them.

From the host:
    python backend/script/push_to_geoserver.py
or inside the backend container:
    docker compose exec backend python script/push_to_geoserver.py
"""
import sys
from pathlib import Path

import requests

# Make `media.config` importable however the script is started
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from media.config import (  # noqa: E402
    GEOSERVER_BASIN_LAYER,
    GEOSERVER_PASSWORD,
    GEOSERVER_USER,
    GEOSERVER_VILLAGE_LAYER,
    GEOSERVER_WORKSPACE,
    MEDIA_DIR,
    geoserver_url,
)

# GeoServer config (host: localhost:<GEOSERVER_PORT>, container: geoserver:8080)
GEOSERVER_URL = f"{geoserver_url()}/rest"
WORKSPACE = GEOSERVER_WORKSPACE
AUTH = (GEOSERVER_USER, GEOSERVER_PASSWORD)

# Directory containing all shapefile ZIPs
ZIP_DIR = MEDIA_DIR / "geoserver" / "shp_zip"

# Layer name (= .shp name inside the zip) -> style applied to it
LAYER_STYLES = {
    GEOSERVER_VILLAGE_LAYER: "village_outline",
    GEOSERVER_BASIN_LAYER: "basin_outline",
}

STYLES = {
    # Thin light outlines that read on top of satellite imagery; names appear when zoomed in
    "village_outline": """<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer><Name>village_outline</Name><UserStyle><FeatureTypeStyle>
    <Rule>
      <PolygonSymbolizer>
        <Fill><CssParameter name="fill">#a7f3d0</CssParameter><CssParameter name="fill-opacity">0.04</CssParameter></Fill>
        <Stroke><CssParameter name="stroke">#d1fae5</CssParameter><CssParameter name="stroke-width">0.6</CssParameter><CssParameter name="stroke-opacity">0.5</CssParameter></Stroke>
      </PolygonSymbolizer>
    </Rule>
    <Rule>
      <MaxScaleDenominator>60000</MaxScaleDenominator>
      <TextSymbolizer>
        <Label><ogc:PropertyName>village</ogc:PropertyName></Label>
        <Font><CssParameter name="font-family">SansSerif</CssParameter><CssParameter name="font-size">11</CssParameter></Font>
        <LabelPlacement><PointPlacement><AnchorPoint><AnchorPointX>0.5</AnchorPointX><AnchorPointY>0.5</AnchorPointY></AnchorPoint></PointPlacement></LabelPlacement>
        <Halo><Radius>1.5</Radius><Fill><CssParameter name="fill">#052e16</CssParameter></Fill></Halo>
        <Fill><CssParameter name="fill">#ecfdf5</CssParameter></Fill>
        <VendorOption name="autoWrap">80</VendorOption>
        <VendorOption name="maxDisplacement">20</VendorOption>
      </TextSymbolizer>
    </Rule>
  </FeatureTypeStyle></UserStyle></NamedLayer>
</StyledLayerDescriptor>""",
    "basin_outline": """<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer><Name>basin_outline</Name><UserStyle><FeatureTypeStyle>
    <Rule>
      <LineSymbolizer>
        <Stroke><CssParameter name="stroke">#052e16</CssParameter><CssParameter name="stroke-width">5</CssParameter><CssParameter name="stroke-opacity">0.6</CssParameter></Stroke>
      </LineSymbolizer>
      <LineSymbolizer>
        <Stroke><CssParameter name="stroke">#facc15</CssParameter><CssParameter name="stroke-width">2.2</CssParameter></Stroke>
      </LineSymbolizer>
    </Rule>
  </FeatureTypeStyle></UserStyle></NamedLayer>
</StyledLayerDescriptor>""",
}


def create_workspace():
    url = f"{GEOSERVER_URL}/workspaces"
    headers = {"Content-Type": "text/xml"}
    data = f"<workspace><name>{WORKSPACE}</name></workspace>"
    response = requests.post(url, auth=AUTH, headers=headers, data=data)

    if response.status_code in [201, 409]:
        print(f"[✓] Workspace '{WORKSPACE}' exists or created.")
    else:
        print(f"[!] Workspace error: {response.status_code} - {response.text}")


def upload_shapefile(zip_path):
    store_name = zip_path.stem
    url = f"{GEOSERVER_URL}/workspaces/{WORKSPACE}/datastores/{store_name}/file.shp"
    headers = {"Content-type": "application/zip"}

    with open(zip_path, 'rb') as f:
        response = requests.put(url, auth=AUTH, headers=headers, data=f)

    if response.status_code in [201, 202]:
        print(f"[✓] Uploaded and published: '{store_name}'")
    else:
        print(f"[!] Failed to upload '{store_name}': {response.status_code} - {response.text}")


def upsert_style(name, sld):
    headers = {"Content-type": "application/vnd.ogc.sld+xml"}
    url = f"{GEOSERVER_URL}/workspaces/{WORKSPACE}/styles"
    exists = requests.get(f"{url}/{name}.json", auth=AUTH).status_code == 200
    if exists:
        response = requests.put(f"{url}/{name}", auth=AUTH, headers=headers, data=sld.encode())
    else:
        response = requests.post(url, params={"name": name}, auth=AUTH, headers=headers, data=sld.encode())

    if response.status_code in [200, 201]:
        print(f"[✓] Style '{name}' {'updated' if exists else 'created'}.")
    else:
        print(f"[!] Style '{name}' error: {response.status_code} - {response.text}")


def set_default_style(layer, style):
    url = f"{GEOSERVER_URL}/layers/{WORKSPACE}:{layer}"
    body = {"layer": {"defaultStyle": {"name": f"{WORKSPACE}:{style}"}}}
    response = requests.put(url, auth=AUTH, json=body)

    if response.status_code == 200:
        print(f"[✓] Layer '{layer}' uses style '{style}'.")
    else:
        print(f"[!] Could not style layer '{layer}': {response.status_code} - {response.text}")


if __name__ == "__main__":
    print(f"[*] GeoServer: {GEOSERVER_URL}")
    create_workspace()

    if not ZIP_DIR.exists():
        print(f"[!] Directory not found: {ZIP_DIR}")
    else:
        print(f"\n[*] Processing shapefiles from: {ZIP_DIR.name}")
        for zip_file in sorted(ZIP_DIR.glob("*.zip")):
            upload_shapefile(zip_file)

    print("\n[*] Styling layers")
    for name, sld in STYLES.items():
        upsert_style(name, sld)
    for layer, style in LAYER_STYLES.items():
        set_default_style(layer, style)
