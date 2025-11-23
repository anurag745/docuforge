from typing import List, Optional
from sqlalchemy import select, insert
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.models import Project, Section, Revision, Comment, LLMLog
from datetime import datetime
from typing import Dict, Any
from app.services.llm_service import llm_service
from app.database import get_session
import asyncio


async def create_section(session: AsyncSession, project_id: int, title: str, content: str, order_index: int = 0) -> Section:
    sec = Section(project_id=project_id, title=title, content=content, draft=False, order_index=order_index)
    session.add(sec)
    await session.commit()
    await session.refresh(sec)
    return sec


async def get_project_files(session: AsyncSession, project_id: int, owner_id: int) -> Dict[str, Any]:
    # verify project exists
    proj = await get_project(session, project_id, owner_id)
    # load sections
    sections = proj.sections
    # load revisions and comments for each
    files = {
        "project": {
            "id": proj.id,
            "title": proj.title,
            "docType": proj.docType,
            "topic": proj.topic,
            "created_at": proj.created_at.isoformat() if proj.created_at else None,
            "updated_at": proj.updated_at.isoformat() if proj.updated_at else None,
        },
        "sections": [],
        "revisions": [],
        "comments": [],
        "llm_logs": []
    }
    for s in sections:
        files["sections"].append({
            "id": s.id,
            "title": s.title,
            "content": s.content,
            "draft": s.draft,
            "order_index": s.order_index,
        })
        for r in s.revisions:
            files["revisions"].append({"id": r.id, "section_id": r.section_id, "text": r.text, "prompt": r.prompt, "created_at": r.created_at.isoformat() if r.created_at else None})
        for c in s.comments:
            files["comments"].append({"id": c.id, "section_id": c.section_id, "author_id": c.author_id, "text": c.text, "created_at": c.created_at.isoformat() if c.created_at else None})

    # llm logs related to project
    q = select(LLMLog).where(LLMLog.project_id == project_id)
    res = (await session.execute(q)).scalars().all()
    for l in res:
        files["llm_logs"].append({"id": l.id, "project_id": l.project_id, "section_id": l.section_id, "provider": l.provider, "prompt": l.prompt, "output": l.output, "tokens": l.tokens, "cost_estimate": l.cost_estimate, "created_at": l.created_at.isoformat() if l.created_at else None})
    return files


async def list_projects(session: AsyncSession, owner_id: int) -> List[Project]:
    # Eager-load sections to avoid lazy-loading during response serialization
    q = select(Project).where(Project.owner_id == owner_id).options(selectinload(Project.sections))
    res = (await session.execute(q)).scalars().all()
    return res


async def create_project(session: AsyncSession, owner_id: int, title: str, docType: str, topic: Optional[str], scaffold: Optional[str]):
    if docType not in ("docx", "pptx"):
        raise HTTPException(status_code=400, detail="docType must be 'docx' or 'pptx'")
    project = Project(owner_id=owner_id, title=title, docType=docType, topic=topic, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    session.add(project)
    await session.commit()
    await session.refresh(project)

    # create a basic section if scaffold provided
    if scaffold:
        sec = Section(project_id=project.id, title="Introduction", content=scaffold, draft=False, order_index=0)
        session.add(sec)
        await session.commit()
        return await get_project(session, project.id, owner_id)

    # Otherwise, if topic provided, suggest an outline synchronously and create section placeholders
    if topic:
        try:
            titles = await llm_service.suggest_outline(topic, docType)
        except Exception:
            titles = []

        order = 0
        created_section_ids = []
        for idx, t in enumerate(titles):
            sec = Section(project_id=project.id, title=t or f"Section {idx+1}", content="", draft=False, order_index=order)
            session.add(sec)
            await session.commit()
            await session.refresh(sec)
            created_section_ids.append(sec.id)
            order += 1

        # schedule background generation task to fill content for these sections
        # create a fire-and-forget asyncio task; it will create its own DB session
        async def _bg_generate(project_id: int, owner_id: int, section_ids: list, topic: str):
            try:
                async with get_session() as bg_session:
                    # reload project to ensure fresh state
                    proj = await get_project(bg_session, project_id, owner_id)
                    sections = [s for s in proj.sections if s.id in section_ids]
                    for idx, s in enumerate(sections):
                        try:
                            # If a template exists on the project or passed context, prefer it (background generation uses project.docType)
                            out = await llm_service.generate(project_id, s.id, idx, context=topic, docType=proj.docType)
                            text = out.get("text") if isinstance(out, dict) else str(out)
                        except Exception:
                            text = ""
                        # update section content and create revision and log
                        s.content = text
                        bg_session.add(s)
                        await bg_session.commit()
                        try:
                            await append_revision(bg_session, s.id, text, f"AI-generated during background creation: {s.title}")
                        except Exception:
                            pass
                        try:
                            await log_llm(bg_session, project_id, s.id, llm_service.provider, f"background generate for {s.title}", text)
                        except Exception:
                            pass
            except Exception:
                # swallow exceptions in background task to avoid crashing main loop
                pass

        asyncio.create_task(_bg_generate(project.id, owner_id, created_section_ids, topic))

    return await get_project(session, project.id, owner_id)


async def get_project(session: AsyncSession, project_id: int, owner_id: int):
    # Eager-load sections (and keep option to add further nested eager loads if needed)
    q = select(Project).where(Project.id == project_id, Project.owner_id == owner_id).options(selectinload(Project.sections))
    project = (await session.execute(q)).scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def append_revision(session: AsyncSession, section_id: int, text: str, prompt: str):
    rev = Revision(section_id=section_id, text=text, prompt=prompt)
    session.add(rev)
    await session.commit()
    await session.refresh(rev)
    # also update section content
    q = await session.get(Section, section_id)
    if q:
        q.content = text
        await session.commit()
    return rev


async def add_comment(session: AsyncSession, section_id: int, author_id: Optional[int], text: str):
    c = Comment(section_id=section_id, author_id=author_id, text=text)
    session.add(c)
    await session.commit()
    await session.refresh(c)
    return c


async def log_llm(session: AsyncSession, project_id: int, section_id: Optional[int], provider: str, prompt: str, output: str, tokens: Optional[int] = None, cost_estimate: Optional[float] = None):
    log = LLMLog(project_id=project_id, section_id=section_id, provider=provider, prompt=prompt, output=output, tokens=tokens, cost_estimate=cost_estimate)
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


async def delete_project(session: AsyncSession, project_id: int, owner_id: int):
    """Delete a project and its related sections/revisions/comments. Raises HTTPException if not found or not owned."""
    proj = await get_project(session, project_id, owner_id)
    # session.delete works with ORM object
    await session.delete(proj)
    await session.commit()
    return True
