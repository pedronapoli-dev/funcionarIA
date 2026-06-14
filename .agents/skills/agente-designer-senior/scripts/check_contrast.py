#!/usr/bin/env python3
"""Verificador de contraste WCAG 2.2.

Calcula a razão de contraste entre duas cores e reporta conformidade AA/AAA para
texto normal, texto grande e componentes de UI / não-texto.

Uso:
    python check_contrast.py "#1a1a2e" "#ffffff"
    python check_contrast.py 26,26,46 255,255,255
    python check_contrast.py "#1a1a2e" "#ffffff" --json

Limiares (WCAG 2.2, nível AA / AAA):
    Texto normal:      AA 4.5:1   AAA 7:1
    Texto grande:      AA 3:1     AAA 4.5:1   (>=24px, ou >=18.66px/14pt bold)
    Não-texto (UI):    >=3:1      (1.4.11 — componentes, ícones, foco)
"""
from __future__ import annotations

import argparse
import json
import sys


def parse_color(value: str) -> tuple[int, int, int]:
    """Aceita '#rrggbb', 'rrggbb', '#rgb' ou 'r,g,b'."""
    v = value.strip()
    if "," in v:
        parts = [int(p) for p in v.split(",")]
        if len(parts) != 3 or any(not 0 <= p <= 255 for p in parts):
            raise ValueError(f"RGB inválido: {value}")
        return parts[0], parts[1], parts[2]
    v = v.lstrip("#")
    if len(v) == 3:
        v = "".join(c * 2 for c in v)
    if len(v) != 6:
        raise ValueError(f"Hex inválido: {value}")
    return int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16)


def _linearize(channel: int) -> float:
    c = channel / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = (_linearize(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    l1, l2 = relative_luminance(c1), relative_luminance(c2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def evaluate(ratio: float) -> dict:
    return {
        "ratio": round(ratio, 2),
        "normal_text_AA": ratio >= 4.5,
        "normal_text_AAA": ratio >= 7.0,
        "large_text_AA": ratio >= 3.0,
        "large_text_AAA": ratio >= 4.5,
        "ui_nontext_3to1": ratio >= 3.0,
    }


def _fmt(ok: bool) -> str:
    return "PASS" if ok else "FAIL"


def main() -> int:
    ap = argparse.ArgumentParser(description="Verificador de contraste WCAG 2.2")
    ap.add_argument("color1", help="cor do texto (hex ou r,g,b)")
    ap.add_argument("color2", help="cor de fundo (hex ou r,g,b)")
    ap.add_argument("--json", action="store_true", help="saída em JSON")
    args = ap.parse_args()

    try:
        c1, c2 = parse_color(args.color1), parse_color(args.color2)
    except ValueError as e:
        print(f"Erro: {e}", file=sys.stderr)
        return 2

    result = evaluate(contrast_ratio(c1, c2))
    result["color1"] = args.color1
    result["color2"] = args.color2

    if args.json:
        print(json.dumps(result, indent=2))
        return 0

    print(f"Contraste {args.color1} sobre {args.color2}: {result['ratio']}:1\n")
    print(f"  Texto normal  AA (4.5:1): {_fmt(result['normal_text_AA'])}")
    print(f"  Texto normal AAA (7:1)  : {_fmt(result['normal_text_AAA'])}")
    print(f"  Texto grande  AA (3:1)  : {_fmt(result['large_text_AA'])}")
    print(f"  Texto grande AAA (4.5:1): {_fmt(result['large_text_AAA'])}")
    print(f"  UI/não-texto  (3:1)     : {_fmt(result['ui_nontext_3to1'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
