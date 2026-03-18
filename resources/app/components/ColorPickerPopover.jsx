import React, { useState, useEffect } from "react";
import {
    Popover,
    ColorPicker,
    TextField,
    BlockStack,
    Button,
    InlineStack,
} from "@shopify/polaris";

function hexToHsv(hex) {
    if (!hex || typeof hex !== 'string') {
        hex = "#000000";
    }
    hex = hex.replace("#", "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                break;
            case g:
                h = ((b - r) / d + 2) * 60;
                break;
            case b:
                h = ((r - g) / d + 4) * 60;
                break;
        }
    }

    return {
        hue: h,
        saturation: max === 0 ? 0 : d / max,
        brightness: max,
    };
}

function hsvToHex({ hue, saturation, brightness }) {
    const f = (n, k = (n + hue / 60) % 6) =>
        brightness -
        brightness * saturation * Math.max(Math.min(k, 4 - k, 1), 0);

    return (
        "#" +
        [f(5), f(3), f(1)]
            .map(x => Math.round(x * 255).toString(16).padStart(2, "0"))
            .join("")
    );
}

function ColorPickerPopover({ value, onChange, activatorId }) {
    const [active, setActive] = useState(false);
    const [hsv, setHsv] = useState(hexToHsv(value));

    // Keep HSV in sync if parent hex changes
    useEffect(() => {
        setHsv(hexToHsv(value));
    }, [value]);

    const handleHsvChange = (newHsv) => {
        setHsv(newHsv);
        onChange(hsvToHex(newHsv));
    };

    const handleHexChange = (hex) => {
        if (/^#([0-9A-F]{6})$/i.test(hex)) {
            setHsv(hexToHsv(hex));
            onChange(hex);
        }
    };

    return (
        <Popover
            active={active}
            onClose={() => setActive(false)}
            activator={
                <div
                    id={activatorId}
                    onClick={() => setActive(v => !v)}
                    style={{
                        width: 40,
                        height: 32,
                        backgroundColor: value,
                        cursor: "pointer",
                        borderRadius: 4,
                        border: "1px solid #ccc",
                    }}
                />
            }
        >
            <div style={{ padding: 12, width: 230 }}>
                <BlockStack gap="300">
                    <ColorPicker
                        color={hsv}
                        onChange={handleHsvChange}
                    />

                    <TextField
                        label="Hex"
                        value={value}
                        onChange={handleHexChange}
                        autoComplete="off"
                    />

                    <InlineStack align="end">
                        <Button primary onClick={() => setActive(false)}>
                            Select
                        </Button>
                    </InlineStack>
                </BlockStack>
            </div>
        </Popover>
    );
}

export default ColorPickerPopover;
