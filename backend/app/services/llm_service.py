import os
import hashlib
import time
from typing import Optional, Dict, List, Any
import json
import httpx
import re
import logging

logger = logging.getLogger(__name__)

USE_MOCK = os.getenv("USE_MOCK", "true").lower() in ("1", "true", "yes")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
PREFER_OPENAI = bool(OPENAI_API_KEY)


class LLMService:
    def __init__(self):
        # prefer openai when an API key is present; otherwise use mock
        self.prefer_openai = PREFER_OPENAI
        self.provider = "openai" if self.prefer_openai else "mock"

    async def generate(self, project_id: int, section_id: Optional[int] = None, slide_index: Optional[int] = None, context: Optional[str] = None, docType: Optional[str] = "docx", template: Optional[str] = None) -> Dict[str, Any]:
        base = f"project:{project_id}|section:{section_id}|slide:{slide_index}"
        gen_id = hashlib.sha256(base.encode("utf-8")).hexdigest()[:12]
        # If an OpenAI key is available, attempt a real call and fall back to mock on any error.
        if self.prefer_openai:
            if not OPENAI_API_KEY:
                # defensive: if prefer_openai set but no key, fall back
                logger.warning("PREFER_OPENAI is true but OPENAI_API_KEY is missing; falling back to mock.")
            else:
                # Build a docType-aware prompt asking for structured HTML output.
                system = {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant that generates structured content for documents and presentations. "
                        "When asked, return structured output only — ideally JSON or a single HTML fragment. "
                        "For DOCX (report) output: return an HTML fragment with semantic tags (h2/h3, p, ul/li) representing the section content. "
                        "For PPTX (slides) output: return either a JSON object with keys like {\"title\":..., \"bullets\": [...], \"images\": [...]} or a JSON with an `html` field that contains safe HTML for the slide. "
                        "Do NOT include scripts, CSS, or extraneous commentary. Return strictly the JSON or HTML payload requested."
                    ),
                }

                # Provide human-friendly description and make instructions explicit for JSON structure
                doc_purpose = "a visual presentation (slides)" if (docType or "docx") == "pptx" else "a report-style document (docx)"

                if docType == "pptx":
                    user_instructions = (
                        f"Generate structured slide content for slide {slide_index if slide_index is not None else 1} for the project section. "
                        "Prefer returning a JSON object with these possible keys: `title` (string), `bullets` (array of short strings), `images` (array of {url, caption}), and optional `notes` (string). "
                        "If you return HTML instead, wrap slide content in semantic tags and return a JSON object with an `html` field. "
                        "Return ONLY the JSON object (no markdown fences, no commentary)."
                    )
                else:
                    user_instructions = (
                        f"Generate a report-style HTML fragment for a DOCX section titled '{context or ''}'. "
                        "Return either a single HTML string or a JSON object with an `html` field containing the HTML. "
                        "This should read like a short report section: include a heading (h2/h3) and 2-6 well-formed paragraphs, each made of 2-5 sentences (aim ~150-400 words total). "
                        "Use semantic tags (h2/h3, p, ul/li) and prefer full sentences and cohesive paragraphs rather than bullet fragments. "
                        "Return ONLY the HTML or JSON (no commentary)."
                    )

                # include template/style guidance if provided
                template_hint = f" Use the following template/style as a guide: {template}." if template else ""

                prompt = f"Generate content for {base}. This should be suitable for {doc_purpose}.{template_hint} {user_instructions}"
                if context:
                    prompt += " Context: " + context

                user = {"role": "user", "content": prompt}

                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                            json={"model": OPENAI_MODEL, "messages": [system, user], "max_tokens": 512},
                        )
                        resp.raise_for_status()
                        data = resp.json()
                        # extract assistant content
                        try:
                            content = data["choices"][0]["message"]["content"].strip()
                        except Exception:
                            content = json.dumps(data)

                        # Try to parse JSON first (preferred structured response)
                        parsed_html = None
                        parsed_struct: Optional[Dict[str, Any]] = None
                        parsed_meta: Dict[str, Any] = {"provider": "openai", "raw": data}
                        try:
                            maybe = json.loads(content)
                            if isinstance(maybe, dict):
                                parsed_struct = maybe
                                parsed_meta.update({"structured": True})
                            elif isinstance(maybe, list):
                                # list responses could be a list of strings - not ideal for generate but handle
                                parsed_struct = {"list": maybe}
                                parsed_meta.update({"structured": True})
                        except Exception:
                            parsed_struct = None

                        # If we got structured content, try to convert to HTML depending on docType
                        if parsed_struct:
                            # If returned an object with an `html` field, use it
                            if isinstance(parsed_struct, dict) and parsed_struct.get("html"):
                                parsed_html = str(parsed_struct.get("html") or "").strip()
                            else:
                                # build HTML from common slide/section keys
                                if docType == "pptx":
                                    # prefer title + bullets
                                    title = parsed_struct.get("title") or parsed_struct.get("heading") or ""
                                    bullets = parsed_struct.get("bullets") or parsed_struct.get("points") or []
                                    notes = parsed_struct.get("notes") or ""
                                    html_parts = []
                                    if title:
                                        html_parts.append(f"<h2>{title}</h2>")
                                    if bullets and isinstance(bullets, list):
                                        html_parts.append("<ul>")
                                        for b in bullets:
                                            html_parts.append(f"<li>{str(b)}</li>")
                                        html_parts.append("</ul>")
                                    if notes:
                                        html_parts.append(f"<p class=\"notes\">{notes}</p>")
                                    parsed_html = "".join(html_parts)
                                else:
                                    # docx -> sections, expect paragraphs
                                    title = parsed_struct.get("title") or parsed_struct.get("heading") or ""
                                    paragraphs = parsed_struct.get("paragraphs") or parsed_struct.get("paras") or parsed_struct.get("body") or []
                                    html_parts = []
                                    if title:
                                        html_parts.append(f"<h2>{title}</h2>")
                                    if isinstance(paragraphs, list) and paragraphs:
                                        # ensure paragraphs are longer, keep up to 8
                                        for p in paragraphs[:8]:
                                            html_parts.append(f"<p>{str(p)}</p>")
                                    else:
                                        # if structured dict has freeform text, try to split into multi-sentence paragraphs
                                        free = parsed_struct.get("text") or parsed_struct.get("content")
                                        if free:
                                            # split into sentences and group into paragraphs of ~3 sentences
                                            sents = [s.strip() for s in re.split(r"(?<=[\.\?!])\s+", str(free)) if s.strip()]
                                            paras = []
                                            i = 0
                                            while i < len(sents) and len(paras) < 8:
                                                group = sents[i:i+3]
                                                paras.append(" ".join(group))
                                                i += 3
                                            if not paras:
                                                paras = [str(free)]
                                            for p in paras:
                                                html_parts.append(f"<p>{p}</p>")
                                    parsed_html = "".join(html_parts)

                        if parsed_html is None:
                            # attempt to extract an HTML fragment from the assistant content
                            # strip markdown fences
                            content_clean = re.sub(r"```(?:html|json)?\n?", "", content)
                            content_clean = content_clean.replace('```', '')
                            # if content looks like HTML, use it
                            if "<" in content_clean and ">" in content_clean:
                                parsed_html = content_clean.strip()
                            else:
                                # fallback to wrapping raw text into doc-appropriate HTML
                                text_blob = content_clean.strip()
                                if docType == "pptx":
                                    # make short bullets from sentences
                                    sentences = [s.strip() for s in re.split(r"[\n\.]+", text_blob) if s.strip()][:6]
                                    bullets_html = "".join([f"<li>{s}</li>" for s in sentences])
                                    parsed_html = f"<h2>{(context or 'Slide')}</h2><ul>{bullets_html}</ul>"
                                else:
                                    # docx: aim for multiple, full-sentence paragraphs (group ~3 sentences per paragraph)
                                    sentences = [s.strip() for s in re.split(r"(?<=[\.\?!])\s+", text_blob) if s.strip()]
                                    if not sentences:
                                        paras = [text_blob]
                                    else:
                                        paras = []
                                        i = 0
                                        while i < len(sentences) and len(paras) < 8:
                                            group = sentences[i:i+3]
                                            paras.append(" ".join(group))
                                            i += 3
                                    parsed_html = "".join([f"<p>{p}</p>" for p in paras])

                        return {"text": parsed_html, "generationId": gen_id, "meta": parsed_meta}
                except Exception as e:
                    # Alert and fall back to mock
                    logger.exception("OpenAI generate failed, falling back to mock. Error: %s", e)
                    # continue to mock below

        # Mock fallback: return docType-appropriate HTML so downstream code sees semantic content
        if docType == "pptx":
            title = context or "Slide"
            bullets = [f"{title} point {i+1}" for i in range(3)]
            bullets_html = "".join([f"<li>{b}</li>" for b in bullets])
            text = f"<h2>{title}</h2><ul>{bullets_html}</ul>"
        else:
            title = context or "Section"
            paras = [f"This is a sample paragraph {i+1} for {title}." for i in range(3)]
            paras_html = "".join([f"<p>{p}</p>" for p in paras])
            text = f"<h2>{title}</h2>" + paras_html

        meta = {"provider": "mock", "created_at": int(time.time()), "fallback_to_mock": True}
        return {"text": text, "generationId": gen_id, "meta": meta}

    async def refine(self, section_text: str, prompt: str) -> str:
        # Prefer OpenAI if available, otherwise mock. On OpenAI error, log and return mock refinement.
        if self.prefer_openai and OPENAI_API_KEY:
            system = {"role": "system", "content": "You are a helpful assistant that refines section text according to a prompt."}
            user = {"role": "user", "content": f"Original text:\n{section_text}\n\nRefine with prompt: {prompt}"}
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                        json={"model": OPENAI_MODEL, "messages": [system, user], "max_tokens": 512},
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    try:
                        return data["choices"][0]["message"]["content"].strip()
                    except Exception:
                        return json.dumps(data)
            except Exception as e:
                logger.exception("OpenAI refine failed, falling back to mock. Error: %s", e)

        # Mock fallback
        return section_text + "\n\nRefined with prompt: " + prompt + "\n\n(Note: returned by mock fallback)"

    async def suggest_outline(self, topic: str, docType: str, template: Optional[str] = None) -> List[str]:
        # Generate a list of section titles (or slide titles) based on topic.
        # Accept an optional template hint so callers can pass template/style guidance.
        # Prefer OpenAI when a key is present; on failure, fall back to a mock list and log an alert.
        if self.prefer_openai and OPENAI_API_KEY:
            system = {"role": "system", "content": "You are an assistant that suggests an outline (list of section headers or slide titles) given a main topic."}
            template_hint = f" Use the following template/style as a guide: {template}." if template else ""
            user = {"role": "user", "content": f"Provide a JSON array of 5 concise {('slide titles' if docType=='pptx' else 'section headers')} for the topic: {topic}. Return only a JSON array of strings." + template_hint}
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                        json={"model": OPENAI_MODEL, "messages": [system, user], "max_tokens": 300},
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    try:
                        content = data["choices"][0]["message"]["content"].strip()
                    except Exception:
                        content = json.dumps(data)
            except Exception as e:
                logger.exception("OpenAI suggest_outline failed, falling back to mock. Error: %s", e)
                content = None

            # If content is None or empty, we'll fall back to mock below
        else:
            content = None

        if not content:
            # Mock fallback
            if docType == "pptx":
                return [f"{topic} - Slide {i+1}" for i in range(5)]
            return [f"{topic} - Section {i+1}" for i in range(5)]

        # Attempt robust cleaning/parsing of the assistant response
        try:
            # 1) Strip markdown fences
            content_clean = re.sub(r"```(?:json)?\n?", "", content)
            content_clean = content_clean.replace('```', '')

            # 2) Try to extract a JSON array from the text
            m = re.search(r"(\[\s*[^\]]+\s*\])", content_clean, flags=re.DOTALL)
            if m:
                try:
                    arr = json.loads(m.group(1))
                    if isinstance(arr, list):
                        return [str(x).strip().strip('"\'') for x in arr if str(x).strip()]
                except Exception:
                    # fall through to other parsing
                    logger.debug("Failed to parse JSON array from suggest_outline response", exc_info=True)

            # 3) If no JSON array, split lines and clean tokens
            lines = []
            for raw in content_clean.splitlines():
                s = raw.strip()
                if not s:
                    continue
                # remove common list prefixes
                s = re.sub(r"^[\-\*\d\.)\s]+", "", s)
                # drop stray braces or the token 'json'
                s = s.strip('{},"')
                s = s.replace('\\"', '"')
                s = s.strip()
                if s and s.lower() != 'json' and s not in ('{', '}'):
                    lines.append(s)

            # final cleanup: split any comma-joined line
            results: List[str] = []
            for l in lines:
                parts = [p.strip().strip('"') for p in re.split(r",\s*", l) if p.strip()]
                for p in parts:
                    if p and p not in results:
                        results.append(p)

            return results[:10]
        except Exception:
            logger.exception("Failed to parse suggest_outline content; falling back to mock. Raw content: %s", content)
            # Fallback to predictable mock titles if parsing fails
            if docType == "pptx":
                return [f"{topic} - Slide {i+1}" for i in range(5)]
            return [f"{topic} - Section {i+1}" for i in range(5)]


llm_service = LLMService()
