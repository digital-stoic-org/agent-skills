#!/usr/bin/env python3
"""
convert-md-to-pdf - Convert Markdown with Mermaid to styled PDF

Usage:
    python converter.py input.md [output.pdf] [--style=default]
"""

import argparse
import os
import re
import subprocess
import tempfile
from pathlib import Path

import markdown
from pygments.formatters import HtmlFormatter
from weasyprint import HTML, CSS


SCRIPT_DIR = Path(__file__).parent
STYLES_DIR = SCRIPT_DIR.parent / "styles"
TEMPLATES_DIR = SCRIPT_DIR.parent / "templates"

# Security: Use local temp directory instead of shared /tmp
# This avoids permission issues and is more secure
LOCAL_TMP = Path.cwd() / ".tmp"
LOCAL_TMP.mkdir(parents=True, exist_ok=True)

# Override Python's tempfile to use local directory
tempfile.tempdir = str(LOCAL_TMP)


def extract_mermaid_blocks(md_content: str) -> tuple[str, list[str]]:
    """Extract mermaid code blocks and replace with placeholders."""
    pattern = r'```mermaid\n(.*?)```'
    blocks = re.findall(pattern, md_content, re.DOTALL)

    placeholder_md = md_content
    for i, block in enumerate(blocks):
        placeholder_md = placeholder_md.replace(
            f'```mermaid\n{block}```',
            f'<div class="mermaid-diagram" id="mermaid-{i}"></div>',
            1
        )
    return placeholder_md, blocks


def find_mmdc() -> tuple[list[str], str | None]:
    """Find mmdc and puppeteer config, return command list to run with bun."""
    puppeteer_config = None

    # Check local node_modules first (traverse up to find it)
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        local_mmdc = parent / 'node_modules' / '@mermaid-js' / 'mermaid-cli' / 'src' / 'index.js'
        if local_mmdc.exists():
            # Run with bun directly to avoid /tmp/claude permission issues
            bun_path = Path.home() / '.bun' / 'bin' / 'bun'
            if bun_path.exists():
                mmdc_cmd = [str(bun_path), 'run', str(local_mmdc)]
            else:
                mmdc_cmd = ['bun', 'run', str(local_mmdc)]

            # Check for puppeteer config
            config_path = parent / 'puppeteer-config.json'
            if config_path.exists():
                puppeteer_config = str(config_path)
            return mmdc_cmd, puppeteer_config

    # Fallback to mmdc in PATH
    return ['mmdc'], puppeteer_config


def get_subprocess_env() -> dict:
    """Get environment with all temp directories pointing to LOCAL_TMP."""
    env = os.environ.copy()
    tmp_str = str(LOCAL_TMP)

    # CRITICAL: Unset CLAUDECODE to prevent bun from using /tmp/claude/
    # Bun hardcodes /tmp/claude/ as temp dir when it detects Claude Code
    env.pop('CLAUDECODE', None)
    env.pop('CLAUDE_CODE_ENTRYPOINT', None)

    # Standard temp vars
    env['TMPDIR'] = tmp_str
    env['TEMP'] = tmp_str
    env['TMP'] = tmp_str

    # Node/npm/bun specific
    env['npm_config_tmp'] = tmp_str
    env['BUN_TMPDIR'] = tmp_str
    env['BUN_INSTALL_CACHE_DIR'] = tmp_str

    # Puppeteer specific
    env['PUPPETEER_TMP_DIR'] = tmp_str
    env['PUPPETEER_CACHE_DIR'] = str(LOCAL_TMP / "puppeteer")

    return env


def render_mermaid_to_png(mermaid_code: str, output_path: Path) -> str:
    """Render mermaid code to PNG using mmdc, return as base64 img tag."""
    import base64

    input_path = LOCAL_TMP / f"mermaid-input-{os.getpid()}.mmd"
    input_path.write_text(mermaid_code)

    png_path = output_path.with_suffix('.png')

    try:
        mmdc_cmd, puppeteer_config = find_mmdc()
        cmd = mmdc_cmd + ['-i', str(input_path), '-o', str(png_path),
               '-b', 'white', '-t', 'default', '-s', '2']
        if puppeteer_config:
            cmd.extend(['-p', puppeteer_config])

        subprocess.run(cmd, check=True, capture_output=True, env=get_subprocess_env())

        # Convert to base64 data URI for embedding
        png_data = png_path.read_bytes()
        b64 = base64.b64encode(png_data).decode('utf-8')
        return f'<img src="data:image/png;base64,{b64}" style="max-width:100%; max-height:220mm; object-fit:contain;" />'
    finally:
        input_path.unlink(missing_ok=True)
        png_path.unlink(missing_ok=True)


def load_style(style_name: str) -> str:
    """Load CSS from styles directory."""
    style_path = STYLES_DIR / f"{style_name}.css"
    if not style_path.exists():
        available = [f.stem for f in STYLES_DIR.glob("*.css")]
        raise ValueError(f"Style '{style_name}' not found. Available: {available}")
    return style_path.read_text()


def load_template() -> str:
    """Load HTML base template."""
    template_path = TEMPLATES_DIR / "base.html"
    if template_path.exists():
        return template_path.read_text()
    return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <style>{pygments_css}</style>
</head>
<body>
{content}
</body>
</html>"""


def convert_md_to_pdf(
    input_path: Path,
    output_path: Path | None = None,
    style: str = 'default'
) -> Path:
    """Convert markdown file to PDF with Mermaid support."""

    if output_path is None:
        output_path = input_path.with_suffix('.pdf')

    md_content = input_path.read_text()
    md_without_mermaid, mermaid_blocks = extract_mermaid_blocks(md_content)

    # Use local temp directory
    tmpdir = LOCAL_TMP / f"convert-{os.getpid()}"
    tmpdir.mkdir(parents=True, exist_ok=True)

    try:
        # Render Mermaid diagrams to SVG
        svg_contents = []
        for i, block in enumerate(mermaid_blocks):
            svg_path = tmpdir / f'mermaid-{i}.svg'
            try:
                img_content = render_mermaid_to_png(block, svg_path)
                svg_contents.append(img_content)
            except subprocess.CalledProcessError as e:
                svg_contents.append(f'<pre class="mermaid-error">Mermaid error: {e}</pre>')
            except FileNotFoundError:
                svg_contents.append('<pre class="mermaid-error">mmdc not found. Install: npm install @mermaid-js/mermaid-cli</pre>')

        # Convert markdown to HTML
        md_extensions = [
            'tables',
            'fenced_code',
            'codehilite',
            'toc',
            'attr_list',
            'md_in_html'
        ]
        extension_configs = {
            'codehilite': {
                'css_class': 'highlight',
                'guess_lang': True
            }
        }
        html_body = markdown.markdown(
            md_without_mermaid,
            extensions=md_extensions,
            extension_configs=extension_configs
        )

        # Insert SVG diagrams
        for i, svg in enumerate(svg_contents):
            html_body = html_body.replace(
                f'<div class="mermaid-diagram" id="mermaid-{i}"></div>',
                f'<div class="mermaid-diagram">{svg}</div>'
            )

        # Build full HTML
        template = load_template()
        pygments_css = HtmlFormatter(style='default').get_style_defs('.highlight')

        html_content = template.format(
            title=input_path.stem,
            pygments_css=pygments_css,
            content=html_body
        )

        # Load style CSS
        style_css = load_style(style)

        # Generate PDF
        HTML(string=html_content).write_pdf(
            output_path,
            stylesheets=[CSS(string=style_css)]
        )
    finally:
        # Cleanup temp directory
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

    print(f"✓ Generated: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description='Convert Markdown to PDF')
    parser.add_argument('input', type=Path, help='Input markdown file')
    parser.add_argument('output', type=Path, nargs='?', help='Output PDF file')
    parser.add_argument('--style', default='default',
                        help='CSS style (default, modern, minimal, report)')

    args = parser.parse_args()
    convert_md_to_pdf(args.input, args.output, args.style)


if __name__ == '__main__':
    main()
